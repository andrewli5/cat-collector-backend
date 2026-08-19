import mongoose from "mongoose";
import { UPGRADE_IDS } from "../game/balance.js";
import { ROLES } from "../game/enums.js";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    profilePicture: String,
    role: { type: String, enum: ROLES, required: true, default: "USER" },
    coins: { type: Number, required: true, default: 500, min: 0 },
  },
  { collection: "users" },
);

const upgradeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    upgrade: { type: String, enum: UPGRADE_IDS, required: true },
  },
  { collection: "upgrades" },
);

upgradeSchema.index({ userId: 1, upgrade: 1 }, { unique: true });

const usersModel = mongoose.model("users", userSchema);
const upgradesModel = mongoose.model("upgrades", upgradeSchema);

const PUBLIC_FIELDS = "username profilePicture role coins";

export const createUser = (user) =>
  usersModel.create(user).then((doc) => findUserById(doc._id));

export const findAllUsers = () =>
  usersModel.find({}, PUBLIC_FIELDS).lean().exec();

export const findUserById = (userId) =>
  usersModel.findById(userId, PUBLIC_FIELDS).lean().exec();

export const findUserByUsername = (username) =>
  usersModel.findOne({ username }, PUBLIC_FIELDS).lean().exec();

export const findUserByUsernameForAuth = (username) =>
  usersModel
    .findOne({ username }, `${PUBLIC_FIELDS} passwordHash`)
    .lean()
    .exec();

export const updateUserById = (userId, fields) =>
  usersModel
    .findByIdAndUpdate(userId, fields, {
      new: true,
      runValidators: true,
      projection: PUBLIC_FIELDS,
    })
    .lean()
    .exec();

// Returns null when the balance guard fails, making the read-check-write a
// single atomic step that concurrent requests cannot interleave.
export const adjustCoins = (userId, delta, minimumBalance = 0) =>
  usersModel
    .findOneAndUpdate(
      { _id: userId, coins: { $gte: minimumBalance } },
      { $inc: { coins: delta } },
      { new: true, projection: PUBLIC_FIELDS },
    )
    .lean()
    .exec();

export const createUpgrade = (userId, upgrade) =>
  upgradesModel.create({ userId, upgrade });

export const findUpgradeIdsByUserId = (userId) =>
  upgradesModel.distinct("upgrade", { userId }).exec();
