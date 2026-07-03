"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Controlled ETH amount input: leading Ξ glyph, trailing ETH unit, mono digits.
 * `emphasized` gives the primary prize field a slightly larger, medium weight.
 *
 * Forwards `ref` and any extra props (id, aria-*) onto the inner {Input} so it
 * can sit inside shadcn's {FormControl} `Slot` and stay label/error-linked.
 */
export const EthInput = React.forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange?: (value: string) => void;
    emphasized?: boolean;
    disabled?: boolean;
  } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">
>(({ value, onChange, emphasized, className, ...props }, ref) => {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
        Ξ
      </span>
      <Input
        ref={ref}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "pl-7 pr-14 font-mono",
          emphasized && "text-base",
          className,
        )}
        {...props}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ETH
      </span>
    </div>
  );
});
EthInput.displayName = "EthInput";

type Choice = { value: string; label: string };

/**
 * Segmented button group (e.g. max-players capacities). When `disabled`, it is
 * a read-only placeholder for a not-yet-supported option set. Forwards `ref` and
 * extra props so it can be a shadcn {FormControl} child.
 */
export const ChoiceGroup = React.forwardRef<
  HTMLDivElement,
  {
    options: readonly Choice[];
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
  } & Omit<React.ComponentProps<"div">, "onChange">
>(({ options, value, onChange, disabled, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("grid gap-2", className)} {...props}>
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
});
ChoiceGroup.displayName = "ChoiceGroup";

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
