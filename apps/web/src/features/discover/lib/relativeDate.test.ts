import { describe, expect, it } from "vitest";
import { relativeDate } from "./relativeDate";

const NOW = new Date("2026-07-10T12:00:00Z");

describe("relativeDate", () => {
  it("labels a near-future date in days", () => {
    expect(relativeDate(new Date("2026-07-13T12:00:00Z"), NOW)).toBe(
      "in 3 days",
    );
  });

  it("labels a past date in days", () => {
    expect(relativeDate(new Date("2026-07-08T12:00:00Z"), NOW)).toBe(
      "2 days ago",
    );
  });

  it("uses coarser units for distant dates", () => {
    expect(relativeDate(new Date("2026-09-10T12:00:00Z"), NOW)).toBe(
      "in 2 months",
    );
  });

  it("labels today as a same-unit value", () => {
    expect(relativeDate(new Date("2026-07-10T12:00:30Z"), NOW)).toBe(
      "in 30 seconds",
    );
  });
});
