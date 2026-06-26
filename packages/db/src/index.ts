import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // Reuse the connection across HMR reloads in development to avoid
  // exhausting the connection pool.
  // eslint-disable-next-line no-var
  var __arbiterDbClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__arbiterDbClient ??
  postgres(process.env.DATABASE_URL ?? "", { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalThis.__arbiterDbClient = client;
}

export const db = drizzle(client, { schema });

export * from "./schema";
