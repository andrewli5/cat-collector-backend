import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    breed: { type: String, required: true },
  },
  { collection: "ownerships" },
);

const favoriteSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
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
const favoritesModel = mongoose.model("favorites", favoriteSchema);
const raritiesModel = mongoose.model("rarities", raritySchema);

export const findOwnershipListByUsername = (username) => {
  return ownershipsModel.find({ username: username });
};

export const findFavoriteListByUsername = (username) => {
  return favoritesModel.find({ username: username});
}

export const createOwnership = (username, breed) => {
  return ownershipsModel.create({ username: username, breed: breed });
};

export const getCatsByRarity = (rarity) => {
  return raritiesModel.find({ rarity: rarity });
};

export const getCats = () => {
  return raritiesModel.find();
};
