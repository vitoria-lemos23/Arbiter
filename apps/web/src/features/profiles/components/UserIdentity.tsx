import type { ProfileDoc } from "@arbiter/db";
import Link from "next/link";
import type { ReactNode } from "react";
import { shortAddress } from "@/features/tournaments/lib/formatTournament";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

/**
 * Shared propagation primitive (spec 009): given an `address` and its optional
 * resolved `profile`, renders the avatar + display name (or the `shortAddress`
 * + generated-avatar fallback) as a link to the public profile. Used wherever
 * an address is shown — participant lists, bracket cards, judging. Server-safe
 * (no hooks) so it drops into server and client components alike.
 */
export function UserIdentity({
  address,
  profile,
  size = "sm",
  subtitle,
  className,
  nameClassName,
}: {
  address: string;
  profile?: ProfileDoc;
  size?: "sm" | "md" | "lg";
  subtitle?: ReactNode;
  className?: string;
  nameClassName?: string;
}) {
  const name = profile?.displayName;
  return (
    <Link
      href={`/profile/${address.toLowerCase()}`}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md transition-colors hover:opacity-80",
        className,
      )}
    >
      <UserAvatar
        address={address}
        avatarUrl={profile?.avatarUrl}
        displayName={name}
        size={size}
      />
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate",
            name ? "font-medium" : "font-mono text-sm",
            nameClassName,
          )}
        >
          {name ?? shortAddress(address)}
        </span>
        {subtitle}
      </span>
    </Link>
  );
}
