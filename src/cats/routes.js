import * as dao from "./dao.js";
import * as usersDao from "../users/dao.js";
import { USER_NOT_FOUND_MSG } from "../constants.js";

const RARITIES = ["C", "U", "R", "E", "L"];

// odds for each category
const STANDARD_ODDS = {
  C: 0.8,
  U: 0.15,
  R: 0.04,
  E: 0.009,
  L: 0.001,
};

// range of what each category of cat is worth
const STANDARD_CAT_VALUES = {
  C: [150, 250],
  U: [500, 750],
  R: [1500, 2500],
  E: [25000, 50000],
  L: [100000, 150000],
};

const COST_PER_ROLL = 500;

const NOT_ENOUGH_COINS_MSG = "Not enough coins to roll.";

export default function CatRoutes(app) {
  const getFavoritedBreedsByUserId = async (userId) => {
    const favoriteList = await dao.findFavoriteListByUserId(userId);
    return favoriteList.map((favorite) => favorite.breed) || [];
  };

  const getFavoritedCatsByUserId = async (req, res) => {
    const { userId } = req.params;
    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const favoritedBreeds = await getFavoritedBreedsByUserId(userId);
    if (favoritedBreeds.includes("all")) {
      const allBreeds = await getBreeds();
      res.json(allBreeds);
    } else {
      res.json(favoritedBreeds);
    }
  };

  const addUserFavorites = async (req, res) => {
    const { userId } = req.params;
    const { favorite } = req.body;

    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    await dao.createFavorite(userId, favorite);
    res.json({ userId, favorite });
  };

  const removeUserFavorites = async (req, res) => {
    const { userId, favorite } = req.params;

    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    await dao.removeFavorite(userId, favorite);
    res.json({ userId, favorite });
  };

  const getBreeds = async () => {
    const catList = await dao.getCats();
    return catList.map((cat) => cat.breed);
  };

  const getOwnedBreedsByUserId = async (userId) => {
    const ownershipList = await dao.findOwnershipListByUserId(userId);
    return ownershipList.map((ownership) => ownership.breed) || [];
  };

  const getCatsByUserId = async (req, res) => {
    const { userId } = req.params;
    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const ownedBreeds = await getOwnedBreedsByUserId(userId);
    if (ownedBreeds.includes("all")) {
      const allBreeds = await getBreeds();
      res.json(allBreeds);
    } else {
      res.json(ownedBreeds);
    }
  };

  const getCatsByRarity = async (req, res) => {
    const { rarity } = req.params;
    const catList = await dao.getCatsByRarity(rarity);
    res.json(catList.map((cat) => cat.breed));
  };

  // helper for rolling, picks a random breed from a list of cats
  const pickBreed = (catList) => {
    const rand = Math.random() * catList.length;
    return catList[Math.floor(rand)].breed;
  };

  // helper for rolling, picks a random rarity based on odds
  const pickRarity = () => {
    const totalOdds = Object.values(STANDARD_ODDS).reduce(
      (total, odds) => total + odds,
      0,
    );
    const rand = Math.random() * totalOdds;
    let cumulativeProbability = 0;
    for (const rarity of RARITIES) {
      cumulativeProbability += STANDARD_ODDS[rarity];
      if (rand <= cumulativeProbability) {
        return rarity;
      }
    }
    return null;
  };

  const rollCatForUser = async (req, res) => {
    const { userId } = req.params;
    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: NOT_ENOUGH_COINS_MSG });
      return;
    }
    if (user.coins < COST_PER_ROLL) {
      res.status(400).json({ message: NOT_ENOUGH_COINS_MSG });
      return;
    }

    const rarity = pickRarity();
    const catList = await dao.getCatsByRarity(rarity);
    const breed = pickBreed(catList);
    const ownedBreeds = await getOwnedBreedsByUserId(userId);
    if (ownedBreeds.includes(breed)) {
      const coinsWorth = Math.floor(
        Math.random() *
          (STANDARD_CAT_VALUES[rarity][1] - STANDARD_CAT_VALUES[rarity][0]) +
          STANDARD_CAT_VALUES[rarity][0],
      );
      await usersDao.updateUserCoins(userId, user.coins + coinsWorth);
      res.json({ breed, rarity, duplicate: true, addedCoins: coinsWorth });
      return;
    } else {
      await dao.createOwnership(userId, breed);
      await usersDao.updateUserCoins(userId, user.coins - COST_PER_ROLL);
      res.json({ breed, rarity, duplicate: false, addedCoins: 0 });
    }
  };

  const getAllCatRarities = async (req, res) => {
    const rarities = await dao.getCats();
    res.json(rarities);
  };

  app.get("/api/cats/ownerships/:userId", getCatsByUserId);
  app.get("/api/cats/favorites/:userId", getFavoritedCatsByUserId);
  app.post("/api/cats/favorites/:userId", addUserFavorites);
  app.delete("/api/cats/favorites/:userId/:favorite", removeUserFavorites);
  app.get("/api/cats/rarities/:rarity", getCatsByRarity);
  app.get("/api/cats/roll/:userId", rollCatForUser);
  app.get("/api/cats/rarities", getAllCatRarities);
}
