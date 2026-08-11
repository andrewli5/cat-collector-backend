# cat-collector-backend

Express + MongoDB API for Cat Collector, a gacha clicker game. Players earn coins by
clicking, spend them rolling for cats, and buy upgrades that improve their luck, crit
rate and roll cost.

The server is authoritative for all currency. Clients report _that_ a click happened;
the server decides what it was worth.

## Running it

```bash
nvm use            # Node 22+
npm install
cp .env.example .env   # then fill in the blanks
npm run dev        # or: npm start
```

| Script           | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `npm start`      | Run the server                              |
| `npm run dev`    | Run with `node --watch` auto-restart        |
| `npm run lint`   | ESLint                                      |
| `npm run format` | Prettier                                    |
| `npm run check`  | Assert-based check of the game-balance math |

### Environment

Every variable is validated at boot; the process exits with a readable error if any
are missing or malformed.

| Variable               | Required | Description                                         |
| ---------------------- | -------- | --------------------------------------------------- |
| `DB_CONNECTION_STRING` | yes      | MongoDB URI (also backs the session store)          |
| `SESSION_SECRET`       | yes      | ≥32 chars, e.g. `openssl rand -hex 32`              |
| `CORS_ORIGINS`         | yes      | Comma-separated allowed browser origins             |
| `NODE_ENV`             | no       | `development` (default), `test`, `production`       |
| `PORT`                 | no       | Default `4000`                                      |
| `SESSION_TTL_DAYS`     | no       | Session cookie lifetime, default `7`                |
| `SYNC_INDEXES`         | no       | Build indexes at boot; use in production, see below |

Indexes are created automatically outside production (`autoIndex`). In production
`autoIndex` is off, so run one deploy with `SYNC_INDEXES=true` after any index change.
**The unique indexes are load-bearing** — they are what prevent duplicate cat
ownership, duplicate upgrade purchases and duplicate usernames under concurrency.

### Data

The `rarities` collection is the cat catalog (`{ breed, rarity }`) and must be seeded.
Rarity codes are `C`, `U`, `R`, `E`, `L`, `M`. A rarity with no cats seeded is simply
never rolled.

## Architecture

```
src/
  server.js          boot: env + db connection, listen, graceful shutdown
  app.js             express app: security middleware, routers, error handling
  config.js          validated environment
  http.js            errors, auth/authz middleware, validation, rate limits
  game/
    balance.js       tuning constants and the upgrade table
    enums.js         rarities, roles, upgrade kinds
    stats.js         pure stat derivation and gacha selection
    stats.check.js   runnable assertions for the above
  users/             dao (persistence) / service (rules) / routes (http)
  cats/              dao (persistence) / service (rules) / routes (http)
```

Routes only speak HTTP. Services hold game rules and are usable without a request.
DAOs hold persistence. Adding an upgrade tier is a single entry in
`game/balance.js` — costs, odds and effects are all data.

Player stats (`rollCost`, `coinsPerClick`, `critChance`) are **derived on read** from
owned cats and upgrades. They are never stored, so they cannot drift.

## API

All responses are JSON. Errors are `{ "message": "..." }`.
Auth is a session cookie; send `credentials: "include"`.

**Access:** _public_ · _auth_ (signed in) · _self_ (the target user, or an admin) ·
_admin_.

| Method   | Path                                  | Access | Notes                                      |
| -------- | ------------------------------------- | ------ | ------------------------------------------ |
| `POST`   | `/api/users/signup`                   | public | `{username, password, ...profile}` → 201   |
| `POST`   | `/api/users/signin`                   | public | `{username, password}`                     |
| `POST`   | `/api/users/signout`                  | public | 204                                        |
| `GET`    | `/api/users`                          | admin  | All users                                  |
| `GET`    | `/api/users/me`                       | auth   | Current user                               |
| `GET`    | `/api/users/by-username/:username`    | auth   |                                            |
| `GET`    | `/api/users/:userId/data`             | self   | Profile + cats, favorites, upgrades, stats |
| `PUT`    | `/api/users/:userId`                  | admin  | Partial update                             |
| `POST`   | `/api/users/:userId/clicks`           | self   | `{clicks}` → coins granted server-side     |
| `POST`   | `/api/users/:userId/upgrades`         | self   | `{upgrade}` → 201                          |
| `GET`    | `/api/users/:userId/cats`             | auth   | Owned breeds                               |
| `GET`    | `/api/users/:userId/favorites`        | auth   |                                            |
| `POST`   | `/api/users/:userId/favorites`        | self   | `{breed}` → 201, idempotent                |
| `DELETE` | `/api/users/:userId/favorites/:breed` | self   | 204                                        |
| `POST`   | `/api/users/:userId/rolls`            | self   | Roll for a cat                             |
| `GET`    | `/api/cats/rarities`                  | public | Catalog                                    |
| `GET`    | `/api/cats/rarities/:rarity`          | public | Breeds of one rarity                       |
| `GET`    | `/api/info/odds`                      | public | Drop tables                                |
| `GET`    | `/api/info/multipliers`               | public | Coin multiplier per rarity                 |
| `GET`    | `/api/info/upgrades`                  | public | Upgrade kinds, tiers and costs             |
| `GET`    | `/health`                             | public |                                            |

Rate limits apply to sign-in/sign-up, clicks and rolls; exceeding them returns 429.

### Clicks

```
POST /api/users/:userId/clicks   { "clicks": 25 }
→ { "earned": 1300, "crits": 0, "coins": 1800, "coinsPerClick": 52, "critChance": 0.005 }
```

The client reports how many clicks occurred (max 25 per request). The server applies
its own `coinsPerClick`, rolls crits itself, and returns the authoritative balance.

### Rolls

```
POST /api/users/:userId/rolls
→ { "breed": "bengal", "rarity": "R", "duplicate": false, "addedCoins": 0,
    "coins": 1700, "rollCost": 130, "coinsPerClick": 62, "critChance": 0.005 }
```

Duplicates refund `addedCoins` instead of granting a cat.

## Breaking changes for the client

This rewrite changes the contract. Every item below needs a frontend change.

**Authentication is now mandatory.** Every `/api/users/*` and per-user cats route
requires a session cookie, and acting on another user's data returns 403.

**Existing passwords will not work.** Passwords are bcrypt-hashed in a new
`passwordHash` field; the old plaintext `password` field is ignored. Existing accounts
must be reset or migrated.

**Endpoints removed or moved:**

| Before                                         | After                                        |
| ---------------------------------------------- | -------------------------------------------- |
| `PUT /api/users/:userId/coins`                 | **removed** — use `POST .../clicks`          |
| `GET /api/cats/roll/:userId`                   | `POST /api/users/:userId/rolls`              |
| `POST /api/users/signup/user`                  | `POST /api/users/signup`                     |
| `GET /api/users/:username`                     | `GET /api/users/by-username/:username`       |
| `GET /api/cats/ownerships/:userId`             | `GET /api/users/:userId/cats`                |
| `GET /api/cats/favorites/:userId`              | `GET /api/users/:userId/favorites`           |
| `POST /api/cats/favorites/:userId`             | `POST /api/users/:userId/favorites`          |
| `DELETE /api/cats/favorites/:userId/:favorite` | `DELETE /api/users/:userId/favorites/:breed` |
| `POST /api/users/:userId/upgrade`              | `POST /api/users/:userId/upgrades`           |

**Response shapes:**

- No user response ever contains `password`/`passwordHash`.
- `signin`/`signup` return the safe user projection, not the raw document.
- `signup` returns 201; `signout` returns 204 with no body.
- Adding a favorite returns 201; removing one returns 204 with no body.
- `GET /api/cats/rarities` returns `{breed, rarity}` without `_id`/`__v`.
- Roll responses include the resulting `coins` balance.
- Upgrade purchase returns `{upgrade, upgrades, coins, rollCost, coinsPerClick, critChance}`.
- Mongo `updateOne` write results are no longer returned; endpoints return the
  updated resource.

**Status codes:** duplicate username, duplicate upgrade → 409. Unauthenticated → 401.
Not the owner → 403. Malformed input → 400 with a description of the problem.

**Signup validation:** username 3–32 chars (letters, digits, `.`, `-`, `_`),
password ≥8 chars.

**Env vars:** `FRONTEND_URL_DEV` and `FRONTEND_URL_PROD` are replaced by the single
comma-separated `CORS_ORIGINS`. `SESSION_SECRET` is now required.
