"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTournament } from "../hooks/useCreateTournament";
import {
  createTournamentSchema,
  MAX_PLAYERS_OPTIONS,
  TOURNAMENT_FORMATS,
} from "../schema/createTournament";

type FieldErrors = Partial<Record<string, string>>;

/** Reads the raw form values keyed by field name. */
function readForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const get = (name: string) => String(data.get(name) ?? "");
  return {
    name: get("name"),
    format: get("format"),
    maxPlayers: get("maxPlayers"),
    startDate: get("startDate"),
    endDate: get("endDate"),
    prize: get("prize"),
    entryFee: get("entryFee"),
    judges: get("judges"),
  };
}

/**
 * Presentational create-tournament form. Validates with the Zod schema and
 * renders inline per-field errors *before* any wallet interaction; all
 * wallet/tx logic lives in {useCreateTournament}.
 */
export function CreateTournamentForm() {
  const {
    isConnected,
    wrongChain,
    canSubmit,
    busy,
    isPending,
    isConfirming,
    isSuccess,
    error,
    predictedAddress,
    switchNetwork,
    createTournament,
  } = useCreateTournament();
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = useId();

  // Reset the form once the creation tx is mined (temporary UX — a later
  // iteration redirects to the tournament's details page instead).
  useEffect(() => {
    if (isSuccess) {
      formRef.current?.reset();
      setErrors({});
    }
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect a wallet to create a tournament.
      </p>
    );
  }

  if (wrongChain) {
    return (
      <Button type="button" onClick={switchNetwork} className="self-start">
        Switch network
      </Button>
    );
  }

  if (!canSubmit) {
    return (
      <p className="text-sm text-destructive">
        Tournament factory address is not configured. Set
        <code className="mx-1 font-mono">NEXT_PUBLIC_FACTORY_ADDRESS</code>
        to enable creation.
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createTournamentSchema.safeParse(
      readForm(event.currentTarget),
    );
    if (!result.success) {
      const next: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    createTournament(result.data);
  }

  const submitLabel = isPending
    ? "Confirm in wallet…"
    : isConfirming
      ? "Mining…"
      : "Create tournament";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field id={`${fieldId}-name`} label="Name" error={errors.name}>
        <Input id={`${fieldId}-name`} name="name" placeholder="Spring Cup" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${fieldId}-format`} label="Format" error={errors.format}>
          <Select name="format" defaultValue="0">
            <SelectTrigger id={`${fieldId}-format`}>
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
          id={`${fieldId}-maxPlayers`}
          label="Max players"
          error={errors.maxPlayers}
        >
          <Select name="maxPlayers" defaultValue="8">
            <SelectTrigger id={`${fieldId}-maxPlayers`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAX_PLAYERS_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${fieldId}-start`} label="Start" error={errors.startDate}>
          <Input
            id={`${fieldId}-start`}
            name="startDate"
            type="datetime-local"
            aria-invalid={Boolean(errors.startDate)}
          />
        </Field>
        <Field id={`${fieldId}-end`} label="End" error={errors.endDate}>
          <Input
            id={`${fieldId}-end`}
            name="endDate"
            type="datetime-local"
            aria-invalid={Boolean(errors.endDate)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${fieldId}-prize`} label="Prize (ETH)" error={errors.prize}>
          <Input
            id={`${fieldId}-prize`}
            name="prize"
            inputMode="decimal"
            defaultValue="0"
            aria-invalid={Boolean(errors.prize)}
          />
        </Field>
        <Field
          id={`${fieldId}-fee`}
          label="Entry fee (ETH, optional)"
          error={errors.entryFee}
        >
          <Input
            id={`${fieldId}-fee`}
            name="entryFee"
            inputMode="decimal"
            defaultValue="0"
            aria-invalid={Boolean(errors.entryFee)}
          />
        </Field>
      </div>

      <Field
        id={`${fieldId}-judges`}
        label="Judges (optional, comma-separated addresses)"
        error={errors.judges}
      >
        <Input
          id={`${fieldId}-judges`}
          name="judges"
          placeholder="0xabc…, 0xdef…"
          aria-invalid={Boolean(errors.judges)}
        />
      </Field>

      <Button type="submit" disabled={busy} className="self-start">
        {submitLabel}
      </Button>

      {error ? (
        <p className="text-sm text-destructive">
          {error.message.split("\n")[0]}
        </p>
      ) : null}

      {isSuccess && predictedAddress ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Tournament created at{" "}
          <span className="font-mono break-all">{predictedAddress}</span>
        </p>
      ) : null}
    </form>
  );
}

/** Label + control + inline error, sharing one id for accessibility. */
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
