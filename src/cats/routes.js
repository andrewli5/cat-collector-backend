import * as dao from "./dao.js";
import * as usersDao from "../users/dao.js";
import { USER_NOT_FOUND_MSG } from "../constants.js";

export default function CatRoutes(app) {
  const getCatsByUsername = async (req, res) => {
    const { username } = req.params;
    const user = await usersDao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const ownershipList = await dao.findOwnershipListByUsername(username);
    const cats = []
    for (const ownership of ownershipList) {
      if (ownership.breed === "all") {
        // TODO: implement get all cats and return it here
        res.json(["all"]);
        return;
      }
      cats.push(ownership.breed)
    }
    res.json(cats);
  };

  app.get("/api/cats/:username", getCatsByUsername);
}
