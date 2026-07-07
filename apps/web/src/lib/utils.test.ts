import { describe, expect, it } from "vitest";
import { clamp, cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("lets later Tailwind classes win on conflict", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy conditional values", () => {
    expect(cn("a", false, undefined, null, "c")).toBe("a c");
  });
});

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it("clamps below the minimum and above the maximum", () => {
    expect(clamp(-3, 1, 10)).toBe(1);
    expect(clamp(42, 1, 10)).toBe(10);
  });
});
