import { describe, expect, it } from "vitest";
import {
  deriveRegistrationGate,
  type RegistrationGate,
} from "./registrationGating";

const START = new Date("2026-08-01T12:00:00Z");
const BEFORE = new Date("2026-08-01T11:59:59Z");

/** Named fake for the hook-collected inputs; overrides express one condition. */
class FakeGateInputs {
  isConnected = true;
  chainId: number | undefined = 31337;
  requiredChainId = 31337;
  startDate = START;
  now = BEFORE;
  participantCount: bigint | undefined = BigInt(3);
  maxPlayers = 8;
  alreadyRegistered = false;

  with(overrides: Partial<FakeGateInputs>): FakeGateInputs {
    return Object.assign(new FakeGateInputs(), this, overrides);
  }
}

const base = new FakeGateInputs();

function gate(overrides: Partial<FakeGateInputs> = {}): RegistrationGate {
  return deriveRegistrationGate(base.with(overrides));
}

describe("deriveRegistrationGate", () => {
  it("is open when connected, on-chain, in-window, with room", () => {
    expect(gate()).toBe("open");
  });

  it("closes at exactly startDate (contract boundary: >= reverts)", () => {
    expect(gate({ now: START })).toBe("closed");
    expect(gate({ now: new Date(START.getTime() + 1) })).toBe("closed");
  });

  it("is full once participantCount reaches maxPlayers", () => {
    expect(gate({ participantCount: BigInt(8) })).toBe("full");
    expect(gate({ participantCount: BigInt(7) })).toBe("open");
  });

  it("prompts to connect when no wallet is connected", () => {
    expect(gate({ isConnected: false })).toBe("disconnected");
  });

  it("asks for a network switch on the wrong chain", () => {
    expect(gate({ chainId: 1 })).toBe("wrong-chain");
  });

  it("blocks a second registration from the same address", () => {
    expect(gate({ alreadyRegistered: true })).toBe("already-registered");
  });

  it("prefers tournament-level blocks over wallet-level ones", () => {
    expect(gate({ now: START, isConnected: false })).toBe("closed");
    expect(gate({ participantCount: BigInt(8), isConnected: false })).toBe(
      "full",
    );
    expect(gate({ now: START, chainId: 1 })).toBe("closed");
  });

  it("stays permissive while the on-chain count is still loading", () => {
    expect(gate({ participantCount: undefined })).toBe("open");
  });
});
