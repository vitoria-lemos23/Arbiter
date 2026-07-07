import { describe, expect, it } from "vitest";
import { toInt } from "./searchParams";

describe("toInt", () => {
  it("parses a numeric string", () => {
    expect(toInt("3", 1)).toBe(3);
  });

  it("takes the first value of an array", () => {
    expect(toInt(["7", "9"], 1)).toBe(7);
  });

  it("falls back when absent or non-numeric", () => {
    expect(toInt(undefined, 1)).toBe(1);
    expect(toInt("abc", 1)).toBe(1);
    expect(toInt([], 5)).toBe(5);
  });
});
