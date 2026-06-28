"use client";

import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";

/** Exposes wallet connection state and connect/disconnect actions. */
export function useWalletConnect() {
  const { address, isConnected } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();

  return { address, isConnected, connect, connectors, disconnect, isPending };
}
