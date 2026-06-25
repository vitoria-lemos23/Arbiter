"use server";

import { revalidatePath } from "next/cache";
import { createSample, createSampleSchema } from "@/server/samples";
import { increment, incrementSchema } from "@/server/counter";

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

export type IncrementCounterState = { error?: string; ok?: boolean };

export async function incrementCounterAction(
  _prev: IncrementCounterState,
  formData: FormData,
): Promise<IncrementCounterState> {
  const parsed = incrementSchema.safeParse({ by: formData.get("by") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await increment(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Transaction failed" };
  }

  revalidatePath("/");
  return { ok: true };
}