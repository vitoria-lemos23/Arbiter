"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function shorten(address: `0x${string}`) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono">{shorten(address)}</span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded border px-2 py-1 text-xs"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          type="button"
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {isPending ? "Connecting…" : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
