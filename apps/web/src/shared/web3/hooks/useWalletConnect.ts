"use client";

import {
  useBalance,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
} from "wagmi";

/** Exposes wallet connection state, native balance, and connect/disconnect actions. */
export function useWalletConnect() {
  const { address, isConnected } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  // Auto-disabled by wagmi while `address` is undefined, so no gas/reads run
  // until a wallet is actually connected.
  const { data: balance } = useBalance({ address });

  return {
    address,
    isConnected,
    connect,
    connectors,
    disconnect,
    isPending,
    balance,
  };
}
