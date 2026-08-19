import { RARITIES } from "./enums.js";
import {
  BASE_COINS_PER_CLICK,
  BASE_COST_PER_ROLL,
  BASE_CRIT_CHANCE,
  BASE_ODDS,
  CRIT_MULTIPLIER,
  RARITY_TO_COIN_MULTIPLIER,
  ROLL_COST_GROWTH_RATE,
  STANDARD_CAT_VALUES,
  UPGRADES,
} from "./balance.js";

const bestOwned = (kind, owned) =>
  owned
    .map((id) => UPGRADES[id])
    .filter((upgrade) => upgrade?.kind === kind)
    .reduce((best, u) => (best && best.tier > u.tier ? best : u), null);

export const oddsFor = (owned) => bestOwned("LUCK", owned)?.odds ?? BASE_ODDS;

export function deriveStats(ownedRarities, ownedUpgrades) {
  const coinsPerClick = ownedRarities.reduce(
    (total, rarity) => total * RARITY_TO_COIN_MULTIPLIER[rarity],
    BASE_COINS_PER_CLICK,
  );
  const rollCost =
    BASE_COST_PER_ROLL *
    ROLL_COST_GROWTH_RATE ** ownedRarities.length *
    (bestOwned("COST", ownedUpgrades)?.rollCostMultiplier ?? 1);

  return {
    rollCost: Math.floor(rollCost),
    coinsPerClick: Math.floor(coinsPerClick),
    critChance:
      bestOwned("CRIT", ownedUpgrades)?.critChance ?? BASE_CRIT_CHANCE,
  };
}

export const duplicateCoinValue = (rarity, rollCost) =>
  Math.floor(STANDARD_CAT_VALUES[rarity] * rollCost);

// `available` limits the draw to rarities that contain cats. Thus, the draw
// does not select a rarity with an empty breed list.
export function pickRarity(odds, available, rand = Math.random) {
  const pool = RARITIES.filter((r) => odds[r] > 0 && available.has(r));
  if (pool.length === 0) return null;

  const total = pool.reduce((sum, r) => sum + odds[r], 0);
  let remaining = rand() * total;
  for (const rarity of pool) {
    remaining -= odds[rarity];
    if (remaining < 0) return rarity;
  }
  return pool[pool.length - 1];
}

export const pickBreed = (breeds, rand = Math.random) =>
  breeds[Math.floor(rand() * breeds.length)];

export function rollClickEarnings(
  { coinsPerClick, critChance },
  clicks,
  rand = Math.random,
) {
  let coins = 0;
  let crits = 0;
  for (let i = 0; i < clicks; i++) {
    const crit = rand() < critChance;
    coins += crit ? coinsPerClick * CRIT_MULTIPLIER : coinsPerClick;
    crits += crit ? 1 : 0;
  }
  return { coins: Math.floor(coins), crits };
}
