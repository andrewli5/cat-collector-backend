import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DB_CONNECTION_STRING: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) => value.split(",").map((origin) => origin.trim()))
    .pipe(z.array(z.url()).nonempty()),
  SESSION_TTL_DAYS: z.coerce.number().positive().default(7),
  SYNC_INDEXES: z.stringbool().default(false),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
  );
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  port: env.PORT,
  mongoUri: env.DB_CONNECTION_STRING,
  sessionSecret: env.SESSION_SECRET,
  corsOrigins: env.CORS_ORIGINS,
  sessionTtlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  syncIndexes: env.SYNC_INDEXES,
};
