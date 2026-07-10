/**
 * Stable JSON with recursively sorted object keys so a value serializes
 * identically regardless of key insertion order. Array order is preserved
 * (order can be meaningful). Deliberately dependency-free + isomorphic so the
 * exact same bytes are produced in the browser and on the server — signing
 * flows recover the signer from a message rebuilt server-side, and any drift
 * would break recovery.
 *
 * Shared by the tournament-metadata and profile signing flows.
 *
 * @example
 * canonicalJson({ b: 1, a: 2 }); // '{"a":2,"b":1}'
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
