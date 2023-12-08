import * as dao from "./dao.js";
import * as usersDao from "../users/dao.js";
import { USER_NOT_FOUND_MSG } from "../constants.js";

export default function CatRoutes(app) {
  const getBreeds = async () => {
    const catList = await dao.getCats();
    return catList.map((cat) => cat.breed);
  };

  const getCats = async () => {
    const catList = await dao.getCats();
    return catList;
  };

  const getCatsByUsername = async (req, res) => {
    const { username } = req.params;
    const user = await usersDao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const ownershipList = await dao.findOwnershipListByUsername(username);
    const ownedBreeds = ownershipList.map((ownership) => ownership.breed) || [];
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

  app.get("/api/cats/ownerships/:username", getCatsByUsername);
  app.get("/api/cats/rarities/:rarity", getCatsByRarity);
}
