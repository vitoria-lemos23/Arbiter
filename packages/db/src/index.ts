import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // Reuse the connection across HMR reloads in development to avoid
  // exhausting the connection pool.
  // eslint-disable-next-line no-var
  var __arbiterDbClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and set it (see the repo README).",
  );
}

const client =
  globalThis.__arbiterDbClient ??
  postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalThis.__arbiterDbClient = client;
}

export const db = drizzle(client, { schema });

export * from "./schema";
