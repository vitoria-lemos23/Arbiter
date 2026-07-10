import { describe, expect, it } from "vitest";
import { loadMoreHref, serializeParams } from "./discoverHref";

describe("serializeParams", () => {
  it("skips undefined values", () => {
    expect(serializeParams({ q: undefined, sort: "newest" }).toString()).toBe(
      "sort=newest",
    );
  });

  it("appends every entry of a repeated param", () => {
    expect(serializeParams({ status: ["open", "live"] }).toString()).toBe(
      "status=open&status=live",
    );
  });
});

describe("loadMoreHref", () => {
  it("sets show while preserving other params", () => {
    expect(loadMoreHref({ q: "cup", sort: "newest" }, 12)).toBe(
      "/discover?q=cup&sort=newest&show=12",
    );
  });

  it("replaces an existing show value", () => {
    expect(loadMoreHref({ show: "6" }, 12)).toBe("/discover?show=12");
  });
});
