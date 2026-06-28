import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { env } from "@/env";

/**
 * wagmi configuration shared by the server (for SSR hydration) and the client.
 *
 * `ssr: true` + cookie storage lets the connected-wallet state survive a page
 * load: the layout reads the cookie on the server and passes the resulting
 * `initialState` to `WagmiProvider`, avoiding a hydration mismatch.
 */

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [hardhat.id]: http(env.NEXT_PUBLIC_RPC_URL),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

/** Chain the Counter contract is expected to live on (defaults to local Hardhat). */
export const counterChainId = env.NEXT_PUBLIC_CHAIN_ID;

/** Deployed Counter address, exposed to the browser for wallet-signed writes. */
export const counterAddress = env.NEXT_PUBLIC_COUNTER_ADDRESS;
