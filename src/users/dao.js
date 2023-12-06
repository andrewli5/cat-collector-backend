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

const model = mongoose.model("users", userSchema);

export const createUser = (user) => model.create({...user, role: "USER", coins: 500});
export const createAdmin = (user) => model.create({ ...user, role: "ADMIN", coins: 9999999});
export const findAllUsers = () => model.find();
export const findUserById = (userId) => model.findById(userId);
export const findUserByUsername = (username) =>
  model.findOne({ username: username });
export const findUserByCredentials = (username, password) =>
  model.findOne({ username, password });
export const updateUser = (userId, user) =>
  model.updateOne({ _id: userId }, { $set: user });
export const deleteUser = (userId) => model.deleteOne({ _id: userId });
