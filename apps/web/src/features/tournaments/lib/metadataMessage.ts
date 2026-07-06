import type { TournamentMetadataDoc } from "@arbiter/db";

/**
 * Builds the canonical `personal_sign` message that gates a metadata write. The
 * organizer signs it client-side (wagmi `useSignMessage`); the server recovers
 * the signer from it (viem `recoverMessageAddress`). Both sides MUST produce a
 * byte-for-byte identical string, so this helper is the single source of truth
 * and is deliberately dependency-free + isomorphic (Web Crypto, no Node APIs).
 *
 * @example
 * const message = await buildMetadataMessage(address, metadata);
 * const signature = await signMessageAsync({ message });
 */

/** Fixed first line; kept as one literal so client and server never drift. */
const MESSAGE_HEADER = "Arbiter — save tournament metadata";

/**
 * Stable JSON with recursively sorted object keys so a doc hashes identically
 * regardless of key insertion order. Array order is preserved (tag order is
 * meaningful and already de-duplicated upstream).
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(obj)
        .sort()
        .map((key) => [key, sortKeys(obj[key])]),
    );
  }
  return value;
}

/** Lowercase hex sha-256 of a UTF-8 string via Web Crypto (browser + node). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * The canonical signed message:
 *
 *   Arbiter — save tournament metadata
 *   address: <lowercased tournament address>
 *   hash: <sha-256 hex of canonical-JSON(metadata)>
 */
export async function buildMetadataMessage(
  address: `0x${string}`,
  metadata: TournamentMetadataDoc,
): Promise<string> {
  const hash = await sha256Hex(canonicalJson(metadata));
  return `${MESSAGE_HEADER}\naddress: ${address.toLowerCase()}\nhash: ${hash}`;
}
