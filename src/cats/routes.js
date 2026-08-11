import express from "express";
import { z } from "zod";
import { RARITIES } from "../game/enums.js";
import {
  requireAuth,
  requireSelfOrAdmin,
  rollLimiter,
  userIdParams,
  validate,
} from "../http.js";
import * as service from "./service.js";

const breed = z.string().trim().min(1).max(64);
const breedBody = z.object({ breed });

export const catalogRouter = express.Router();

catalogRouter.get("/rarities", async (req, res) =>
  res.json((await service.getCatalog()).cats),
);

catalogRouter.get(
  "/rarities/:rarity",
  validate({ params: z.object({ rarity: z.enum(RARITIES) }) }),
  async (req, res) =>
    res.json(await service.getCatsByRarity(req.params.rarity)),
);

export const userCatsRouter = express.Router();

userCatsRouter.get(
  "/:userId/cats",
  validate({ params: userIdParams }),
  requireAuth,
  async (req, res) => res.json(await service.getOwnedBreeds(req.params.userId)),
);

userCatsRouter.get(
  "/:userId/favorites",
  validate({ params: userIdParams }),
  requireAuth,
  async (req, res) =>
    res.json(await service.getFavoriteBreeds(req.params.userId)),
);

userCatsRouter.post(
  "/:userId/favorites",
  validate({ params: userIdParams, body: breedBody }),
  requireAuth,
  requireSelfOrAdmin,
  async (req, res) =>
    res
      .status(201)
      .json(await service.addFavorite(req.params.userId, req.body.breed)),
);

userCatsRouter.delete(
  "/:userId/favorites/:breed",
  validate({ params: userIdParams.extend({ breed }) }),
  requireAuth,
  requireSelfOrAdmin,
  async (req, res) => {
    await service.removeFavorite(req.params.userId, req.params.breed);
    res.sendStatus(204);
  },
);

userCatsRouter.post(
  "/:userId/rolls",
  validate({ params: userIdParams }),
  requireAuth,
  requireSelfOrAdmin,
  rollLimiter,
  async (req, res) => res.json(await service.rollForUser(req.params.userId)),
);
