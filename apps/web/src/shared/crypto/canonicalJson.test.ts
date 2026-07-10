import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonicalJson";

describe("canonicalJson", () => {
  it("is independent of key insertion order", () => {
    const a = canonicalJson({ name: "x", game: "y" });
    const b = canonicalJson({ game: "y", name: "x" });
    expect(a).toBe(b);
  });

  it("recursively sorts nested object keys", () => {
    const a = canonicalJson({ z: { b: 1, a: 2 }, a: 0 });
    const b = canonicalJson({ a: 0, z: { a: 2, b: 1 } });
    expect(a).toBe(b);
  });

  it("preserves array order", () => {
    expect(canonicalJson(["b", "a"])).not.toBe(canonicalJson(["a", "b"]));
  });

  it("handles primitives", () => {
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson("hi")).toBe('"hi"');
    expect(canonicalJson(null)).toBe("null");
  });
});
