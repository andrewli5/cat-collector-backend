import assert from "node:assert/strict";
import { BASE_ODDS, UPGRADES } from "./balance.js";
import {
  deriveStats,
  duplicateCoinValue,
  oddsFor,
  pickBreed,
  pickRarity,
  rollClickEarnings,
} from "./stats.js";

const cats = ["C", "U", "U", "R", "L"];

assert.deepEqual(deriveStats([], []), {
  rollCost: 100,
  coinsPerClick: 50,
  critChance: 0.005,
});

// 50 * 1.08 * 1.12 * 1.12 * 1.2 * 1.6, and 100 * 1.3^5 * 0.6 (COST2)
assert.deepEqual(deriveStats(cats, ["CRIT2", "COST2", "COST1"]), {
  rollCost: 222,
  coinsPerClick: 130,
  critChance: 0.02,
});

// highest owned tier wins regardless of purchase order
assert.equal(deriveStats([], ["CRIT3", "CRIT1"]).critChance, 0.04);
assert.equal(deriveStats([], ["CRIT1", "CRIT3"]).critChance, 0.04);
assert.equal(deriveStats([], ["COST1", "COST3"]).rollCost, 20);
assert.equal(oddsFor([]), BASE_ODDS);
assert.equal(oddsFor(["LUCK1", "LUCK3", "LUCK2"]), UPGRADES.LUCK3.odds);
assert.equal(oddsFor(["CRIT3"]), BASE_ODDS);

const all = new Set(["C", "U", "R", "E", "L", "M"]);

// selection is total: every draw lands on a rarity that is both weighted and stocked
for (const odds of [
  BASE_ODDS,
  ...["LUCK1", "LUCK2", "LUCK3"].map((u) => UPGRADES[u].odds),
]) {
  for (let i = 0; i <= 1000; i++) {
    const rarity = pickRarity(odds, all, () => i / 1000);
    assert.ok(odds[rarity] > 0, `unweighted rarity ${rarity} at ${i}`);
  }
}

// zero-weight and unstocked rarities are never drawn
assert.notEqual(
  pickRarity(BASE_ODDS, all, () => 1 - Number.EPSILON),
  "M",
);
assert.equal(
  pickRarity(UPGRADES.LUCK3.odds, new Set(["C"]), () => 0.99),
  "C",
);
assert.equal(
  pickRarity(BASE_ODDS, new Set(), () => 0.5),
  null,
);

// weights are normalised by their total, which is 1.01 for LUCK3
assert.equal(
  pickRarity(UPGRADES.LUCK3.odds, all, () => 0.2 / 1.01),
  "U",
);
assert.equal(
  pickRarity(UPGRADES.LUCK3.odds, all, () => 0.99),
  "L",
);
assert.equal(
  pickRarity(UPGRADES.LUCK3.odds, all, () => 0.999),
  "M",
);

assert.equal(
  pickBreed(["a", "b", "c"], () => 0),
  "a",
);
assert.equal(
  pickBreed(["a", "b", "c"], () => 1 - Number.EPSILON),
  "c",
);

assert.equal(duplicateCoinValue("L", 222), 555);

const stats = { coinsPerClick: 130, critChance: 0.5 };
assert.deepEqual(
  rollClickEarnings(stats, 0, () => 0),
  { coins: 0, crits: 0 },
);
assert.deepEqual(
  rollClickEarnings(stats, 4, () => 0.9),
  { coins: 520, crits: 0 },
);
assert.deepEqual(
  rollClickEarnings(stats, 4, () => 0.1),
  { coins: 14820, crits: 4 },
);

console.log("game/stats: ok");
