import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    breed: { type: String, required: true },
  },
  { collection: "ownerships" },
);

const favoritesSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    breed: { type: String, required: true },
  },
  { collection: "favorites" },
);

const raritySchema = new mongoose.Schema(
  {
    breed: { type: String, required: true },
    rarity: {
      type: String,
      enum: ["C", "U", "R", "E", "L", "M"],
      required: true,
    },
  },
  { collection: "rarities" },
);

const ownershipsModel = mongoose.model("ownerships", ownershipSchema);
const favoritesModel = mongoose.model("favorites", favoritesSchema);
const raritiesModel = mongoose.model("rarities", raritySchema);

export const findOwnershipListByUserId = (userId) => {
  return ownershipsModel.find({ userId });
};

export const findFavoriteListByUserId = (userId) => {
  return favoritesModel.find({ userId });
};

export const createOwnership = (userId, breed) => {
  return ownershipsModel.create({ userId, breed });
};

export const createFavorite = (userId, breed) => {
  return favoritesModel.create({ userId, breed });
};

export const removeFavorite = (userId, breed) => {
  return favoritesModel.deleteOne({ userId, breed });
};

export const getCatsByRarity = (rarity) => {
  return raritiesModel.find({ rarity });
};

export const getCats = () => {
  return raritiesModel.find();
};
