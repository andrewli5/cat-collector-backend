# cat-collector-backend

Cat Collector is a gacha clicker game. This Express and MongoDB API controls the game data.

Players click to earn coins. They use the coins to roll for cats and buy upgrades.

The server controls all coin values. The client reports each click, and the server calculates its value.

## Run the server

```bash
nvm use                 # Use Node 22 or a later version.
npm install
cp .env.example .env    # Add the required values to the new file.
npm run dev             # Or run: npm start
```

| Script           | Purpose                              |
| ---------------- | ------------------------------------ |
| `npm start`      | Start the server                     |
| `npm run dev`    | Start the server with `node --watch` |
| `npm run lint`   | Run ESLint                           |
| `npm run format` | Run Prettier                         |
| `npm run check`  | Check the game balance calculations  |

### Environment

The server checks each environment variable when it starts. If a value is absent or not valid, the process prints an error and stops.

| Variable               | Required | Description                                               |
| ---------------------- | -------- | --------------------------------------------------------- |
| `DB_CONNECTION_STRING` | yes      | MongoDB URI that also supports the session store          |
| `SESSION_SECRET`       | yes      | A string with at least 32 characters                      |
| `CORS_ORIGINS`         | yes      | Allowed browser origins, with a comma between each origin |
| `NODE_ENV`             | no       | `development` (default), `test`, or `production`          |
| `PORT`                 | no       | Server port, with a default value of `4000`               |
| `SESSION_TTL_DAYS`     | no       | Session cookie life, with a default value of `7` days     |
| `SYNC_INDEXES`         | no       | Build the production indexes when the server starts       |

Outside production, Mongoose builds indexes with `autoIndex`. Production turns off `autoIndex`.

After an index change, deploy once with `SYNC_INDEXES=true`. The unique indexes prevent duplicate records for these items:

- Cat ownership
- Upgrade purchases
- Usernames

### Data

The `rarities` collection is the cat catalog. Each record has the shape `{ breed, rarity }`.

Add the catalog records before you start the game. The rarity codes are `C`, `U`, `R`, `E`, `L`, and `M`.

The roll process does not select a rarity that contains no cats.

## Architecture

```text
src/
  server.js          start the server, connect to the database, and stop safely
  app.js             configure Express middleware, routers, and error handlers
  config.js          check the environment configuration
  http.js            define errors, access checks, validation, and rate limits
  game/
    balance.js       store balance constants and upgrade data
    enums.js         store rarities, roles, and upgrade types
    stats.js         calculate stats and select gacha results
    stats.check.js   check the stat calculations
  users/             store the user DAO, service, and HTTP routes
  cats/              store the cat DAO, service, and HTTP routes
```

Routes process HTTP requests. Services apply the game rules. DAOs read and change stored data.

Add one entry to `game/balance.js` for each new upgrade tier. The entry contains its cost, odds, and effects.

The service calculates `rollCost`, `coinsPerClick`, and `critChance` from the owned cats and upgrades. The database does not store these values.

## API

All responses use JSON. Each error has the shape `{ "message": "..." }`.

Authentication uses a session cookie. Send requests with `credentials: "include"`.

Access values have these meanings:

- `public`: No session is necessary.
- `auth`: The user must sign in.
- `self`: The target user or an administrator can use the route.
- `admin`: Only an administrator can use the route.

| Method   | Path                                  | Access     | Notes                                       |
| -------- | ------------------------------------- | ---------- | ------------------------------------------- |
| `POST`   | `/api/users/signup`                   | public     | Send `{username, password}`                 |
| `POST`   | `/api/users/signin`                   | public     | Send `{username, password}`                 |
| `POST`   | `/api/users/signout`                  | public     | Return status 204                           |
| `GET`    | `/api/users`                          | admin      | Get all users                               |
| `GET`    | `/api/users/ranked`                   | auth       | Get users in order of their owned cat count |
| `GET`    | `/api/users/me`                       | auth       | Get the current user                        |
| `GET`    | `/api/users/by-username/:username`    | auth       | Find one user by username                   |
| `GET`    | `/api/users/:userId/data`             | self       | Get the profile and game data               |
| `PUT`    | `/api/users/:userId`                  | self/admin | Update a profile or administrator fields    |
| `POST`   | `/api/users/:userId/clicks`           | self       | Send `{clicks}` to get coins                |
| `POST`   | `/api/users/:userId/upgrades`         | self       | Send `{upgrade}` to buy an upgrade          |
| `GET`    | `/api/users/:userId/cats`             | auth       | Get the owned breeds                        |
| `GET`    | `/api/users/:userId/favorites`        | auth       | Get the favorite breeds                     |
| `POST`   | `/api/users/:userId/favorites`        | self       | Send `{breed}` to add a favorite            |
| `DELETE` | `/api/users/:userId/favorites/:breed` | self       | Delete a favorite and return status 204     |
| `POST`   | `/api/users/:userId/rolls`            | self       | Roll for a cat                              |
| `GET`    | `/api/cats/rarities`                  | public     | Get the cat catalog                         |
| `GET`    | `/api/cats/rarities/:rarity`          | public     | Get the breeds for one rarity               |
| `GET`    | `/api/info/odds`                      | public     | Get the drop tables                         |
| `GET`    | `/api/info/multipliers`               | public     | Get the coin multiplier for each rarity     |
| `GET`    | `/api/info/upgrades`                  | public     | Get the upgrade types, tiers, and costs     |
| `GET`    | `/health`                             | public     | Check the server                            |

Rate limits apply to authentication requests, clicks, and rolls. The server returns status 429 when a request exceeds a limit.

### Clicks

```text
POST /api/users/:userId/clicks   { "clicks": 25 }
→ { "earned": 1300, "crits": 0, "coins": 1800, "coinsPerClick": 52, "critChance": 0.005 }
```

The client reports a maximum of 25 clicks in one request. The server uses its own `coinsPerClick` value.

The server also selects critical clicks. The response contains the new coin balance.

### Rolls

```text
POST /api/users/:userId/rolls
→ { "breed": "bengal", "rarity": "R", "duplicate": false, "addedCoins": 0,
    "coins": 1700, "rollCost": 130, "coinsPerClick": 62, "critChance": 0.005 }
```

A duplicate cat gives the user `addedCoins`. A new cat adds the breed to the user collection.

## Client contract changes

This API changed the old client contract. The frontend must use the rules in this section.

### Authentication requirement

Each `/api/users/*` route requires a session unless the API table marks it as public. Each user cat route also requires a session.

The server returns status 403 when a user requests protected data for a different user.

### Password storage

The server stores new passwords as bcrypt hashes in `passwordHash`. The server ignores the old plaintext `password` field.

Reset or migrate each old account before its next sign-in attempt.

### Endpoint changes

| Before                                         | After                                      |
| ---------------------------------------------- | ------------------------------------------ |
| `PUT /api/users/:userId/coins`                 | Use `POST /api/users/:userId/clicks`       |
| `GET /api/cats/roll/:userId`                   | Use `POST /api/users/:userId/rolls`        |
| `POST /api/users/signup/user`                  | Use `POST /api/users/signup`               |
| `GET /api/users/:username`                     | Use `GET /api/users/by-username/:username` |
| `GET /api/cats/ownerships/:userId`             | Use `GET /api/users/:userId/cats`          |
| `GET /api/cats/favorites/:userId`              | Use `GET /api/users/:userId/favorites`     |
| `POST /api/cats/favorites/:userId`             | Use `POST /api/users/:userId/favorites`    |
| `DELETE /api/cats/favorites/:userId/:favorite` | Use `DELETE .../favorites/:breed`          |
| `POST /api/users/:userId/upgrade`              | Use `POST /api/users/:userId/upgrades`     |

### Response shapes

- User responses omit `password` and `passwordHash`.
- `signin` and `signup` return the public user fields.
- `signup` returns status 201.
- `signout` returns status 204 with no body.
- A favorite POST returns status 201.
- A favorite DELETE returns status 204 with no body.
- `GET /api/cats/rarities` returns `{breed, rarity}` without `_id` or `__v`.
- A roll response contains the new `coins` balance.
- An upgrade response contains `{upgrade, upgrades, coins, rollCost, coinsPerClick, critChance}`.
- An update endpoint returns the updated resource.

### Status codes

- A duplicate username or upgrade returns status 409.
- A request without authentication returns status 401.
- A request for a different user returns status 403.
- Input that is not valid returns status 400 with a problem description.

### Sign-up validation

A username must have 3 through 32 characters. Use only letters, digits, dots, dashes, and underscores.

A password must have at least 8 characters.

### Environment variable changes

Use `CORS_ORIGINS` instead of `FRONTEND_URL_DEV` and `FRONTEND_URL_PROD`. You must also set `SESSION_SECRET`.
