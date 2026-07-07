import { formatEther } from "viem";
import { TOURNAMENT_FORMATS } from "../schema/createTournament";

/** Presentation helpers shared by the discover card and the details page. */

/** Human label for an on-chain format enum index (falls back to "Unknown"). */
export function formatLabel(format: number): string {
  return TOURNAMENT_FORMATS.find((f) => f.value === format)?.label ?? "Unknown";
}

/** `0x1234...abcd` (horizontal ellipsis) for compact display. */
export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

/** Wei string -> an ether label prefixed with the Xi glyph (e.g. Xi 0.5). */
export function ethLabel(wei: string): string {
  try {
    return `\u039E${formatEther(BigInt(wei))}`;
  } catch {
    return "\u039E0";
  }
}
