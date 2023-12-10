import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    breed: { type: String, required: true },
  },
  { collection: "ownerships" },
);

const favoritesSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
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

export const findOwnershipListByUserId = (user_id) => {
  return ownershipsModel.find({ user_id });
};

export const findFavoriteListByUserId = (user_id) => {
  return favoritesModel.find({ user_id });
}

export const createOwnership = (user_id, breed) => {
  return ownershipsModel.create({ user_id, breed });
};

export const createFavorite = (user_id, breed)  => {
  return favoritesModel.create({ user_id, breed });
};

export const removeFavorite = (user_id, breed) => {
  return favoritesModel.deleteOne({ user_id, breed });
}

export const getCatsByRarity = (rarity) => {
  return raritiesModel.find({ rarity });
};

export const getCats = () => {
  return raritiesModel.find();
};
