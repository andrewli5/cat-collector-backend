import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config.js";

mongoose.connection.on("error", (err) =>
  console.error(`MongoDB error: ${err.message}`),
);

try {
  await mongoose.connect(config.mongoUri, { autoIndex: !config.isProduction });
  if (config.syncIndexes) {
    await Promise.all(
      Object.values(mongoose.models).map((model) => model.syncIndexes()),
    );
  }
} catch (err) {
  console.error(`Cannot connect to MongoDB: ${err.message}`);
  process.exit(1);
}

const server = createApp().listen(config.port, () =>
  console.log(`cat-collector listening on :${config.port} (${config.env})`),
);

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close();
  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
