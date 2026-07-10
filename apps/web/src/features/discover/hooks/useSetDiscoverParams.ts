"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type ParamValue = string | string[] | null;

/**
 * Client controller helper: writes filter/search/sort changes into the URL so
 * the Server Component re-queries (spec 010). Uses `router.replace` (no history
 * spam) and preserves unrelated params. Any filter change resets `?show` to the
 * first page, since a narrower result set invalidates the prior offset; pass
 * `resetShow: false` to keep it (e.g. the sort dropdown).
 */
export function useSetDiscoverParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (next: Record<string, ParamValue>, opts?: { resetShow?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        params.delete(key);
        if (value == null || value === "") continue;
        if (Array.isArray(value)) {
          for (const entry of value) params.append(key, entry);
        } else {
          params.set(key, value);
        }
      }
      if (opts?.resetShow !== false) params.delete("show");
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );
}
