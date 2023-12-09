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
  L: 0.001
};

// range of what each category of cat is worth
const STANDARD_CAT_VALUES = {
    C: [150, 250],
    U: [500, 750],
    R: [1500, 2500],
    E: [25000, 50000],
    L: [100000, 150000]
};

const COST_PER_ROLL = 500;

const NOT_ENOUGH_COINS_MSG = "Not enough coins to roll.";

export default function CatRoutes(app) {
  const getBreeds = async () => {
    const catList = await dao.getCats();
    return catList.map((cat) => cat.breed);
  };

  const getOwnedBreedsByUsername = async (username) => {
    const ownershipList = await dao.findOwnershipListByUsername(username);
    return ownershipList.map((ownership) => ownership.breed) || [];
  }

  const getFavoritedBreedsByUsername = async (username) => {
    const favoriteList = await dao.findFavoriteListByUsername(username);
    return favoriteList.map((favorite) => favorite.breed) || [];
  }

  const getCatsByUsername = async (req, res) => {
    const { username } = req.params;
    const user = await usersDao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const ownedBreeds = await getOwnedBreedsByUsername(username);
    if (ownedBreeds.includes("all")) {
      const allBreeds = await getBreeds();
      res.json(allBreeds);
    } else {
      res.json(ownedBreeds);
    }
  };

  const getFavoritedCatsByUsername = async (req, res) => {
    const { username } = req.params;
    const user = await usersDao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const favoritedBreeds = await getFavoritedBreedsByUsername(username);
    if (favoritedBreeds.includes("all")) {
      const allBreeds = await getBreeds();
      res.json(allBreeds);
    } else {
      res.json(favoritedBreeds);
    }
  }

  const getCatsByRarity = async (req, res) => {
    const { rarity } = req.params;
    const catList = await dao.getCatsByRarity(rarity);
    res.json(catList.map((cat) => cat.breed));
  };

  const rollCatForUser = async (req, res) => {
    const { username } = req.params;
    const user = await usersDao.findUserByUsername(username);
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
    const ownedBreeds = await getOwnedBreedsByUsername(username);
    if (ownedBreeds.includes(breed)) {
      const coinsWorth = Math.floor(Math.random() * (STANDARD_CAT_VALUES[rarity][1] - STANDARD_CAT_VALUES[rarity][0]) + STANDARD_CAT_VALUES[rarity][0]);
      await usersDao.updateUserCoins(username, user.coins + coinsWorth);
      res.json({ breed, rarity, duplicate: true, addedCoins: coinsWorth});
      return;
    } else {
      await dao.createOwnership({ username, breed });
      await usersDao.updateUserCoins(username, user.coins - COST_PER_ROLL);
      res.json({ breed, rarity, duplicate: false, addedCoins: 0 });
    }
  }

  const pickBreed = (catList) => {
    const rand = Math.random() * catList.length;
    return catList[Math.floor(rand)].breed;
  }

  const pickRarity = () => {
    const rand = Math.random() * STANDARD_ODDS.reduce((a, b) => a + b, 0);
    let cumulativeProbability = 0;
    for (const rarity in RARITIES) {
      cumulativeProbability += STANDARD_ODDS[rarity];
      if (rand <= cumulativeProbability) {
        return rarity;
      }
    }
    return null;
  }

  app.get("/api/cats/ownerships/:username", getCatsByUsername);
  app.get("/api/cats/favorites/:username", getFavoritedCatsByUsername);
  app.get("/api/cats/rarities/:rarity", getCatsByRarity);
  app.get("/api/cats/roll/:username", rollCatForUser);
}
