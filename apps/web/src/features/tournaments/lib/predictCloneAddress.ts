import { type Address, getContractAddress, type Hex } from "viem";

/**
 * EIP-1167 minimal-proxy creation code for a clone of `implementation` — byte
 * for byte what OpenZeppelin's {Clones.cloneDeterministic} feeds to CREATE2.
 */
export function cloneInitCode(implementation: Address): Hex {
  const impl = implementation.slice(2).toLowerCase();
  // The two hex literals are the fixed EIP-1167 proxy runtime with the 20-byte
  // implementation address spliced in the middle. They are opcodes, not magic:
  //   prefix `3d602d80600a3d3981f3` = the constructor that RETURNs the 45-byte
  //   runtime; `363d3d373d3d3d363d73` + <impl> + `5af43d82803e903d91602b57fd5bf3`
  //   = DELEGATECALL to <impl>, bubbling calldata and return data.
  // See EIP-1167 §"Minimal Proxy Contract"; identical to OZ Clones.
  return `0x3d602d80600a3d3981f3363d3d373d3d3d363d73${impl}5af43d82803e903d91602b57fd5bf3`;
}

/**
 * The CREATE2 address a clone will occupy — a pure function of
 * `(implementation, factory, salt)`. Reproduces the factory's
 * `predictTournamentAddress` view client-side, avoiding a pre-sign RPC read.
 */
export function predictCloneAddress(args: {
  implementation: Address;
  factory: Address;
  salt: Hex;
}): Address {
  return getContractAddress({
    bytecode: cloneInitCode(args.implementation),
    from: args.factory,
    opcode: "CREATE2",
    salt: args.salt,
  });
}
