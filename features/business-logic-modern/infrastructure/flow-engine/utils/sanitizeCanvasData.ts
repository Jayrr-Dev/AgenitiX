/**
 * SANITIZE CANVAS DATA - Remove transient/heavy fields before persisting
 *
 * • Strips runtime fields like outputs/inputs/raw bodies that bloat storage
 * • Limits nesting depth and truncates very long strings
 * • Safe for client and server usage (pure functions)
 *
 * Keywords: sanitize, persist, convex, depth-limit, prune, canvas
 */

// -----------------------------------------------------------------------------
// Configuration constants
// -----------------------------------------------------------------------------

/** [Explanation], basically maximum depth to preserve when saving */
export const MAX_NESTING_DEPTH = 8 as const;

/** [Explanation], basically cap extremely long strings */
export const MAX_STRING_LENGTH = 4000 as const;

/** [Explanation], basically cap extremely long arrays */
export const MAX_ARRAY_ITEMS = 200 as const;

/** [Explanation], basically drop keys that are transient or huge */
export const STRIP_KEYS = new Set<string>([
  // Common runtime/transient fields
  "output",
  "outputs",
  "inputs",
  "inputData",
  "json",
  "data",
  "payload",
  "result",
  "response",
  // Email-heavy fields
  "raw",
  "html",
  "text",
  "headers",
  "body",
  "preview",
  "attachments",
  "thread",
  "messages",
  "emails",
]);

// -----------------------------------------------------------------------------
// Types (minimal, avoid importing React Flow types on server)
// -----------------------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface MinimalNodeLike {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
  // Allow passthrough of other node props without forcing types
  [key: string]: unknown;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…`;
}

function sanitizeValue(value: unknown, depth: number): Json {
  if (value === null || value === undefined) return null;
  if (depth >= MAX_NESTING_DEPTH) return "[pruned]";

  const type = typeof value;
  if (type === "string") return truncateString(value as string);
  if (type === "number" || type === "boolean") return value as Json;

  if (Array.isArray(value)) {
    const arr = value as unknown[];
    const limited = arr.slice(0, MAX_ARRAY_ITEMS);
    const sanitized = limited.map((v) => sanitizeValue(v, depth + 1));
    return sanitized as Json;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, Json> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (STRIP_KEYS.has(k)) continue;
      result[k] = sanitizeValue(v, depth + 1);
    }
    return result as Json;
  }

  // Fallback
  try {
    return JSON.parse(JSON.stringify(value)) as Json;
  } catch {
    return "[unserializable]";
  }
}

/**
 * Sanitize a single node's `data` payload
 */
export function sanitizeNodeData(data: Record<string, unknown> | undefined): Record<string, Json> | undefined {
  if (!data || typeof data !== "object") return undefined;
  // Ensure we keep key UI flags even if empty
  const preserved: Record<string, Json> = {};
  for (const key of ["isExpanded", "isEnabled", "isActive", "label", "store", "expandedSize", "collapsedSize", "viewPath", "summaryLimit"]) {
    if (key in data) preserved[key] = sanitizeValue((data as any)[key], 0);
  }

  // Merge with sanitized rest while stripping heavy keys
  const sanitizedRest = sanitizeValue(data, 0);
  return { ...(sanitizedRest as Record<string, Json>), ...preserved };
}

/**
 * Sanitize nodes array before sending to Convex
 */
export function sanitizeNodesForSave(nodes: MinimalNodeLike[]): MinimalNodeLike[] {
  return nodes.map((n) => ({
    ...n,
    data: sanitizeNodeData(n.data),
  }));
}


