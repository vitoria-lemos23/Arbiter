import "server-only";
import { db, samples } from "@arbiter/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

/**
 * Data-access functions for the sample table. Kept as tidy, transport-agnostic
 * functions so they can be lifted into a shared package if a separate backend
 * (mobile API, etc.) is needed later.
 */

export const createSampleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export type CreateSampleInput = z.infer<typeof createSampleSchema>;

export async function listSamples() {
  return db.select().from(samples).orderBy(desc(samples.createdAt));
}

export async function createSample(input: CreateSampleInput) {
  const data = createSampleSchema.parse(input);
  const [row] = await db.insert(samples).values(data).returning();
  return row;
}