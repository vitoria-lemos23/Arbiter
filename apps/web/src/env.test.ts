import { describe, expect, it } from "vitest";
import { envSchema } from "./env";

describe("envSchema", () => {
  it("applies defaults when values are absent", () => {
    const env = envSchema.parse({});
    expect(env.NEXT_PUBLIC_RPC_URL).toBe("http://127.0.0.1:8545");
    expect(env.NEXT_PUBLIC_CHAIN_ID).toBe(31337);
    expect(env.NEXT_PUBLIC_COUNTER_ADDRESS).toBeUndefined();
  });

  it("coerces the chain id to a number", () => {
    const env = envSchema.parse({ NEXT_PUBLIC_CHAIN_ID: "11155111" });
    expect(env.NEXT_PUBLIC_CHAIN_ID).toBe(11155111);
  });

  it("accepts a valid 0x address", () => {
    const address = `0x${"a".repeat(40)}`;
    const env = envSchema.parse({ NEXT_PUBLIC_COUNTER_ADDRESS: address });
    expect(env.NEXT_PUBLIC_COUNTER_ADDRESS).toBe(address);
  });

  it("rejects a malformed address", () => {
    expect(() =>
      envSchema.parse({ NEXT_PUBLIC_COUNTER_ADDRESS: "0xnope" }),
    ).toThrow();
  });

  it("rejects a non-url rpc endpoint", () => {
    expect(() =>
      envSchema.parse({ NEXT_PUBLIC_RPC_URL: "not-a-url" }),
    ).toThrow();
  });
});
