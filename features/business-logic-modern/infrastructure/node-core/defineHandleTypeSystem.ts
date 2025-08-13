/**
 * Route: features/business-logic-modern/infrastructure/node-core/defineHandleTypeSystem.ts
 * HANDLE TYPE SYSTEM - Pure data + helpers for handle types (no React imports)
 *
 * • Central source for handle type codes and labels
 * • Pure utility functions for parsing and compatibility checks
 * • Decouples UI components from type data to avoid circular imports
 *
 * Keywords: handle-types, type-system, compatibility, pure-utilities
 */

/**
 * Default fallback union list when a handle has no explicit type code
 */
export const DEFAULT_TYPE_FALLBACK = ["any"] as const;

/**
 * Default handle type string when none is provided
 */
export const DEFAULT_HANDLE_TYPE = "any" as const;

/**
 * Parse union types from a pipe-delimited string
 * @param typeStr - e.g., "string|number"
 * @returns Array of trimmed union members
 */
export function parseUnionTypes(typeStr?: string | null): string[] {
  if (!typeStr) {
    return [...DEFAULT_TYPE_FALLBACK];
  }
  return typeStr.split("|").map((t) => t.trim());
}

/**
 * Ultimate type map - maps short codes and full names to token keys and labels
 */
export const ULTIMATE_TYPE_MAP: Record<
  string,
  { tokenKey: string; label: string }
> = {
  s: { tokenKey: "string", label: "Text" },
  n: { tokenKey: "number", label: "number" },
  b: { tokenKey: "boolean", label: "On|Off" },
  j: { tokenKey: "json", label: "JSON" },
  a: { tokenKey: "array", label: "List" },
  x: { tokenKey: "any", label: "any" },
  V: { tokenKey: "vibe", label: "Vibe" },
  t: { tokenKey: "tools", label: "Tools" },
  // Full data type names for direct mapping
  JSON: { tokenKey: "json", label: "JSON" },
  String: { tokenKey: "string", label: "Text" },
  Boolean: { tokenKey: "boolean", label: "On|Off" },
  Number: { tokenKey: "number", label: "number" },
  Array: { tokenKey: "array", label: "List" },
  Object: { tokenKey: "object", label: "Object" },
  Tools: { tokenKey: "tools", label: "Tools" },
  // Email-specific data types
  emailAccount: { tokenKey: "email", label: "Email" },
  emailTemplate: { tokenKey: "email", label: "Template" },
  composedEmail: { tokenKey: "email", label: "Email" },
};

/**
 * Type descriptions for concise tooltips per type
 */
export const TYPE_DESCRIPTIONS: Record<string, string> = {
  s: "String - Text and string values",
  n: "Number - Integer and numeric values",
  b: "Boolean - True/false values",
  j: "JSON - JavaScript objects and JSON data",
  a: "Array - Lists and array structures",
  x: "Any - Accepts all data types",
  V: "Vibe - Custom Vibe data type",
  t: "Tools - AI agent tool configurations",
  // Full data type names
  String: "String - Text and string values",
  Boolean: "Boolean - True/false values",
  Number: "Number - Integer and numeric values",
  JSON: "JSON - JavaScript objects and JSON data",
  Array: "Array - Lists and array structures",
  Object: "Object - JavaScript objects and data structures",
  Tools: "Tools - AI agent tool configurations",
  // Email-specific data types
  emailAccount: "Email Account - Email service configuration and credentials",
  emailTemplate: "Email Template - Reusable email template with variables",
  composedEmail: "Composed Email - Ready-to-send email message",
};

/**
 * Check compatibility between two union-capable type codes
 * @param sourceType - e.g., "s|n"
 * @param targetType - e.g., "string"
 */
export function isTypeCompatible(
  sourceType: string,
  targetType: string
): boolean {
  if (sourceType === "any" || targetType === "any") {
    return true;
  }
  const sourceTypes = parseUnionTypes(sourceType);
  const targetTypes = parseUnionTypes(targetType);
  return sourceTypes.some((s) => targetTypes.includes(s));
}
