import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * wagmi configuration shared by the server (for SSR hydration) and the client.
 *
 * `ssr: true` + cookie storage lets the connected-wallet state survive a page
 * load: the layout reads the cookie on the server and passes the resulting
 * `initialState` to `WagmiProvider`, avoiding a hydration mismatch.
 */

const localRpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [hardhat.id]: http(localRpcUrl),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

/** Chain the Counter contract is expected to live on (defaults to local Hardhat). */
export const counterChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? hardhat.id);

/** Deployed Counter address, exposed to the browser for wallet-signed writes. */
export const counterAddress = process.env.NEXT_PUBLIC_COUNTER_ADDRESS as
  | `0x${string}`
  | undefined;
