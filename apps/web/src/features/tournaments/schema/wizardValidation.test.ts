import { describe, expect, it } from "vitest";
import { firstStepWithError } from "./createTournament";

describe("firstStepWithError", () => {
  it("returns -1 when no field carries an error", () => {
    expect(firstStepWithError({})).toBe(-1);
  });

  it("points at the earliest step carrying an error", () => {
    // `name` is a step-0 field, `startDate` a step-1 field: step 0 wins.
    expect(firstStepWithError({ name: {}, startDate: {} })).toBe(0);
  });

  it("skips steps whose fields are all valid", () => {
    // Only the schedule (step 1) is broken.
    expect(firstStepWithError({ startDate: { message: "Required" } })).toBe(1);
  });

  it("ignores unknown field names not owned by any step", () => {
    expect(firstStepWithError({ notAField: {} })).toBe(-1);
  });
});
