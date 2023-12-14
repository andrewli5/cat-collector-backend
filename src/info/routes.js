import {
  BASE_ODDS,
  LUCK1_ODDS,
  LUCK2_ODDS,
  LUCK3_ODDS,
  RARITY_TO_COIN_MULTIPLIER,
} from "../constants.js";

export function InfoRoutes(app) {
  const getOdds = async (req, res) => {
    res.json({
      BASE: BASE_ODDS,
      LUCK1: LUCK1_ODDS,
      LUCK2: LUCK2_ODDS,
      LUCK3: LUCK3_ODDS,
    });
  };

  const getMultipliers = async (req, res) => {
    res.json(RARITY_TO_COIN_MULTIPLIER);
  };

  app.get("/api/info/odds", getOdds);
  app.get("/api/info/multipliers", getMultipliers);
}
