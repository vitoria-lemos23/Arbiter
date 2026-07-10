"use client";

import type { ProfileDoc } from "@arbiter/db";
import { useState } from "react";
import { getAddress } from "viem";
import { shortAddress } from "@/features/tournaments/lib/formatTournament";
import { UserAvatar } from "./UserAvatar";

/**
 * Avatar + display name + copyable address, shared by the own and public
 * profile views (spec 009). Client component only for the copy-to-clipboard
 * control; the data is passed in from the server pages. Falls back to the
 * checksummed short address when no display name is set.
 */
export function ProfileHeader({
  address,
  profile,
  action,
}: {
  address: string;
  profile: ProfileDoc | null;
  action?: React.ReactNode;
}) {
  const name = profile?.displayName ?? shortAddress(getAddress(address));
  return (
    <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <UserAvatar
        address={address}
        avatarUrl={profile?.avatarUrl}
        displayName={profile?.displayName}
        size="lg"
      />
      <div className="flex flex-col items-center gap-1 sm:items-start">
        <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
        <CopyAddress address={address} />
      </div>
      {action ? <div className="sm:ml-auto">{action}</div> : null}
    </header>
  );
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const checksummed = getAddress(address);

  async function copy() {
    await navigator.clipboard.writeText(checksummed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      title="Copy address"
    >
      {copied ? "Copied!" : checksummed}
    </button>
  );
}
