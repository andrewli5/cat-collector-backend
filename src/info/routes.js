import express from "express";
import {
  BASE_ODDS,
  RARITY_TO_COIN_MULTIPLIER,
  UPGRADES,
} from "../game/balance.js";

const entries = Object.entries(UPGRADES);

const odds = {
  BASE: BASE_ODDS,
  ...Object.fromEntries(
    entries.filter(([, u]) => u.odds).map(([id, u]) => [id, u.odds]),
  ),
};

const upgrades = Object.fromEntries(
  entries.map(([id, { kind, tier, cost }]) => [id, { kind, tier, cost }]),
);

export const infoRouter = express.Router();

infoRouter.get("/odds", (req, res) => res.json(odds));
infoRouter.get("/multipliers", (req, res) =>
  res.json(RARITY_TO_COIN_MULTIPLIER),
);
infoRouter.get("/upgrades", (req, res) => res.json(upgrades));
