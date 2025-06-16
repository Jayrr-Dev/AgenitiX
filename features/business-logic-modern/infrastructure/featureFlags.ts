/**
 * FEATURE FLAG HELPER - read flags from localStorage & env, fallback false.
 */

const LS_KEY = "agenitix.flags";

export const isFlagEnabled = (flag: string): boolean => {
  // 1. process.env override (vite / nextjs) e.g. VITE_FLAG_MYFEATURE="1"
  if (
    typeof process !== "undefined" &&
    process.env[`FLAG_${flag.toUpperCase()}`]
  ) {
    return process.env[`FLAG_${flag.toUpperCase()}`] === "1";
  }
  // 2. localStorage (dev toggles)
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        return !!obj[flag];
      } catch {
        /* ignore */
      }
    }
  }
  return false;
};

export const setLocalFlag = (flag: string, value: boolean) => {
  if (typeof window === "undefined") return;
  let obj: Record<string, boolean> = {};
  try {
    obj = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {}
  obj[flag] = value;
  localStorage.setItem(LS_KEY, JSON.stringify(obj));
};
