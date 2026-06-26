import "dotenv/config";
import { db } from "./index";
import { samples } from "./schema";

/**
 * Idempotent local-dev seed. Run with `pnpm --filter @arbiter/db db:seed`
 * (or `pnpm db:seed` from the repo root) against a running database.
 */

const seedSamples = ["Hello World", "Olá Mundo", "Bonjour le monde"];

async function seed() {
  const existing = await db.select().from(samples).limit(1);
  if (existing.length > 0) {
    console.log("samples table already has rows — skipping seed.");
    return;
  }

  await db.insert(samples).values(seedSamples.map((name) => ({ name })));
  console.log(`Seeded ${seedSamples.length} samples.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
