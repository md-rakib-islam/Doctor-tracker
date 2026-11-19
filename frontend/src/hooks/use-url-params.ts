"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Patch = Record<string, string | number | undefined | null>;

/**
 * Keeps list state (search, filters, page) in the URL: shareable, refresh-safe, back-button friendly.
 * Changing any filter resets `page` to 1 unless the patch itself sets `page`.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);
  const getNumber = useCallback(
    (key: string, fallback: number) => {
      const n = Number(searchParams.get(key));
      return Number.isInteger(n) && n > 0 ? n : fallback;
    },
    [searchParams],
  );

  const set = useCallback(
    (patch: Patch) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === null || v === "") sp.delete(k);
        else sp.set(k, String(v));
      }
      if (!("page" in patch)) sp.delete("page");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [router, pathname]);

  return useMemo(() => ({ get, getNumber, set, reset }), [get, getNumber, set, reset]);
}
