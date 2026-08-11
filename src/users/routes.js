import express from "express";
import { z } from "zod";
import { MAX_CLICKS_PER_REQUEST, UPGRADE_IDS } from "../game/balance.js";
import { ROLES } from "../game/enums.js";
import {
  authLimiter,
  clickLimiter,
  requireAdmin,
  requireAuth,
  requireSelfOrAdmin,
  userIdParams,
  validate,
} from "../http.js";
import * as service from "./service.js";

const username = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[\w.-]+$/, "letters, digits, dot, dash and underscore only");
const name = z.string().trim().max(64);

const signUpBody = z.object({
  username,
  password: z.string().min(8).max(128),
  firstName: name.optional(),
  lastName: name.optional(),
  profilePicture: z.string().trim().max(512).optional(),
});

const signInBody = z.object({
  username: z.string().max(128),
  password: z.string().max(128),
});

const updateUserBody = z
  .object({
    username,
    firstName: name,
    lastName: name,
    profilePicture: z.string().trim().max(512),
    role: z.enum(ROLES),
    coins: z.int().min(0),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "no fields to update");

const clicksBody = z.object({
  clicks: z.int().min(1).max(MAX_CLICKS_PER_REQUEST),
});

const upgradeBody = z.object({ upgrade: z.enum(UPGRADE_IDS) });

const startSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = String(user._id);
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });

export const usersRouter = express.Router();

usersRouter.post(
  "/signup",
  authLimiter,
  validate({ body: signUpBody }),
  async (req, res) => {
    const user = await service.signUp(req.body);
    await startSession(req, user);
    res.status(201).json(user);
  },
);

usersRouter.post(
  "/signin",
  authLimiter,
  validate({ body: signInBody }),
  async (req, res) => {
    const user = await service.signIn(req.body.username, req.body.password);
    await startSession(req, user);
    res.json(user);
  },
);

usersRouter.post("/signout", (req, res, next) =>
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  }),
);

usersRouter.get("/", requireAuth, requireAdmin, async (req, res) =>
  res.json(await service.listUsers()),
);

usersRouter.get("/me", requireAuth, (req, res) => res.json(req.user));

usersRouter.get(
  "/by-username/:username",
  requireAuth,
  validate({ params: z.object({ username: z.string().max(128) }) }),
  async (req, res) =>
    res.json(await service.getUserByUsername(req.params.username)),
);

usersRouter.get(
  "/:userId/data",
  validate({ params: userIdParams }),
  requireAuth,
  requireSelfOrAdmin,
  async (req, res) => res.json(await service.getUserData(req.params.userId)),
);

usersRouter.put(
  "/:userId",
  validate({ params: userIdParams, body: updateUserBody }),
  requireAuth,
  requireAdmin,
  async (req, res) =>
    res.json(await service.updateUser(req.params.userId, req.body)),
);

usersRouter.post(
  "/:userId/clicks",
  validate({ params: userIdParams, body: clicksBody }),
  requireAuth,
  requireSelfOrAdmin,
  clickLimiter,
  async (req, res) =>
    res.json(await service.bankClicks(req.params.userId, req.body.clicks)),
);

usersRouter.post(
  "/:userId/upgrades",
  validate({ params: userIdParams, body: upgradeBody }),
  requireAuth,
  requireSelfOrAdmin,
  async (req, res) =>
    res
      .status(201)
      .json(await service.purchaseUpgrade(req.params.userId, req.body.upgrade)),
);
