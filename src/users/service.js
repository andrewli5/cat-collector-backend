import bcrypt from "bcrypt";
import { UPGRADES } from "../game/balance.js";
import { deriveStats, rollClickEarnings } from "../game/stats.js";
import { httpError, isDuplicateKeyError } from "../http.js";
import * as catsService from "../cats/service.js";
import * as dao from "./dao.js";

const BCRYPT_ROUNDS = 12;

// Verified even when the username is unknown so that sign-in timing does not
// reveal which accounts exist.
const ABSENT_USER_HASH = bcrypt.hashSync("absent-user", BCRYPT_ROUNDS);

const withoutHash = ({ passwordHash, ...user }) => user;

export async function signUp({ username, password, profilePicture }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    return await dao.createUser({ username, passwordHash, profilePicture });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw httpError(409, "Username taken.");
    throw err;
  }
}

export async function signIn(username, password) {
  const user = await dao.findUserByUsernameForAuth(username);
  const valid = await bcrypt.compare(
    password,
    user?.passwordHash ?? ABSENT_USER_HASH,
  );
  if (!user || !valid) throw httpError(401, "Invalid credentials.");
  return withoutHash(user);
}

export const listUsers = () => dao.findAllUsers();

export async function listRankedUsers(page, pageSize) {
  const [{ users, totalUsers }, catalog] = await Promise.all([
    dao.findRankedUsers((page - 1) * pageSize, pageSize),
    catsService.getCatalog(),
  ]);
  return {
    users,
    page,
    pageSize,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),
    totalCats: catalog.cats.length,
  };
}

export async function getUserByUsername(username) {
  const user = await dao.findUserByUsername(username);
  if (!user) throw httpError(404, "User not found.");
  return user;
}

export async function getUserData(userId) {
  const [user, player, favorites] = await Promise.all([
    dao.findUserById(userId),
    catsService.getPlayerStats(userId),
    catsService.getFavoriteBreeds(userId),
  ]);
  if (!user) throw httpError(404, "User not found.");

  const { ownedBreeds, ownedRarities, ...stats } = player;
  return { ...user, cats: ownedBreeds, favorites, ...stats };
}

export async function updateUser(userId, fields) {
  try {
    const user = await dao.updateUserById(userId, fields);
    if (!user) throw httpError(404, "User not found.");
    return user;
  } catch (err) {
    if (isDuplicateKeyError(err)) throw httpError(409, "Username taken.");
    throw err;
  }
}

export async function bankClicks(userId, clicks) {
  const { coinsPerClick, critChance } =
    await catsService.getPlayerStats(userId);
  const { coins: earned, crits } = rollClickEarnings(
    { coinsPerClick, critChance },
    clicks,
  );
  const user = await dao.adjustCoins(userId, earned);
  if (!user) throw httpError(404, "User not found.");
  return { earned, crits, coins: user.coins, coinsPerClick, critChance };
}

export async function purchaseUpgrade(userId, upgrade) {
  const { ownedRarities, upgrades } = await catsService.getPlayerStats(userId);
  if (upgrades.includes(upgrade)) {
    throw httpError(409, "Upgrade already purchased.");
  }

  const { cost } = UPGRADES[upgrade];
  const user = await dao.adjustCoins(userId, -cost, cost);
  if (!user) throw httpError(400, "Not enough coins.");

  try {
    await dao.createUpgrade(userId, upgrade);
  } catch (err) {
    await dao.adjustCoins(userId, cost);
    if (isDuplicateKeyError(err)) {
      throw httpError(409, "Upgrade already purchased.");
    }
    throw err;
  }

  const owned = [...upgrades, upgrade];
  return {
    upgrade,
    upgrades: owned,
    coins: user.coins,
    ...deriveStats(ownedRarities, owned),
  };
}
