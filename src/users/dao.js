import mongoose from "mongoose";
import { UPGRADES } from "../constants.js";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      required: true,
    },
    coins: { type: Number, required: true },
    rollCost: { type: Number, required: false },
    coinsPerClick: { type: Number, required: false },
    critChance: { type: Number, required: false },
  },
  { collection: "users" },
);

const upgradeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    upgrade: {
      type: String,
      enum: UPGRADES,
      required: true,
    }, // TODO: define upgrade enums
  },
  { collection: "upgrades" }
);

const usersModel = mongoose.model("users", userSchema);
const upgradesModel = mongoose.model("upgrades", upgradeSchema);

export const createUser = (user) =>
  usersModel.create({ ...user, role: "USER", coins: 500 });

export const createAdmin = (user) =>
  usersModel.create({ ...user, role: "ADMIN", coins: 9999999 });

export const findAllUsers = () => usersModel.find();

export const findUserByUsername = (username) =>
  usersModel.findOne({ username: username });

export const findUserByCredentials = (username, password) =>
  usersModel.findOne({ username, password });

export const findUserById = (id) =>
  usersModel.findOne({ _id: id });

export const updateUserInfoByUserId = (userId, userInfo) =>
  usersModel.updateOne({ _id: userId }, { $set: userInfo });

export const updateCoinsByUserId = (userId, coins) =>
  usersModel.updateOne({ _id: userId }, { $set: { coins } });

export const createUpgrade = (userId, upgrade) =>
  upgradesModel.create({ user_id: userId, username: upgrade });

export const findUpgradesByUserId = (userId) =>
  upgradesModel.find({ user_id: userId });
