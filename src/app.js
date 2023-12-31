import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import "dotenv/config";
import { CatRoutes } from "./cats/routes.js";
import { UserRoutes } from "./users/routes.js";
import { InfoRoutes } from "./info/routes.js";
import MongoStore from "connect-mongo";

const CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
mongoose.connect(CONNECTION_STRING);

const sessionOptions = {
  secret: "any string",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: CONNECTION_STRING })
}

if (process.env.NODE_ENV !== "development") {
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    secure: true,
  };
}

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL_DEV, process.env.FRONTEND_URL_PROD],
    credentials: true,
  }),
);

app.use(session(sessionOptions));
app.use(express.json());
UserRoutes(app);
CatRoutes(app);
InfoRoutes(app);
app.listen(process.env.PORT || 4000);
