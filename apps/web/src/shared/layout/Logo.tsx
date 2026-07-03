import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand mark for the top bar: lime monogram tile + wordmark.
 *
 * @example
 * <Logo />
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Arbiter home"
    >
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-[15px] font-bold text-primary-foreground">
        A
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Arbiter</span>
    </Link>
  );
}
