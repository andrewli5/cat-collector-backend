import mongoose from "mongoose";

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
  },
  { collection: "users" },
);

const upgradeSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    upgrade: {
      type: String,
      enum: [
        "LUCK1",
        "LUCK2",
        "LUCK3",
        "CRIT1",
        "CRIT2",
        "CRIT3",
        "COIN1",
        "COIN2",
        "COIN3",
        "COST1",
        "COST2",
        "COST3",
      ],
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
