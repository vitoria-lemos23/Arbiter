"use client";

import Link from "next/link";
import { isAddress, isAddressEqual } from "viem";
import { Button } from "@/components/ui/button";
import { useWalletConnect } from "@/shared/web3/hooks/useWalletConnect";

/**
 * On the public profile, shows an "Edit profile" link to `/profile` only when
 * the connected wallet is the profile subject (spec 009). Client component
 * because the connected address lives in wagmi; renders nothing otherwise.
 */
export function EditProfileLink({ address }: { address: string }) {
  const { address: connected } = useWalletConnect();
  if (!connected || !isAddress(address)) return null;
  if (!isAddressEqual(connected, address)) return null;
  return (
    <Button asChild variant="outline">
      <Link href="/profile">Edit profile</Link>
    </Button>
  );
}
