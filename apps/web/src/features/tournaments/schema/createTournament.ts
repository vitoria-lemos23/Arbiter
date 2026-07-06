import { getAddress, isAddress, parseEther, zeroAddress } from "viem";
import { z } from "zod";

/**
 * Bracket capacities offered in the UI. Every value is a power of two and >= 2,
 * matching {Tournament._validate}; presenting a fixed select makes invalid
 * capacities unrepresentable in the form.
 */
export const MAX_PLAYERS_OPTIONS = [2, 4, 8, 16, 32, 64, 128] as const;

/** Selectable formats. Only SingleElimination (enum index 0) exists on-chain. */
export const TOURNAMENT_FORMATS = [
  { value: 0, label: "Single elimination" },
] as const;

/** A decimal ETH amount string (e.g. "0.5"); `parseEther` turns it into wei. */
const ethAmount = z
  .string()
  .trim()
  .refine((v) => /^\d+(\.\d+)?$/.test(v), "Enter a non-negative amount")
  // The regex already bars negatives; this just guards against parseEther
  // throwing (e.g. too many decimals) before it reaches the contract.
  .refine((v) => {
    try {
      parseEther(v);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid amount");

/** Splits free-form judge input (newlines/commas/spaces) into address strings. */
const judgesField = z
  .string()
  .trim()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(
    z.array(z.string()).superRefine((list, ctx) => {
      const seen = new Set<string>();
      list.forEach((addr) => {
        if (!isAddress(addr)) {
          ctx.addIssue({ code: "custom", message: `Invalid address: ${addr}` });
          return;
        }
        if (addr === zeroAddress) {
          ctx.addIssue({
            code: "custom",
            message: "Zero address is not allowed",
          });
        }
        const key = addr.toLowerCase();
        if (seen.has(key)) {
          ctx.addIssue({ code: "custom", message: `Duplicate judge: ${addr}` });
        }
        seen.add(key);
      });
    }),
  );

export const createTournamentSchema = z
  .object({
    // Off-chain presentation metadata — persisted (signed) before the creation
    // tx via `saveTournamentMetadata`; not part of the on-chain params.
    name: z.string().trim().min(1, "Name is required").max(255),
    description: z.string().trim().max(2000).optional(),
    game: z.string().trim().max(100).optional(),
    // Populated by the cover uploader (a resolvable `/api/images/:id` URL).
    imageUrl: z.string().trim().optional(),
    format: z.coerce.number().refine((n) => n === 0, "Unsupported format"),
    maxPlayers: z.coerce
      .number()
      .int()
      .refine((n) => n >= 2, "At least 2 players")
      // Single-elimination has no byes only when capacity is a power of two.
      .refine((n) => (n & (n - 1)) === 0, "Must be a power of two"),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid start date"),
    endDate: z
      .string()
      .min(1, "End date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid end date"),
    prize: ethAmount,
    entryFee: ethAmount.optional().default("0"),
    judges: judgesField,
  })
  .superRefine((values, ctx) => {
    // Re-checked here (not just at submit) so the contract never reverts on a
    // guaranteed-invalid date and the organizer pays no gas.
    const start = Date.parse(values.startDate);
    const end = Date.parse(values.endDate);
    if (!Number.isNaN(start) && start <= Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date must be in the future",
      });
    }
    if (!Number.isNaN(start) && !Number.isNaN(end) && end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after the start date",
      });
    }
  });

export type CreateTournamentValues = z.infer<typeof createTournamentSchema>;

/** Local datetime string → unix seconds as a `uint64`-ready bigint. */
function toUnixSeconds(datetime: string): bigint {
  return BigInt(Math.floor(new Date(datetime).getTime() / 1000));
}

/** The on-chain `TournamentParams` struct (viem accepts a named-field object). */
export function toTournamentParams(values: CreateTournamentValues) {
  return {
    format: values.format,
    maxPlayers: values.maxPlayers,
    entryFee: parseEther(values.entryFee),
    startDate: toUnixSeconds(values.startDate),
    endDate: toUnixSeconds(values.endDate),
    judges: values.judges.map((j) => getAddress(j)),
  } as const;
}

/** Prize deposit in wei, sent as the tx `value` (`msg.value`). */
export function prizeWei(values: CreateTournamentValues): bigint {
  return parseEther(values.prize);
}

/**
 * Raw, all-string wizard state — the input the Zod schema parses (every field
 * is a string; the schema coerces them). Each of the five wizard steps owns a
 * subset of these fields for per-step validation.
 */
export type WizardValues = {
  name: string;
  description: string;
  game: string;
  imageUrl: string;
  format: string;
  maxPlayers: string;
  startDate: string;
  endDate: string;
  prize: string;
  entryFee: string;
  judges: string;
};

export const INITIAL_WIZARD_VALUES: WizardValues = {
  name: "",
  description: "",
  game: "",
  imageUrl: "",
  format: "0",
  maxPlayers: "8",
  startDate: "",
  endDate: "",
  prize: "0",
  entryFee: "0",
  judges: "",
};

/**
 * The five wizard steps. `fields` drives per-step validation (an error on a
 * field surfaces on its step) — Review owns none, it validates the whole form.
 */
export const WIZARD_STEPS = [
  {
    title: "Name",
    heading: "Tournament name",
    description: "Give your tournament a name, description, and cover.",
    fields: ["name", "description", "game"],
  },
  {
    title: "Format",
    heading: "Format",
    description: "Configure bracket structure and schedule.",
    fields: ["format", "maxPlayers", "startDate", "endDate"],
  },
  {
    title: "Prize",
    heading: "Prize & escrow",
    description: "Your prize is locked in escrow until a champion is decided.",
    fields: ["prize"],
  },
  {
    title: "Apply",
    heading: "Apply settings",
    description: "Configure entry requirements and judges.",
    fields: ["entryFee", "judges"],
  },
  {
    title: "Review",
    heading: "Review & deploy",
    description: "Publishing deploys an EIP-1167 proxy and deposits the prize.",
    fields: [],
  },
] as const;

/**
 * Index of the earliest wizard step carrying an error, or -1 when there are
 * none. Accepts any field→error map (React Hook Form's `formState.errors`
 * included, whose values are objects — only their presence matters here) so the
 * "Deploy" handler can jump back to the first invalid step.
 */
export function firstStepWithError(
  errors: Partial<Record<string, unknown>>,
): number {
  return WIZARD_STEPS.findIndex((s) => s.fields.some((f) => errors[f]));
}
