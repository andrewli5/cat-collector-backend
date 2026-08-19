import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { z } from "zod";
import * as usersDao from "./users/dao.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const httpError = (status, message) => new HttpError(status, message);

export const isDuplicateKeyError = (err) => err?.code === 11000;

export const objectId = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, "invalid id")
  .transform((id) => id.toLowerCase());

export const userIdParams = z.object({ userId: objectId });

export const validate = (schemas) => (req, res, next) => {
  for (const source of ["params", "query", "body"]) {
    const schema = schemas[source];
    if (!schema) continue;
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(httpError(400, z.prettifyError(result.error)));
    }
    if (source === "query") req.validatedQuery = result.data;
    else req[source] = result.data;
  }
  next();
};

export async function requireAuth(req, res, next) {
  const userId = req.session?.userId;
  const user = userId ? await usersDao.findUserById(userId) : null;
  if (!user) return next(httpError(401, "Not signed in."));
  req.user = user;
  next();
}

export const requireAdmin = (req, res, next) =>
  next(req.user.role === "ADMIN" ? undefined : httpError(403, "Forbidden."));

export const requireSelfOrAdmin = (req, res, next) =>
  next(
    req.user.role === "ADMIN" || req.params.userId === String(req.user._id)
      ? undefined
      : httpError(403, "Forbidden."),
  );

const limiter = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => req.session?.userId ?? ipKeyGenerator(req.ip),
    handler: (req, res, next) => next(httpError(429, "Too many requests.")),
  });

export const authLimiter = limiter(15 * 60_000, 30);
export const clickLimiter = limiter(60_000, 120);
export const rollLimiter = limiter(60_000, 60);

export const notFound = (req, res, next) =>
  next(httpError(404, `Cannot ${req.method} ${req.path}`));

const statusFor = (err) => {
  if (err.status) return err.status;
  if (err.name === "CastError" || err.name === "ValidationError") return 400;
  if (isDuplicateKeyError(err)) return 409;
  return 500;
};

// eslint-disable-next-line no-unused-vars -- Express detects error handlers by arity
export function errorHandler(err, req, res, next) {
  const status = statusFor(err);
  const deliberate = err instanceof HttpError || status < 500;
  if (!deliberate) console.error(err);
  res.status(status).json({
    message: deliberate ? err.message : "Internal server error.",
  });
}
