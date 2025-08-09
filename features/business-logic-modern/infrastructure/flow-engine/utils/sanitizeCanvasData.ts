/**
 * SANITIZE CANVAS DATA - Remove transient/heavy fields before persisting
 *
 * • Strips runtime fields like outputs/inputs/raw bodies that bloat storage
 * • Limits nesting depth and truncates very long strings
 * • Optimized to minimize allocations and deep work
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

/** [Explanation], basically keys we always keep from node data */
export const PRESERVE_NODE_KEYS = new Set<string>([
  "isExpanded",
  "isEnabled",
  "isActive",
  "label",
  "store",
  "expandedSize",
  "collapsedSize",
  "viewPath",
  "summaryLimit",
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
  if (type === "bigint") return String(value) as Json; // [Explanation], basically make serializable
  if (type === "symbol" || type === "function") return "[unsupported]";

  if (Array.isArray(value)) {
    // [Explanation], basically fast loop with cap and minimal allocations
    const arr = value as unknown[];
    const length = Math.min(arr.length, MAX_ARRAY_ITEMS);
    const out: Json[] = new Array(length);
    for (let i = 0; i < length; i++) {
      out[i] = sanitizeValue(arr[i], depth + 1);
    }
    return out as Json;
  }

  if (type === "object") {
    // Dates should become ISO strings to be stable and small
    if (value instanceof Date) {
      return (value as Date).toISOString();
    }

    const obj = value as Record<string, unknown>;
    const out: Record<string, Json> = {};
    for (const k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (STRIP_KEYS.has(k)) continue;
      out[k] = sanitizeValue((obj as Record<string, unknown>)[k], depth + 1);
    }
    return out as Json;
  }

  // Fallback
  return "[unserializable]";
}

/**
 * Sanitize a single node's `data` payload
 */
export function sanitizeNodeData(data: Record<string, unknown> | undefined): Record<string, Json> | undefined {
  if (!data || typeof data !== "object") return undefined;
  // [Explanation], basically single-pass sanitize that preserves required keys
  const out: Record<string, Json> = {};
  for (const k in data) {
    if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
    if (STRIP_KEYS.has(k)) continue;
    const value = (data as Record<string, unknown>)[k];
    // Always include preserved keys if present
    if (PRESERVE_NODE_KEYS.has(k)) {
      out[k] = sanitizeValue(value, 0);
      continue;
    }
    out[k] = sanitizeValue(value, 0);
  }
  return out;
}

/**
 * Sanitize nodes array before sending to Convex
 */
export function sanitizeNodesForSave(nodes: MinimalNodeLike[]): MinimalNodeLike[] {
  // [Explanation], basically fast path with for-loop to avoid intermediate arrays
  const result: MinimalNodeLike[] = new Array(nodes.length);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    result[i] = {
      ...n,
      data: sanitizeNodeData(n.data),
    };
  }
  return result;
}


