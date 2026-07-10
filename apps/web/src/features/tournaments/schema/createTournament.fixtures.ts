import { INITIAL_WIZARD_VALUES, type WizardValues } from "./createTournament";

/**
 * `<input type="datetime-local">` yields a LOCAL wall-clock string with no
 * timezone, and the schema parses it as local time. Build fixtures the same way
 * (local getters, not `toISOString()`), or tests flip in non-UTC zones.
 *
 * @example localDatetime(3_600_000) // one hour from now, e.g. "2026-07-03T12:30"
 */
export function localDatetime(offsetMs: number): string {
  const d = new Date(Date.now() + offsetMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A far-future, fully valid wizard state that cases override per assertion. */
export function validWizardValues(
  overrides: Partial<WizardValues> = {},
): WizardValues {
  return {
    ...INITIAL_WIZARD_VALUES,
    name: "Spring Cup",
    startDate: localDatetime(3_600_000),
    endDate: localDatetime(7_200_000),
    prize: "1.5",
    // A non-empty, odd-sized panel is required on-chain (#007); the baseline
    // carries a single judge so cases that don't touch judges stay valid.
    judges: `0x${"a".repeat(40)}`,
    ...overrides,
  };
}
