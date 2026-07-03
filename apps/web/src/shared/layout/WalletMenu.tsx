"use client";

import { CaretDownIcon, SignOutIcon } from "@phosphor-icons/react";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWalletConnect } from "@/shared/web3/hooks/useWalletConnect";

function shorten(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatBalance(value: bigint, decimals: number, symbol: string) {
  const amount = Number(formatUnits(value, decimals)).toFixed(2);
  return symbol === "ETH" ? `${amount}Ξ` : `${amount} ${symbol}`;
}

/**
 * Wallet control for the top bar: a connect button when disconnected, or a
 * status chip (live dot · address · balance) with a disconnect menu once connected.
 */
export function WalletMenu() {
  const {
    address,
    isConnected,
    connect,
    connectors,
    disconnect,
    isPending,
    balance,
  } = useWalletConnect();

  if (!isConnected || !address) {
    const injected = connectors[0];
    return (
      <Button
        type="button"
        size="sm"
        disabled={isPending || !injected}
        onClick={() => injected && connect({ connector: injected })}
      >
        {isPending ? "Connecting…" : "Connect wallet"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <span
            className="size-1.5 rounded-full bg-green-500"
            aria-hidden="true"
          />
          <span className="font-mono text-foreground">{shorten(address)}</span>
          {balance && (
            <span className="font-mono text-muted-foreground">
              {formatBalance(balance.value, balance.decimals, balance.symbol)}
            </span>
          )}
          <CaretDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="font-mono text-xs font-normal text-muted-foreground">
          {shorten(address)}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          <SignOutIcon />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
