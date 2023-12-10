import {
  INCORRECT_ADMIN_PASSWORD_MSG,
  INVALID_CREDENTIALS_MSG,
  INVALID_REQUEST_SENDER_MSG,
  UNAUTHORIZED_MSG,
  USER_NOT_FOUND_MSG,
  USERNAME_TAKEN_MSG,
} from "../constants.js";
import * as dao from "./dao.js";
import * as catsDao from "../cats/dao.js";

export default function UserRoutes(app) {
  const updateUserCoins = async (req, res) => {
    const { username } = req.params;
    const { coins } = req.body;
    const status = await dao.updateUserCoins(username, coins);
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

  // admin-only
  const getAllUsers = async (req, res) => {
    const { from_username } = req.body;

    const from_user = await dao.findUserByUsername(from_username);
    if (!from_user) {
      res.status(404).json({ message: INVALID_REQUEST_SENDER_MSG });
      return;
    } else if (from_user.role !== "ADMIN") {
      res.status(401).json({ message: UNAUTHORIZED_MSG });
      return;
    }

    const users = await dao.findAllUsers();
    res.json(users);
  };

  // admin-only if any of these are true:
  // 1. role changed
  // 2. coins changed
  // 3. user is updating another user's info
  const updateUserInfo = async (req, res) => {
    const { username } = req.params;
    const { from_username, firstName, lastName, role, coins } = req.body;

    if (role || coins || from_username !== username) {
      const from_user = await dao.findUserByUsername(from_username);
      if (!from_user) {
        res.status(404).json({ message: INVALID_REQUEST_SENDER_MSG });
        return;
      } else if (from_user.role !== "ADMIN") {
        res.status(401).json({ message: UNAUTHORIZED_MSG });
        return;
      }
    }

    const status = await dao.updateUserInfo(username, {
      firstName,
      lastName,
      role,
      coins,
    });
    res.json(status);
  };

  const getUserData = async (req, res) => {
    const { username } = req.params;
    const user = await dao.findUserByUsername(username);
    if (!user) {
      res.status(404).json({ message: USER_NOT_FOUND_MSG });
      return;
    }

    const ownershipList = await catsDao.findOwnershipListByUsername(username);
    const cats = ownershipList.map((ownership) => ownership.breed) || [];
    
    const favoriteList = await catsDao.findFavoriteListByUsername(username);
    const favorites = favoriteList.map((favorite) => favorite.favorite) || [];

    const upgradesList = await dao.findUpgradesByUsername(username);
    const upgrades = upgradesList.map((upgrade) => upgrade.upgrade) || [];

    res.json({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      coins: user.coins,
      cats,
      favorites,
      upgrades,
    });
    
  };

  app.get("/api/users", getAllUsers);
  app.get("/api/users/:username", getUserByUsername);
  app.get("/api/users/:username/data", getUserData);
  app.put("/api/users/:username/coins", updateUserCoins);
  app.put("/api/users/:username", updateUserInfo);
  app.post("/api/users/signin", signIn);
  app.post("/api/users/signout", signOut);
  app.post("/api/users/signup/user", signUpAsUser);
  app.post("/api/users/signup/admin", signUpAsAdmin);
  
}
