"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + optional hint + control + inline error, sharing one id for a11y. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}

/**
 * Controlled ETH amount input: leading Ξ glyph, trailing ETH unit, mono digits.
 * `emphasized` gives the primary prize field a slightly larger, medium weight.
 */
export function EthInput({
  id,
  value,
  onChange,
  invalid,
  emphasized,
  disabled,
}: {
  id: string;
  value: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  emphasized?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
        Ξ
      </span>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={invalid}
        disabled={disabled}
        className={cn("pl-7 pr-14 font-mono", emphasized && "text-base")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ETH
      </span>
    </div>
  );
}

type Choice = { value: string; label: string };

/**
 * Segmented button group (e.g. max-players capacities). When `disabled`, it is
 * a read-only placeholder for a not-yet-supported option set.
 */
export function ChoiceGroup({
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  options: readonly Choice[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange?.(option.value)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              selected
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "border-input text-muted-foreground hover:bg-accent",
              disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Full-width status banner used for the connect / chain / config gates. */
export function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "destructive";
}) {
  return (
    <p
      className={cn(
        "rounded-lg border bg-muted/40 p-4 text-sm",
        tone === "destructive" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
