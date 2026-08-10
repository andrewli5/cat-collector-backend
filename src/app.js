import MongoStore from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { catalogRouter, userCatsRouter } from "./cats/routes.js";
import { config } from "./config.js";
import { errorHandler, notFound } from "./http.js";
import { infoRouter } from "./info/routes.js";
import { usersRouter } from "./users/routes.js";

export function createApp() {
  const app = express();

  if (config.isProduction) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: "16kb" }));
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      proxy: config.isProduction,
      store: MongoStore.create({ mongoUrl: config.mongoUri }),
      cookie: {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? "none" : "lax",
        maxAge: config.sessionTtlMs,
      },
    }),
  );

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/users", usersRouter);
  app.use("/api/users", userCatsRouter);
  app.use("/api/cats", catalogRouter);
  app.use("/api/info", infoRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
