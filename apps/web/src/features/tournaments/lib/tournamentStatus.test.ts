import { describe, expect, it } from "vitest";
import {
  deriveTournamentStatus,
  TOURNAMENT_STATUS_LABEL,
} from "./tournamentStatus";

const START = new Date("2026-07-10T00:00:00Z");
const END = new Date("2026-07-20T00:00:00Z");

describe("deriveTournamentStatus", () => {
  it("is 'soon' before the start date", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    expect(deriveTournamentStatus(START, END, now)).toBe("soon");
  });

  it("is 'live' between start and end (inclusive of the boundaries)", () => {
    const between = new Date("2026-07-15T00:00:00Z");
    expect(deriveTournamentStatus(START, END, between)).toBe("live");
    expect(deriveTournamentStatus(START, END, START)).toBe("live");
    expect(deriveTournamentStatus(START, END, END)).toBe("live");
  });

  it("is 'finished' after the end date", () => {
    const now = new Date("2026-07-25T00:00:00Z");
    expect(deriveTournamentStatus(START, END, now)).toBe("finished");
  });

  it("uses the design's badge wording", () => {
    expect(TOURNAMENT_STATUS_LABEL).toEqual({
      soon: "Soon",
      live: "LIVE",
      finished: "Finished",
    });
  });
});
