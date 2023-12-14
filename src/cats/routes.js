import * as dao from "./dao.js";
import * as usersDao from "../users/dao.js";
import {
  RARITIES,
  STANDARD_CAT_VALUES,
  BASE_ODDS,
  LUCK1_ODDS,
  LUCK2_ODDS,
  LUCK3_ODDS,
  USER_NOT_FOUND_MSG,
  NOT_ENOUGH_COINS_MSG,
  getAttributes,
} from "../constants.js";

export function CatRoutes(app) {
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
    res.json(favoritedBreeds);
  };

  const addUserFavorites = async (req, res) => {
    const { userId } = req.params;
    const { breed } = req.body;

    const user = await usersDao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    await dao.createFavorite(userId, breed);
    res.json({ userId, breed });
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
    res.json(ownedBreeds);
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
  const pickRarity = (odds) => {
    const totalOdds = Object.values(odds).reduce(
      (total, prob) => total + prob,
      0,
    );
    const rand = Math.random() * totalOdds;
    let cumulativeProbability = 0;
    for (const rarity of RARITIES) {
      cumulativeProbability += odds[rarity];
      if (rand <= cumulativeProbability) {
        return rarity;
      }
    }
    return null;
  };

  const rollCatForUser = async (req, res) => {
    const { userId } = req.params;
    const user = await usersDao.findUserById(userId);
    if (user.coins < user.rollCost) {
      res.status(400).json({ message: NOT_ENOUGH_COINS_MSG });
      return;
    }

    var odds = BASE_ODDS;
    const upgrades = await usersDao.findUpgradesByUserId(userId);
    if (upgrades.includes("LUCK3")) {
      odds = LUCK3_ODDS;
    } else if (upgrades.includes("LUCK2")) {
      odds = LUCK2_ODDS;
    } else if (upgrades.includes("LUCK1")) {
      odds = LUCK1_ODDS;
    }

    // start roll
    const rarity = pickRarity(odds);
    const catList = await dao.getCatsByRarity(rarity);
    const breed = pickBreed(catList);

    // check for duplicate
    const ownedBreeds = await getOwnedBreedsByUserId(userId);

    // if duplicate, add coins and return
    if (ownedBreeds.includes(breed)) {
      const coinsWorth = Math.floor(
        STANDARD_CAT_VALUES[rarity] * user.rollCost,
      );
      await usersDao.updateCoinsByUserId(
        userId,
        user.coins - user.rollCost + coinsWorth,
      );
      res.json({ breed, rarity, duplicate: true, addedCoins: coinsWorth });
      return;
    }
    // if not duplicate, add cat to user's ownerships, update user's stats, and return new stats
    else {
      await dao.createOwnership(userId, breed);
      await usersDao.updateCoinsByUserId(userId, user.coins - user.rollCost);
      const { rollCost, coinsPerClick, critChance } =
        await updateUserAttributes(userId);
      res.json({
        breed,
        rarity,
        duplicate: false,
        addedCoins: 0,
        rollCost,
        coinsPerClick,
        critChance,
      });
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

async function getRarityDistributionFromUserId(userId) {
  const ownershipList = await dao.findOwnershipListByUserId(userId);
  const rarities = await dao.getCats();
  const rarityDistribution = ownershipList.map((ownership) => {
    const rarity = rarities.find((rarity) => rarity.breed === ownership.breed);
    return { rarity: rarity.rarity };
  });
  return { ownershipList, rarityDistribution };
}

export async function updateUserAttributes(userId) {
  const { ownershipList, rarityDistribution } =
    await getRarityDistributionFromUserId(userId);
  const upgrades =
    (await usersDao.findUpgradesByUserId(userId)).map(
      (upgrade) => upgrade.upgrade,
    ) || [];
  var { rollCost, coinsPerClick, critChance } = getAttributes(
    rarityDistribution,
    upgrades,
  );

  // remove decimals
  rollCost = Math.floor(rollCost);
  coinsPerClick = Math.floor(coinsPerClick);

  await usersDao.updateUserInfoByUserId(userId, {
    rollCost,
    coinsPerClick,
    critChance,
  });
  return { ownershipList, upgrades, rollCost, coinsPerClick, critChance };
}
