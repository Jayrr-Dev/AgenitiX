/**
 * DEFERRED JSON PARSING HOOK - Avoid blocking main thread with large JSON
 *
 * Use this for parsing large JSON strings that could block interactions
 */

import { useDeferredValue, useMemo } from "react";

export function useDeferredJsonParse<T = unknown>(
  jsonString: string | null
): T | null {
  const deferredString = useDeferredValue(jsonString);

  return useMemo(() => {
    if (!deferredString || typeof deferredString !== "string") return null;

    try {
      return JSON.parse(deferredString) as T;
    } catch {
      return null;
    }
  }, [deferredString]);
}

export function useDeferredJsonStringify(value: unknown): string {
  const deferredValue = useDeferredValue(value);

  return useMemo(() => {
    if (deferredValue === null || deferredValue === undefined) return "";

    try {
      return JSON.stringify(deferredValue, null, 2);
    } catch {
      return String(deferredValue);
    }
  }, [deferredValue]);
}
