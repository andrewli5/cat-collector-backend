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
    username: { type: String, required: true },
    upgrade: { type: String, required: true }, // TODO: define upgrade enums
  },
  { collection: "upgrades" },
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
export const updateUserInfo = (username, userInfo) =>
  usersModel.updateOne({ username: username }, { $set: userInfo });
export const updateUserCoins = (username, coins) =>
  usersModel.updateOne({ username: username }, { $set: { coins } });
export const createUpgrade = (username, upgrade) => upgradesModel.create({ username, upgrade });
export const findUpgradesByUsername = (username) => upgradesModel.find({ username });
