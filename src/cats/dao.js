import mongoose from "mongoose";
import { RARITIES } from "../game/enums.js";

const userBreedSchema = (collection) => {
  const schema = new mongoose.Schema(
    {
      userId: { type: String, required: true },
      breed: { type: String, required: true },
    },
    { collection },
  );
  schema.index({ userId: 1, breed: 1 }, { unique: true });
  return schema;
};

const raritySchema = new mongoose.Schema(
  {
    breed: { type: String, required: true, unique: true },
    rarity: { type: String, enum: RARITIES, required: true },
  },
  { collection: "rarities" },
);

raritySchema.index({ rarity: 1 });

const ownershipsModel = mongoose.model(
  "ownerships",
  userBreedSchema("ownerships"),
);
const favoritesModel = mongoose.model(
  "favorites",
  userBreedSchema("favorites"),
);
const raritiesModel = mongoose.model("rarities", raritySchema);

export const findOwnedBreeds = (userId) =>
  ownershipsModel.distinct("breed", { userId }).exec();

export const findFavoriteBreeds = (userId) =>
  favoritesModel.distinct("breed", { userId }).exec();

export const createOwnership = (userId, breed) =>
  ownershipsModel.create({ userId, breed });

export const createFavorite = (userId, breed) =>
  favoritesModel.create({ userId, breed });

export const removeFavorite = (userId, breed) =>
  favoritesModel.deleteOne({ userId, breed }).exec();

export const findAllCats = () =>
  raritiesModel.find({}, "breed rarity -_id").lean().exec();
