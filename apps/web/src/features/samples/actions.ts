"use server";

import { revalidatePath } from "next/cache";
import { createSample, createSampleSchema } from "./samples";

export type CreateSampleState = { error?: string; ok?: boolean };

export async function createSampleAction(
  _prev: CreateSampleState,
  formData: FormData,
): Promise<CreateSampleState> {
  const parsed = createSampleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createSample(parsed.data);
  revalidatePath("/");
  return { ok: true };
}