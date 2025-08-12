"use client";
/**
 * Route: hooks/useRecoverLocalStorageOnTimeout.ts
 * LOADING TIMEOUT RECOVERY HOOK - Clears broken localStorage after long loading
 *
 * • Starts a timer while a loading condition is active
 * • Performs a soft reset of localStorage preserving auth/session tokens
 * • Optionally reloads the page to recover from corrupt cached state
 * • Safe on SSR (no-ops when window is undefined)
 *
 * Keywords: recovery, localStorage, loading-timeout, resilience, auth-preservation
 */

import { useEffect, useRef } from "react";

/** Preserved keys that must not be cleared, basically protect auth/session */
const PRESERVED_KEYS: readonly string[] = [
  "__convexAuthJWT_httpsveraciousparakeet120convexcloud",
  "__convexAuthRefreshToken_httpsveraciousparakeet120convexcloud",
  "agenitix_auth_token",
];

export interface RecoverLocalStorageOptions {
  /** When true, the timeout is active; when false, timer is cancelled */
  isActive: boolean;
  /** Milliseconds to wait before triggering recovery */
  timeoutMs?: number;
  /** Additional keys to preserve across clear */
  preservedKeys?: string[];
  /** Whether to reload after recovery */
  reloadAfterRecover?: boolean;
  /** Optional callback executed right after recovery but before reload */
  onRecovered?: () => void;
}

/**
 * Execute a soft reset on localStorage preserving important keys.
 * [Explanation], basically clear storage but keep auth tokens
 */
function performSoftLocalStorageReset(preservedKeys: readonly string[]) {
  if (typeof window === "undefined") return; // SSR guard

  // Capture preserved values first, basically save important data
  const preserved: Record<string, string> = {};
  preservedKeys.forEach((key) => {
    const value = window.localStorage.getItem(key);
    if (value !== null) preserved[key] = value;
  });

  // Clear all storage, basically remove corrupt entries
  window.localStorage.clear();

  // Restore preserved values, basically keep auth/session intact
  Object.entries(preserved).forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
}

/**
 * React hook that triggers a safe localStorage recovery when loading stalls.
 * [Explanation], basically start a timer and clear storage if spinner never resolves
 */
export function useRecoverLocalStorageOnTimeout({
  isActive,
  timeoutMs = 8000,
  preservedKeys = [],
  reloadAfterRecover = true,
  onRecovered,
}: RecoverLocalStorageOptions) {
  const hasRecoveredRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard

    // Cancel any existing timer when condition is not active
    if (!isActive) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Do not schedule again after we have recovered once
    if (hasRecoveredRef.current) return;

    // Start timeout to recover if loading takes too long
    timerRef.current = window.setTimeout(() => {
      if (hasRecoveredRef.current) return;

      // Merge preserved keys with defaults, basically combine caller + required
      const mergedPreserved = Array.from(
        new Set<string>([...PRESERVED_KEYS, ...preservedKeys])
      );

      performSoftLocalStorageReset(mergedPreserved);

      hasRecoveredRef.current = true;

      // Allow caller to run side effects before reload
      onRecovered?.();

      if (reloadAfterRecover) {
        window.location.reload();
      }
    }, Math.max(1000, timeoutMs));

    // Cleanup on unmount or when condition flips
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, timeoutMs, reloadAfterRecover, onRecovered, preservedKeys]);
}


