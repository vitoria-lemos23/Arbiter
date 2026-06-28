import { describe, expect, it } from "vitest";
import { cn } from "./utils";

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
