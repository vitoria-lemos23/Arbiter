import { z } from "zod";

/**
 * Validated, typed access to the browser-exposed environment.
 *
 * Each `NEXT_PUBLIC_*` value is referenced statically below so Next.js can
 * inline it at build time. Parsing happens once at import; a malformed value
 * fails fast instead of surfacing as a confusing runtime error later.
 */
export const envSchema = z.object({
  NEXT_PUBLIC_RPC_URL: z.url().default("http://127.0.0.1:8545"),
  NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().positive().default(31337),
  NEXT_PUBLIC_COUNTER_ADDRESS: z
    .custom<`0x${string}`>(
      (v) => typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v),
      "must be a 0x-prefixed 20-byte address",
    )
    .optional(),
});

// Treat empty strings (e.g. an unset `KEY=` line in .env) as absent so
// defaults/optionals apply instead of failing validation.
const clean = (v: unknown) => (v === "" ? undefined : v);

export const env = envSchema.parse({
  NEXT_PUBLIC_RPC_URL: clean(process.env.NEXT_PUBLIC_RPC_URL),
  NEXT_PUBLIC_CHAIN_ID: clean(process.env.NEXT_PUBLIC_CHAIN_ID),
  NEXT_PUBLIC_COUNTER_ADDRESS: clean(process.env.NEXT_PUBLIC_COUNTER_ADDRESS),
});
