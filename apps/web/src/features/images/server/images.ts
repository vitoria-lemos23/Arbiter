import "server-only";
import { db, images } from "@arbiter/db";
import { eq } from "drizzle-orm";
import type { AllowedImageMimeType } from "../schema/image";

/**
 * Data-access for the binary `images` table. postgres-js round-trips `bytea`
 * as a Node `Buffer`, so bytes go in and come back out unchanged.
 */

export async function storeImage(input: {
  data: Buffer;
  mimeType: AllowedImageMimeType;
}): Promise<{ id: string }> {
  const [row] = await db
    .insert(images)
    .values({
      data: input.data,
      mimeType: input.mimeType,
      sizeBytes: input.data.length,
    })
    .returning({ id: images.id });
  return row;
}

export async function getImage(
  id: string,
): Promise<{ data: Buffer; mimeType: string } | undefined> {
  const [row] = await db
    .select({ data: images.data, mimeType: images.mimeType })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  return row;
}
