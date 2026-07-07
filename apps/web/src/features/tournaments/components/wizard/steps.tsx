"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  MAX_PLAYERS_OPTIONS,
  TOURNAMENT_FORMATS,
  type WizardValues,
} from "../../schema/createTournament";
import { CoverImageField } from "./CoverImageField";
import { ChoiceGroup, EthInput } from "./fields";

/** Blank ETH input ⇒ "0" for read-only display. */
function ethDisplay(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "0" : trimmed;
}

/** datetime-local string → a friendly label, or an em dash when unset. */
function dateDisplay(value: string): string {
  if (!value) return "\u2014";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function judgeCount(value: string): number {
  return value.split(/[\s,]+/).filter(Boolean).length;
}

/** Label row with an optional right-aligned hint, shared across step fields. */
function LabelWithHint({ label, hint }: { label: string; hint?: string }) {
  if (!hint) return <FormLabel>{label}</FormLabel>;
  return (
    <div className="flex items-baseline justify-between gap-2">
      <FormLabel>{label}</FormLabel>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

// --- Step 1 · Name -------------------------------------------------------

export function StepName() {
  const { control } = useFormContext<WizardValues>();
  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Winter Clash 2025" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder={"Describe your tournament\u2026"}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="game"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Game / category</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Fighting" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <CoverImageField />
    </div>
  );
}

// --- Step 2 · Format -----------------------------------------------------

export function StepFormat() {
  const { control } = useFormContext<WizardValues>();
  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Format</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TOURNAMENT_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={String(f.value)}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="maxPlayers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max players</FormLabel>
            <FormControl>
              <ChoiceGroup
                className="grid-cols-4 sm:grid-cols-7"
                value={field.value}
                onChange={field.onChange}
                options={MAX_PLAYERS_OPTIONS.map((n) => ({
                  value: String(n),
                  label: String(n),
                }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// --- Step 3 · Prize ------------------------------------------------------

export function StepPrize() {
  const { control } = useFormContext<WizardValues>();
  const prize = ethDisplay(useWatch({ control, name: "prize" }));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <FormField
          control={control}
          name="prize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize amount</FormLabel>
              <FormControl>
                <EthInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  emphasized
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Only native ETH is supported; ERC-20 selection is deferred. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">Token</span>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
          <div
            className="flex h-8 cursor-not-allowed items-center justify-between rounded-lg border border-input px-2.5 text-sm opacity-70"
            aria-disabled
          >
            <span>
              <span className="font-mono">Ξ</span> ETH
            </span>
            <span className="text-muted-foreground">▾</span>
          </div>
        </div>
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

export function StepApply() {
  const { control } = useFormContext<WizardValues>();
  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={control}
        name="entryFee"
        render={({ field }) => (
          <FormItem>
            <LabelWithHint
              label="Entry fee"
              hint="Stored on-chain, not collected"
            />
            <FormControl>
              <EthInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="judges"
        render={({ field }) => (
          <FormItem>
            <LabelWithHint
              label="Judges"
              hint={"Optional \u00B7 comma-separated addresses"}
            />
            <FormControl>
              <Input
                placeholder={"0xabc\u2026, 0xdef\u2026"}
                className="font-mono"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

export function StepReview() {
  const { control } = useFormContext<WizardValues>();
  const values = useWatch({ control });
  const formatLabel =
    TOURNAMENT_FORMATS.find((f) => String(f.value) === values.format)?.label ??
    values.format;
  const prize = ethDisplay(values.prize ?? "");
  const judges = judgeCount(values.judges ?? "");
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-x-10 sm:grid-cols-2">
        <SummaryItem label="Name" value={values.name || "\u2014"} />
        <SummaryItem label="Game" value={values.game || "\u2014"} />
        <SummaryItem label="Format" value={formatLabel} />
        <SummaryItem
          label="Start date"
          value={dateDisplay(values.startDate ?? "")}
        />
        <SummaryItem label="Max players" value={values.maxPlayers} mono />
        <SummaryItem
          label="End date"
          value={dateDisplay(values.endDate ?? "")}
        />
        <SummaryItem label="Prize pool" value={`Ξ${prize}`} mono />
        <SummaryItem
          label="Entry fee"
          value={`Ξ${ethDisplay(values.entryFee ?? "")}`}
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
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono")}>
        {value ?? "\u2014"}
      </dd>
    </div>
  );
}
