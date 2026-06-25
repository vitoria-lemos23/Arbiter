/**
 * Public entry point for consumers of the contracts package (e.g. the web app).
 *
 * Exposes the contract ABIs as `as const` tuples so viem can fully infer
 * argument and return types at the call site. ABIs are kept in sync with the
 * Solidity sources in `contracts/` — regenerate from `artifacts/` after any
 * change to a contract's external interface.
 */

export const counterAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "by", type: "uint256" },
    ],
    name: "Increment",
    type: "event",
  },
  {
    inputs: [],
    name: "inc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "by", type: "uint256" },
    ],
    name: "incBy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "x",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;