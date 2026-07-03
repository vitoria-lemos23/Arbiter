/**
 * Public entry point for consumers of the contracts package (e.g. the web app).
 *
 * ABIs are exported as `as const` tuples so viem can fully infer argument and
 * return types at the call site. The ABI modules under `generated/` are
 * produced from the compiled Hardhat artifacts by `scripts/generate-abi.mjs`
 * during `build` — never edit them by hand.
 */

export {
  counterAbi,
  tournamentAbi,
  tournamentFactoryAbi,
} from "./generated/abi";
