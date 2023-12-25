import {
  COST_PER_UPGRADE,
  INCORRECT_ADMIN_PASSWORD_MSG,
  INVALID_CREDENTIALS_MSG,
  USER_NOT_FOUND_MSG,
  USERNAME_TAKEN_MSG,
} from "../constants.js";
import * as dao from "./dao.js";
import * as catsDao from "../cats/dao.js";
import { updateUserAttributes } from "../cats/routes.js";

export function UserRoutes(app) {
  const updateCoinsByUserId = async (req, res) => {
    const { userId } = req.params;
    const { coins } = req.body;
    const status = await dao.updateCoinsByUserId(userId, coins);
    res.json(status);
  };

  const signIn = async (req, res) => {
    const { username, password } = req.body;
    const currentUser = await dao.findUserByCredentials(username, password);
    if (!currentUser) {
      res.status(401).json({ message: INVALID_CREDENTIALS_MSG });
      return;
    }
    req.session["currentUser"] = currentUser;
    res.json(currentUser);
  };

  const signOut = (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
  };

  const signUpAsUser = async (req, res) => {
    const existingUser = await dao.findUserByUsername(req.body.username);
    if (existingUser) {
      res.status(400).json({ message: USERNAME_TAKEN_MSG });
      return;
    }
    const newUser = await dao.createUser(req.body);
    req.session["currentUser"] = newUser;
    res.json(newUser);
  };

  // admin-only
  const signUpAsAdmin = async (req, res) => {
    const existingUser = await dao.findUserByUsername(req.body.username);
    if (existingUser) {
      res.status(400).json({ message: USERNAME_TAKEN_MSG });
      return;
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (req.body.admin_password !== ADMIN_PASSWORD) {
      res.status(401).json({ message: INCORRECT_ADMIN_PASSWORD_MSG });
      return;
    }

    const newUser = await dao.createAdmin(req.body);
    req.session["currentUser"] = newUser;
    res.json(newUser);
  };

  const getUserByUsername = async (req, res) => {
    const { username } = req.params;
    const user = await dao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }
    res.json(user);
  };

  // admin tools only only
  const getAllUsers = async (req, res) => {
    const users = await dao.findAllUsers();
    res.json(users);
  };

  // admin tools only
  const updateUserInfoByUserId = async (req, res) => {
    const { userId } = req.params;
    const { username, firstName, lastName, profilePicture, role, coins } =
      req.body;

    const status = await dao.updateUserInfoByUserId(userId, {
      username,
      firstName,
      lastName,
      profilePicture,
      role,
      coins,
    });

    res.json(status);
  };

  const getUserData = async (req, res) => {
    const { userId } = req.params;
    const user = await dao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const { ownershipList, upgrades, rollCost, coinsPerClick, critChance } =
      await updateUserAttributes(userId);

    const cats = ownershipList.map((ownership) => ownership.breed) || [];
    const favoriteList = await catsDao.findFavoriteListByUserId(userId);
    const favorites = favoriteList.map((favorite) => favorite.breed) || [];

    res.json({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: user.coins,
      cats,
      favorites,
      upgrades,
      rollCost,
      coinsPerClick,
      critChance,
    });
  };

  const purchaseUpgrade = async (req, res) => {
    const { userId } = req.params;
    const { upgrade } = req.body;

    const user = await dao.findUserById(userId);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const { coins, upgrades } = await dao.findUserById(userId);
    if (!upgrades || !upgrades.includes(upgrade)) {
      const upgradeCost = COST_PER_UPGRADE[upgrade];
      if (coins >= upgradeCost) {
        await dao.updateCoinsByUserId(userId, coins - upgradeCost);
        await dao.createUpgrade(userId, upgrade);
        res.json({ userId, upgrade });
      } else {
        res.status(400).json({ message: "Insufficient funds." });
      }
    } else {
      res.status(400).json({ message: "Upgrade already purchased." });
    }
  };

  app.get("/api/users", getAllUsers);
  app.get("/api/users/:username", getUserByUsername);
  app.get("/api/users/:userId/data", getUserData);
  app.put("/api/users/:userId/coins", updateCoinsByUserId);
  app.put("/api/users/:userId", updateUserInfoByUserId);
  app.post("/api/users/signin", signIn);
  app.post("/api/users/signout", signOut);
  app.post("/api/users/signup/user", signUpAsUser);
  app.post("/api/users/signup/admin", signUpAsAdmin);
  app.post("/api/users/:userId/upgrade", purchaseUpgrade);
}
