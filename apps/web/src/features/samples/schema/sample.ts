import { z } from "zod";

export const createSampleSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export type CreateSampleInput = z.infer<typeof createSampleSchema>;
