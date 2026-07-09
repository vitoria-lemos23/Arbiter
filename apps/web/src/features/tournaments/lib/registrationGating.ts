/**
 * Pure derivation of the registration CTA state from wallet + on-chain inputs.
 * Extracted from `useRegisterForTournament` so the gating matrix (spec 005 edge
 * cases) is deterministic and node-testable without mocking wagmi.
 *
 * Precedence: tournament-level blocks (closed/full) win over wallet-level ones
 * (disconnected/wrong chain) — "Registration is closed" is more informative
 * than "Connect wallet" when both hold.
 *
 * @example
 * deriveRegistrationGate({ ... }); // → "open" | "closed" | "full" | ...
 */
export type RegistrationGate =
  | "closed"
  | "full"
  | "disconnected"
  | "wrong-chain"
  | "already-registered"
  | "open";

export function deriveRegistrationGate(input: {
  isConnected: boolean;
  chainId: number | undefined;
  requiredChainId: number;
  startDate: Date;
  now: Date;
  /** On-chain `participantCount` read; undefined while loading. */
  participantCount: bigint | undefined;
  maxPlayers: number;
  /** On-chain `isRegistered(me)` read; false while disconnected/loading. */
  alreadyRegistered: boolean;
}): RegistrationGate {
  // Mirrors the contract: `block.timestamp >= startDate` reverts.
  if (input.now.getTime() >= input.startDate.getTime()) return "closed";
  if (
    input.participantCount !== undefined &&
    input.participantCount >= BigInt(input.maxPlayers)
  ) {
    return "full";
  }
  if (!input.isConnected) return "disconnected";
  if (input.chainId !== input.requiredChainId) return "wrong-chain";
  if (input.alreadyRegistered) return "already-registered";
  return "open";
}
