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
  { collection: "users" }
);

const upgradeSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    upgrade: { type: String, required: true }, // TODO: define upgrade enums
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

export const updateUserInfoByUserId = (user_id, userInfo) =>
  usersModel.updateOne({ user_id: user_id }, { $set: userInfo });

export const updateCoinsByUserId = (user_id, coins) =>
  usersModel.updateOne({ user_id: user_id }, { $set: { coins } });

export const createUpgrade = (user_id, upgrade) =>
  upgradesModel.create({ user_id, username: upgrade });

export const findUpgradesByUserId = (user_id) =>
  upgradesModel.find({ user_id });
