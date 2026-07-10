import { cn } from "@/lib/utils";

/**
 * Renders a user's avatar (spec 009): the uploaded image when `avatarUrl` is
 * set, else a deterministic generated fallback — a colour picked from the
 * address plus its first two hex chars, so the same address always looks the
 * same across the app. Presentational and server-safe (no hooks / "use client")
 * so it works inside both server and client components.
 */

/** A fixed palette (index chosen by the address) keeps the colour deterministic
 *  without dynamic inline styles. */
const AVATAR_PALETTE = [
  "bg-red-500/15 text-red-700 dark:text-red-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
] as const;

/** Deterministic palette index from the address hex (ignores the `0x` prefix). */
function paletteClass(address: string): string {
  let sum = 0;
  for (let i = 2; i < address.length; i++) sum += address.charCodeAt(i);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

const SIZE = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-xl",
} as const;

export function UserAvatar({
  address,
  avatarUrl,
  displayName,
  size = "sm",
  className,
}: {
  address: string;
  avatarUrl?: string;
  displayName?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const base = cn("shrink-0 rounded-full", SIZE[size], className);
  if (avatarUrl) {
    return (
      // Served from our own /api/images route; plain <img> keeps it a single
      // served path (matches CoverImagePicker's rationale).
      // biome-ignore lint/performance/noImgElement: served /api/images avatar
      <img
        src={avatarUrl}
        alt={displayName ? `${displayName} avatar` : "User avatar"}
        className={cn(base, "border border-input object-cover")}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        base,
        "grid place-items-center font-mono uppercase",
        paletteClass(address),
      )}
    >
      {address.slice(2, 4)}
    </span>
  );
}
