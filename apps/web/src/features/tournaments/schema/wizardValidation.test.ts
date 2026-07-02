import { describe, expect, it } from "vitest";
import {
  collectFieldErrors,
  firstStepWithError,
  INITIAL_WIZARD_VALUES,
  stepFieldErrors,
  type WizardValues,
} from "./createTournament";

// datetime-local yields a LOCAL wall-clock string; build fixtures the same way
// (local getters) so validation doesn't flip in non-UTC zones.
function localDatetime(offsetMs: number): string {
  const d = new Date(Date.now() + offsetMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function validValues(overrides: Partial<WizardValues> = {}): WizardValues {
  return {
    ...INITIAL_WIZARD_VALUES,
    name: "Spring Cup",
    startDate: localDatetime(3_600_000),
    endDate: localDatetime(7_200_000),
    prize: "1.5",
    ...overrides,
  };
}

describe("collectFieldErrors", () => {
  it("returns no errors for a fully valid wizard state", () => {
    expect(collectFieldErrors(validValues())).toEqual({});
  });

  it("flags the missing name (step 1 field)", () => {
    const errors = collectFieldErrors(validValues({ name: "" }));
    expect(errors.name).toBeDefined();
  });

  it("flags an invalid prize amount", () => {
    const errors = collectFieldErrors(validValues({ prize: "-1" }));
    expect(errors.prize).toBeDefined();
  });
});

describe("stepFieldErrors", () => {
  it("scopes errors to the step that owns the field", () => {
    // Missing name (step 0) + missing dates (step 1) at once.
    const errors = collectFieldErrors(
      validValues({ name: "", startDate: "", endDate: "" }),
    );
    expect(Object.keys(stepFieldErrors(0, errors))).toEqual(["name"]);
    expect(Object.keys(stepFieldErrors(1, errors))).toContain("startDate");
    // Step 0 must not leak the date errors that belong to step 1.
    expect(stepFieldErrors(0, errors).startDate).toBeUndefined();
  });
});

describe("firstStepWithError", () => {
  it("returns -1 when the form is valid", () => {
    expect(firstStepWithError(collectFieldErrors(validValues()))).toBe(-1);
  });

  it("points at the earliest step carrying an error", () => {
    // Only the schedule (step 1) is broken.
    const errors = collectFieldErrors(validValues({ startDate: "" }));
    expect(firstStepWithError(errors)).toBe(1);
  });
});
