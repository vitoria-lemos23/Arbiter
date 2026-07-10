import { describe, expect, it } from "vitest";
import { isMajority, majorityThreshold } from "./voteProgress";

describe("majorityThreshold", () => {
  it("is floor(J/2)+1 for odd panels", () => {
    expect(majorityThreshold(1)).toBe(1);
    expect(majorityThreshold(3)).toBe(2);
    expect(majorityThreshold(5)).toBe(3);
    expect(majorityThreshold(7)).toBe(4);
  });

  it("guards a non-positive panel", () => {
    expect(majorityThreshold(0)).toBe(0);
  });
});

describe("isMajority", () => {
  it("needs a strict majority to resolve", () => {
    expect(isMajority(1, 3)).toBe(false);
    expect(isMajority(2, 3)).toBe(true);
    expect(isMajority(2, 5)).toBe(false);
    expect(isMajority(3, 5)).toBe(true);
    expect(isMajority(1, 1)).toBe(true);
  });
});
