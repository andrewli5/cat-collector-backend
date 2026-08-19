import { httpError, isDuplicateKeyError } from "../http.js";
import {
  deriveStats,
  duplicateCoinValue,
  oddsFor,
  pickBreed,
  pickRarity,
} from "../game/stats.js";
import * as usersDao from "../users/dao.js";
import * as dao from "./dao.js";

const CATALOG_TTL_MS = 5 * 60 * 1000;
let catalogCache = null;

async function loadCatalog() {
  const cats = await dao.findAllCats();
  const byRarity = new Map();
  for (const { breed, rarity } of cats) {
    if (!byRarity.has(rarity)) byRarity.set(rarity, []);
    byRarity.get(rarity).push(breed);
  }
  return {
    cats,
    rarityOf: new Map(cats.map(({ breed, rarity }) => [breed, rarity])),
    byRarity,
    stockedRarities: new Set(byRarity.keys()),
  };
}

export function getCatalog() {
  if (!catalogCache || Date.now() > catalogCache.expiresAt) {
    const pending = loadCatalog();
    catalogCache = { expiresAt: Date.now() + CATALOG_TTL_MS, pending };
    pending.catch(() => {
      catalogCache = null;
    });
  }
  return catalogCache.pending;
}

export async function getPlayerStats(userId) {
  const [ownedBreeds, upgrades, catalog] = await Promise.all([
    dao.findOwnedBreeds(userId),
    usersDao.findUpgradeIdsByUserId(userId),
    getCatalog(),
  ]);
  const ownedRarities = ownedBreeds
    .map((breed) => catalog.rarityOf.get(breed))
    .filter(Boolean);

  return {
    ownedBreeds,
    ownedRarities,
    upgrades,
    ...deriveStats(ownedRarities, upgrades),
  };
}

export const getFavoriteBreeds = (userId) => dao.findFavoriteBreeds(userId);

export const getOwnedBreeds = (userId) => dao.findOwnedBreeds(userId);

export async function getCatsByRarity(rarity) {
  const { byRarity } = await getCatalog();
  return byRarity.get(rarity) ?? [];
}

async function assertKnownBreed(breed) {
  const { rarityOf } = await getCatalog();
  if (!rarityOf.has(breed))
    throw httpError(404, "The cat breed does not exist.");
}

export async function addFavorite(userId, breed) {
  await assertKnownBreed(breed);
  await dao.createFavorite(userId, breed).catch((err) => {
    if (!isDuplicateKeyError(err)) throw err;
  });
  return { userId, breed };
}

export async function removeFavorite(userId, breed) {
  const { deletedCount } = await dao.removeFavorite(userId, breed);
  if (deletedCount === 0) throw httpError(404, "The favorite does not exist.");
  return { userId, breed };
}

export async function rollForUser(userId) {
  const [{ ownedBreeds, ownedRarities, upgrades, rollCost }, catalog] =
    await Promise.all([getPlayerStats(userId), getCatalog()]);

  const rarity = pickRarity(oddsFor(upgrades), catalog.stockedRarities);
  if (!rarity) throw httpError(503, "The catalog has no cats for this roll.");
  const breed = pickBreed(catalog.byRarity.get(rarity));
  const reward = duplicateCoinValue(rarity, rollCost);
  const owned = ownedBreeds.includes(breed);

  const charged = await usersDao.adjustCoins(
    userId,
    (owned ? reward : 0) - rollCost,
    rollCost,
  );
  if (!charged)
    throw httpError(400, "The user does not have enough coins for a roll.");

  const result = (duplicate, addedCoins, coins) => ({
    breed,
    rarity,
    duplicate,
    addedCoins,
    coins,
    ...deriveStats(
      duplicate ? ownedRarities : [...ownedRarities, rarity],
      upgrades,
    ),
  });

  if (owned) return result(true, reward, charged.coins);

  try {
    await dao.createOwnership(userId, breed);
  } catch (err) {
    if (!isDuplicateKeyError(err)) {
      await usersDao.adjustCoins(userId, rollCost);
      throw err;
    }
    const settled = await usersDao.adjustCoins(userId, reward);
    return result(true, reward, settled.coins);
  }
  return result(false, 0, charged.coins);
}
