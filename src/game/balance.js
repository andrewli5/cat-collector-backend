export const BASE_COST_PER_ROLL = 100.0;
export const ROLL_COST_GROWTH_RATE = 1.3;
export const BASE_COINS_PER_CLICK = 50.0;
export const BASE_CRIT_CHANCE = 0.005;

// The old client stored this value and controlled the coin income.
// The old upgrade descriptions specify this value.
export const CRIT_MULTIPLIER = 28.5;

// This value limits the clicks in one request. The click rate limit also
// controls the maximum coin income that the server gives in a period.
export const MAX_CLICKS_PER_REQUEST = 25;

export const RARITY_TO_COIN_MULTIPLIER = {
  C: 1.08,
  U: 1.12,
  R: 1.2,
  E: 1.3,
  L: 1.6,
  M: 2,
};

export const STANDARD_CAT_VALUES = {
  C: 0.2,
  U: 0.4,
  R: 0.8,
  E: 1.5,
  L: 2.5,
  M: 5.0,
};

// These values are weights. LUCK2 has a total of 0.96, and LUCK3 has a total
// of 1.01. The selection code uses the total to keep the specified drop rates.
export const BASE_ODDS = {
  C: 0.8,
  U: 0.15,
  R: 0.04,
  E: 0.009,
  L: 0.001,
  M: 0.0,
};

export const UPGRADES = {
  LUCK1: {
    kind: "LUCK",
    tier: 1,
    cost: 50000,
    odds: { C: 0.6, U: 0.25, R: 0.1, E: 0.045, L: 0.005, M: 0.0 },
  },
  LUCK2: {
    kind: "LUCK",
    tier: 2,
    cost: 500000,
    odds: { C: 0.4, U: 0.3, R: 0.15, E: 0.1, L: 0.01, M: 0.0 },
  },
  LUCK3: {
    kind: "LUCK",
    tier: 3,
    cost: 5000000,
    odds: { C: 0.2, U: 0.4, R: 0.2, E: 0.15, L: 0.05, M: 0.01 },
  },
  CRIT1: { kind: "CRIT", tier: 1, cost: 20000, critChance: 0.01 },
  CRIT2: { kind: "CRIT", tier: 2, cost: 200000, critChance: 0.02 },
  CRIT3: { kind: "CRIT", tier: 3, cost: 2000000, critChance: 0.04 },
  COST1: { kind: "COST", tier: 1, cost: 20000, rollCostMultiplier: 0.8 },
  COST2: { kind: "COST", tier: 2, cost: 200000, rollCostMultiplier: 0.6 },
  COST3: { kind: "COST", tier: 3, cost: 2000000, rollCostMultiplier: 0.2 },
};

export const UPGRADE_IDS = Object.keys(UPGRADES);
