import { parseEther } from "viem";
import { describe, expect, it } from "vitest";
import {
  hasActiveFilters,
  LIST_STEP,
  MAX_SHOW,
  parseDiscoverQuery,
} from "./discoverQuery";

describe("parseDiscoverQuery", () => {
  it("applies defaults for an empty query", () => {
    const query = parseDiscoverQuery({});
    expect(query).toEqual({
      q: "",
      status: [],
      game: null,
      format: [],
      minPrizeWei: null,
      maxPrizeWei: null,
      sort: "soon",
      show: LIST_STEP,
    });
  });

  it("trims the search text", () => {
    expect(parseDiscoverQuery({ q: "  smash  " }).q).toBe("smash");
  });

  it("reads statuses from a CSV string", () => {
    expect(parseDiscoverQuery({ status: "live,finished" }).status).toEqual([
      "live",
      "finished",
    ]);
  });

  it("reads statuses from a repeated array param", () => {
    expect(parseDiscoverQuery({ status: ["open", "live"] }).status).toEqual([
      "open",
      "live",
    ]);
  });

  it("returns statuses in canonical order and drops invalid values", () => {
    expect(
      parseDiscoverQuery({ status: ["finished", "bogus", "open"] }).status,
    ).toEqual(["open", "finished"]);
  });

  it("keeps only known format enum indexes", () => {
    expect(parseDiscoverQuery({ format: "0,9,0" }).format).toEqual([0]);
  });

  it("converts prize bounds from ETH to wei", () => {
    const query = parseDiscoverQuery({ minPrize: "0.5", maxPrize: "2" });
    expect(query.minPrizeWei).toBe(parseEther("0.5").toString());
    expect(query.maxPrizeWei).toBe(parseEther("2").toString());
  });

  it("ignores an unparseable prize bound", () => {
    expect(parseDiscoverQuery({ minPrize: "abc" }).minPrizeWei).toBeNull();
  });

  it("falls back to the default sort for an invalid value", () => {
    expect(parseDiscoverQuery({ sort: "nonsense" }).sort).toBe("soon");
  });

  it("clamps show to the [LIST_STEP, MAX_SHOW] range", () => {
    expect(parseDiscoverQuery({ show: "1" }).show).toBe(LIST_STEP);
    expect(parseDiscoverQuery({ show: "9999" }).show).toBe(MAX_SHOW);
  });
});

describe("hasActiveFilters", () => {
  it("is false for a default query", () => {
    expect(hasActiveFilters(parseDiscoverQuery({}))).toBe(false);
  });

  it("ignores sort and show", () => {
    expect(
      hasActiveFilters(parseDiscoverQuery({ sort: "newest", show: "30" })),
    ).toBe(false);
  });

  it("is true when a search or facet is set", () => {
    expect(hasActiveFilters(parseDiscoverQuery({ q: "cup" }))).toBe(true);
    expect(hasActiveFilters(parseDiscoverQuery({ status: "live" }))).toBe(true);
    expect(hasActiveFilters(parseDiscoverQuery({ game: "Chess" }))).toBe(true);
  });
});
