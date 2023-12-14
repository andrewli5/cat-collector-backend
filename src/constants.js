const ADMIN = "ADMIN";
const USER = "USER";
const UNAUTHORIZED_MSG = "Unauthorized.";
const INVALID_REQUEST_SENDER_MSG = "Invalid request sender.";
const USER_NOT_FOUND_MSG = "User not found.";
const INCORRECT_ADMIN_PASSWORD_MSG = "Incorrect admin password.";
const INVALID_CREDENTIALS_MSG = "Invalid credentials.";
const USERNAME_TAKEN_MSG = "Username taken.";
const NOT_ENOUGH_COINS_MSG = "Not enough coins to roll.";

export const RARITIES = ["C", "U", "R", "E", "L", "M"];

export const UPGRADES = [
  "LUCK1", // 60% chance of common, 25% chance of uncommon, 10% chance of rare, 4.5% chance of epic, 0.5% chance of legendary
  "LUCK2", // 40% chance of common, 30% chance of uncommon, 15% chance of rare, 10% chance of epic, 1% chance of legendary
  "LUCK3", // 20% chance of common, 40% chance of uncommon, 20% chance of rare, 15% chance of epic, 5% chance of legendary
  "CRIT1", // 1% chance of 28.5x coins on click
  "CRIT2", // 2% chance of 28.5x coins
  "CRIT3", // 4% chance of 28.5x coins
  "COST1", // Reduce cost of all future rolls by 25%
  "COST2", // Reduce cost of all future rolls by 50%
  "COST3", // Reduce cost of all future rolls by 75%
];

// coin multiplier for each rarity of cat
export const RARITY_TO_COIN_MULTIPLIER = {
  C: 1.08,
  U: 1.12,
  R: 1.2,
  E: 1.3,
  L: 1.6,
  M: 2,
};

// discount for rolls per COST upgrade, subject to change
export const ROLL_DISCOUNTS = {
  COST1: 0.8,
  COST2: 0.6,
  COST3: 0.2,
};

// crit rate for each crit upgrade, subject to change
export const CRIT_RATES = {
  CRIT1: 0.01,
  CRIT2: 0.02,
  CRIT3: 0.04,
};

// cost per roll and multiplier for cost per new roll
export const BASE_COST_PER_ROLL = 100.0;
export const ROLL_COST_GROWTH_RATE = 1.3;

// base coins per click. each new cat acquired increases coins per click by a multiplier determined by the cat's rarity
export const BASE_COINS_PER_CLICK = 50.0;

// base crit chance is 5%, which is the chance for a click to deliver 2x coins
export const BASE_CRIT_CHANCE = 0.005;

// Get a user's roll cost, coins per click, and crit chance based on their cats and upgrades
// cats are given in the format [{breed: "cat1", rarity: "C"}, {breed: "cat2", rarity: "U"}, ...]
// upgrades are given in the format ["LUCK1", "CRIT2", ...]
export function getAttributes(cats, upgrades) {
  const stats = {
    rollCost: BASE_COST_PER_ROLL,
    coinsPerClick: BASE_COINS_PER_CLICK,
    critChance: BASE_CRIT_CHANCE,
  };

  // crit upgrades
  if (upgrades.includes("CRIT3")) {
    stats.critChance = CRIT_RATES.CRIT3;
  } else if (upgrades.includes("CRIT2")) {
    stats.critChance = CRIT_RATES.CRIT2;
  } else if (upgrades.includes("CRIT1")) {
    stats.critChance = CRIT_RATES.CRIT1;
  }

  // apply rarity multipliers to coins per click
  for (const cat of cats) {
    stats.coinsPerClick *= RARITY_TO_COIN_MULTIPLIER[cat.rarity];
  }

  // calculate roll cost
  for (const _ of cats) {
    stats.rollCost *= ROLL_COST_GROWTH_RATE;
  }

  // apply roll discounts
  if (upgrades.includes("COST3")) {
    stats.rollCost *= ROLL_DISCOUNTS.COST3;
  } else if (upgrades.includes("COST2")) {
    stats.rollCost *= ROLL_DISCOUNTS.COST2;
  } else if (upgrades.includes("COST1")) {
    stats.rollCost *= ROLL_DISCOUNTS.COST1;
  }

  return stats;
}

/*
const testCats = [
  { breed: "cat1", rarity: "C" },
  { breed: "cat2", rarity: "U" },
  { breed: "cat3", rarity: "U" },
  { breed: "cat4", rarity: "R" },
  { breed: "cat5", rarity: "L" },
];
const testUpgrades = ["CRIT2", "COST2", "COST1"];
console.log(getAttributes(testCats, testUpgrades));
// expected:
{
  rollCost: 96.63060000000006,
  coinsPerClick: 130.05619200000004,
  critChance: 0.1
}

*/

// cost per upgrade, subject to change
export const COST_PER_UPGRADE = {
  LUCK1: 50000,
  LUCK2: 500000,
  LUCK3: 5000000,
  CRIT1: 20000,
  CRIT2: 200000,
  CRIT3: 2000000,
  COST1: 20000,
  COST2: 200000,
  COST3: 2000000,
};

// odds for each category; mythical is 0.0 because there are no mythical cats yet
export const BASE_ODDS = {
  C: 0.8,
  U: 0.15,
  R: 0.04,
  E: 0.009,
  L: 0.001,
  M: 0.0,
};

export const LUCK1_ODDS = {
  C: 0.6,
  U: 0.25,
  R: 0.1,
  E: 0.045,
  L: 0.005,
  M: 0.0,
};

export const LUCK2_ODDS = {
  C: 0.4,
  U: 0.3,
  R: 0.15,
  E: 0.1,
  L: 0.01,
  M: 0.0,
};

export const LUCK3_ODDS = {
  C: 0.2,
  U: 0.4,
  R: 0.2,
  E: 0.15,
  L: 0.05,
  M: 0.0,
};

// range of what each category of cat is worth
export const STANDARD_CAT_VALUES = {
  C: 0.2,
  U: 0.4,
  R: 0.8,
  E: 1.5,
  L: 2.5,
};

export {
  ADMIN,
  USER,
  UNAUTHORIZED_MSG,
  INVALID_REQUEST_SENDER_MSG,
  USER_NOT_FOUND_MSG,
  INCORRECT_ADMIN_PASSWORD_MSG,
  INVALID_CREDENTIALS_MSG,
  USERNAME_TAKEN_MSG,
  NOT_ENOUGH_COINS_MSG,
};
