import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    breed: { type: String, required: true },
  },
  { collection: "ownerships" }
);

const ownershipsModel = mongoose.model("ownerships", ownershipSchema);

export const findOwnershipListByUsername = (username) =>  {
    return ownershipsModel.find({ username: username });
}


