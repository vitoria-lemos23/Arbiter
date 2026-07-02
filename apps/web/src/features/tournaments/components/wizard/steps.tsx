"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type FieldErrors,
  MAX_PLAYERS_OPTIONS,
  TOURNAMENT_FORMATS,
  type WizardValues,
} from "../../schema/createTournament";
import { ChoiceGroup, EthInput, Field } from "./fields";

export type StepProps = {
  idPrefix: string;
  values: WizardValues;
  errors: FieldErrors;
  set: (field: keyof WizardValues, value: string) => void;
};

/** Blank ETH input ⇒ "0" for read-only display. */
function ethDisplay(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "0" : trimmed;
}

/** datetime-local string → a friendly label, or an em dash when unset. */
function dateDisplay(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function judgeCount(value: string): number {
  return value.split(/[\s,]+/).filter(Boolean).length;
}

// --- Step 1 · Name -------------------------------------------------------

export function StepName({ idPrefix, values, errors, set }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field id={`${idPrefix}-name`} label="Name" error={errors.name}>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Winter Clash 2025"
          aria-invalid={Boolean(errors.name)}
        />
      </Field>

      <Field
        id={`${idPrefix}-description`}
        label="Description"
        error={errors.description}
      >
        <Textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe your tournament…"
        />
      </Field>

      <Field
        id={`${idPrefix}-game`}
        label="Game / category"
        error={errors.game}
      >
        <Input
          id={`${idPrefix}-game`}
          value={values.game}
          onChange={(e) => set("game", e.target.value)}
          placeholder="e.g. Fighting"
        />
      </Field>

      {/* Cover upload is deferred (metadata write path out of scope). */}
      <Field id={`${idPrefix}-cover`} label="Cover image" hint="Coming soon">
        <div
          className="grid cursor-not-allowed place-items-center gap-1 rounded-lg border border-dashed border-input px-4 py-8 text-center opacity-70"
          aria-disabled
        >
          <span className="text-sm text-muted-foreground">
            Click to upload or drag &amp; drop
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            PNG · JPG up to 5 MB
          </span>
        </div>
      </Field>
    </div>
  );
}

// --- Step 2 · Format -----------------------------------------------------

export function StepFormat({ idPrefix, values, errors, set }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field id={`${idPrefix}-format`} label="Format" error={errors.format}>
        <Select value={values.format} onValueChange={(v) => set("format", v)}>
          <SelectTrigger id={`${idPrefix}-format`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOURNAMENT_FORMATS.map((f) => (
              <SelectItem key={f.value} value={String(f.value)}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        id={`${idPrefix}-maxPlayers`}
        label="Max players"
        error={errors.maxPlayers}
      >
        <ChoiceGroup
          className="grid-cols-4 sm:grid-cols-7"
          value={values.maxPlayers}
          onChange={(v) => set("maxPlayers", v)}
          options={MAX_PLAYERS_OPTIONS.map((n) => ({
            value: String(n),
            label: String(n),
          }))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={`${idPrefix}-start`}
          label="Start date"
          error={errors.startDate}
        >
          <Input
            id={`${idPrefix}-start`}
            type="datetime-local"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            aria-invalid={Boolean(errors.startDate)}
          />
        </Field>
        <Field id={`${idPrefix}-end`} label="End date" error={errors.endDate}>
          <Input
            id={`${idPrefix}-end`}
            type="datetime-local"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            aria-invalid={Boolean(errors.endDate)}
          />
        </Field>
      </div>
    </div>
  );
}

// --- Step 3 · Prize ------------------------------------------------------

export function StepPrize({ idPrefix, values, errors, set }: StepProps) {
  const prize = ethDisplay(values.prize);
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <Field
          id={`${idPrefix}-prize`}
          label="Prize amount"
          error={errors.prize}
        >
          <EthInput
            id={`${idPrefix}-prize`}
            value={values.prize}
            onChange={(v) => set("prize", v)}
            invalid={Boolean(errors.prize)}
            emphasized
          />
        </Field>
        {/* Only native ETH is supported; ERC-20 selection is deferred. */}
        <Field id={`${idPrefix}-token`} label="Token" hint="Coming soon">
          <div
            className="flex h-8 cursor-not-allowed items-center justify-between rounded-lg border border-input px-2.5 text-sm opacity-70"
            aria-disabled
          >
            <span>
              <span className="font-mono">Ξ</span> ETH
            </span>
            <span className="text-muted-foreground">▾</span>
          </div>
        </Field>
      </div>

      {/* Winner-takes-all: the contract pays a single champion. Multi-place
          splits are a placeholder for a future prize-distribution feature. */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Payout split</span>
        <div className="flex items-center gap-3">
          <span className="w-20 text-sm text-muted-foreground">1st place</span>
          <Input
            className="w-24 font-mono"
            value="100"
            disabled
            aria-label="First place payout percent"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <span className="cursor-not-allowed text-sm text-muted-foreground opacity-70">
          + Add 2nd / 3rd place split (coming soon)
        </span>
      </div>

      <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
        <div className="mb-2 text-sm font-semibold text-primary">
          Escrow preview
        </div>
        <PreviewRow label="Prize locked" value={`Ξ${prize}`} />
        <PreviewRow label="Deploy" value="EIP-1167 proxy" muted />
        <div className="my-2 border-t border-primary/20" />
        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-semibold">Total to deposit</span>
          <span className="font-mono text-sm font-semibold">Ξ{prize}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          The prize is sent as the transaction value on deploy; the CREATE2
          clone also costs network gas.
        </p>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

// --- Step 4 · Apply ------------------------------------------------------

const REGISTRATION_FIELDS = [
  { label: "Display name", required: true },
  { label: "In-game handle", required: true },
  { label: "Date of birth", required: false },
  { label: "Discord username", required: false },
] as const;

const JUDGE_MODES = [
  { value: "invite", label: "Invite only" },
  { value: "application", label: "Application" },
  { value: "open", label: "Open pool" },
] as const;

export function StepApply({ idPrefix, values, errors, set }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field
        id={`${idPrefix}-fee`}
        label="Entry fee"
        hint="Stored on-chain, not collected"
        error={errors.entryFee}
      >
        <EthInput
          id={`${idPrefix}-fee`}
          value={values.entryFee}
          onChange={(v) => set("entryFee", v)}
          invalid={Boolean(errors.entryFee)}
        />
      </Field>

      <Field
        id={`${idPrefix}-judges`}
        label="Judges"
        hint="Optional · comma-separated addresses"
        error={errors.judges}
      >
        <Input
          id={`${idPrefix}-judges`}
          value={values.judges}
          onChange={(e) => set("judges", e.target.value)}
          placeholder="0xabc…, 0xdef…"
          className="font-mono"
          aria-invalid={Boolean(errors.judges)}
        />
      </Field>

      {/* Registration fields + judge-selection mode are product placeholders —
          neither is captured by the current contract. */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Registration fields{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (coming soon)
          </span>
        </span>
        <div className="flex flex-col gap-2 opacity-70">
          {REGISTRATION_FIELDS.map((f) => (
            <label
              key={f.label}
              className="flex cursor-not-allowed items-center gap-2 text-sm"
            >
              <input type="checkbox" disabled defaultChecked={f.required} />
              <span>
                {f.label}
                {f.required ? " (required)" : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Judge selection{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (coming soon)
          </span>
        </span>
        <ChoiceGroup
          className="grid-cols-3"
          options={JUDGE_MODES}
          value="invite"
          disabled
        />
      </div>
    </div>
  );
}

// --- Step 5 · Review -----------------------------------------------------

export function StepReview({ values }: { values: WizardValues }) {
  const formatLabel =
    TOURNAMENT_FORMATS.find((f) => String(f.value) === values.format)?.label ??
    values.format;
  const prize = ethDisplay(values.prize);
  const judges = judgeCount(values.judges);
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <SummaryItem label="Name" value={values.name || "—"} />
        <SummaryItem label="Game" value={values.game || "—"} />
        <SummaryItem label="Format" value={formatLabel} />
        <SummaryItem label="Start date" value={dateDisplay(values.startDate)} />
        <SummaryItem label="Max players" value={values.maxPlayers} mono />
        <SummaryItem label="End date" value={dateDisplay(values.endDate)} />
        <SummaryItem label="Prize pool" value={`Ξ${prize}`} mono />
        <SummaryItem
          label="Entry fee"
          value={`Ξ${ethDisplay(values.entryFee)}`}
          mono
        />
        <SummaryItem
          label="Judges"
          value={judges === 0 ? "None" : String(judges)}
          mono={judges > 0}
        />
        <SummaryItem label="Payout" value="1st: 100%" mono />
      </dl>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        <span className="font-semibold">On-chain action required.</span>{" "}
        Clicking “Deploy” prompts your wallet to sign a transaction that deploys
        the tournament and locks <span className="font-mono">Ξ{prize}</span> in
        escrow.
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
