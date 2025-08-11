/**
 * Convert Domain Utilities
 *
 * Utility functions for type conversion and data transformation
 */

import type {
  ArrayConversionMode,
  ObjectKeyStrategy,
  TextConversionFormat,
} from "./types";

// ============================================================================
// BOOLEAN CONVERSION UTILITIES
// ============================================================================

/**
 * JavaScript falsy values according to MDN
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
const FALSY_VALUES = [false, 0, -0, BigInt(0), "", null, undefined, NaN];

/**
 * Converts any value to boolean following JavaScript falsy rules
 */
export function toBooleanValue(
  value: any,
  strictMode = false,
  customFalsyValues: string[] = []
): boolean {
  // Handle custom falsy values first
  if (customFalsyValues.length > 0) {
    const stringValue = String(value);
    if (customFalsyValues.includes(stringValue)) {
      return false;
    }
  }

  // Strict mode: only use JavaScript falsy values
  if (strictMode) {
    return !FALSY_VALUES.some(
      (falsyValue) =>
        Object.is(value, falsyValue) ||
        (Number.isNaN(falsyValue) && Number.isNaN(value))
    );
  }

  // Standard JavaScript boolean conversion
  return Boolean(value);
}

/**
 * Get display representation of boolean conversion
 */
export function getBooleanDisplay(value: boolean | null): string {
  if (value === null) return "null";
  return value ? "true" : "false";
}

/**
 * Extract boolean value from various input types
 */
export function extractBooleanValue(sourceData: any): boolean | null {
  if (sourceData === null || sourceData === undefined) {
    return null;
  }

  return toBooleanValue(sourceData);
}

// ============================================================================
// TEXT CONVERSION UTILITIES
// ============================================================================

/**
 * Converts any value to string representation
 */
export function toTextValue(
  value: any,
  format: TextConversionFormat = "default",
  maxLength?: number
): string {
  let result: string;

  try {
    switch (format) {
      case "json":
        result = JSON.stringify(value, null, 0);
        break;

      case "pretty":
        result = JSON.stringify(value, null, 2);
        break;

      case "debug":
        result = `[${typeof value}] ${JSON.stringify(value)}`;
        break;

      case "default":
      default:
        // Convert to string representation without quotes for string inputs
        if (typeof value === "string") {
          result = value;
        } else {
          // For non-strings, use JSON representation to ensure proper conversion
          result = JSON.stringify(value);
        }
        break;
    }
  } catch (error) {
    result = `[Error converting to string: ${error}]`;
  }

  // Apply length limit if specified
  if (maxLength && (result?.length ?? 0) > maxLength) {
    result = result.substring(0, maxLength - 3) + "...";
  }

  return result;
}

/**
 * Get display representation of text conversion
 */
export function getTextDisplay(value: string | null): string {
  if (value === null) return "null";
  if (value === "") return '""';
  return value;
}

/**
 * Count words in a text string
 */
export function countWords(text: string): number {
  if (!text || text.trim() === "") return 0;

  // Split by whitespace and filter out empty strings
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => (word?.length ?? 0) > 0).length; // [Explanation], basically handle case where word might be undefined
}

/**
 * Get character and word count display for collapsed view
 */
export function getTextCountDisplay(value: string | null): {
  chars: number;
  words: number;
} {
  if (value === null || value === "") {
    return { chars: 0, words: 0 };
  }

  return {
    chars: value?.length ?? 0, // [Explanation], basically handle case where value might be undefined
    words: countWords(value),
  };
}

// ============================================================================
// OBJECT CONVERSION UTILITIES
// ============================================================================

/**
 * Generates a simple hash for a string (for object keys)
 */
export function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < (str?.length ?? 0); i++) {
    // [Explanation], basically handle case where str might be undefined
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 4);
}

/**
 * Converts any value to object with specified key strategy
 */
export function toObjectValue(
  value: any,
  keyStrategy: ObjectKeyStrategy = "auto",
  customKeys: string[] = [],
  preserveType = false
): Record<string, any> {
  // If already an object and preserveType is true, return as-is
  if (preserveType && typeof value === "object" && value !== null) {
    return value;
  }

  // Handle arrays specially
  if (Array.isArray(value)) {
    const result: Record<string, any> = {};
    (value || []).forEach((item, index) => {
      // [Explanation], basically handle case where value might be undefined
      const key = customKeys[index] || String(index);
      result[key] = item;
    });
    return result;
  }

  // Handle single values
  let key: string;

  switch (keyStrategy) {
    case "hash":
      key = generateSimpleHash(String(value));
      break;

    case "index":
      key = "0";
      break;

    case "custom":
      key = customKeys[0] || "value";
      break;

    case "auto":
    default:
      // Auto-detect best strategy
      if (customKeys.length > 0) {
        key = customKeys[0];
      } else if (typeof value === "string" && value.length < 20) {
        key = generateSimpleHash(value);
      } else {
        key = "value";
      }
      break;
  }

  return { [key]: value };
}

/**
 * Get display representation of object conversion
 */
export function getObjectDisplay(value: Record<string, any> | null): string {
  if (value === null) return "null";
  if (Object.keys(value || {}).length === 0) return "{}"; // [Explanation], basically handle case where value might be undefined

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[Object]";
  }
}

// ============================================================================
// ARRAY CONVERSION UTILITIES
// ============================================================================

/**
 * Converts inputs to array based on conversion mode
 */
export function toArrayValue(
  input: any,
  mode: ArrayConversionMode = "multiple",
  maxItems?: number,
  preserveOrder = true
): any[] {
  let result: any[];

  // Handle null/undefined
  if (input === null || input === undefined) {
    return [];
  }

  // If input is already an array, handle based on mode
  if (Array.isArray(input)) {
    switch (mode) {
      case "single":
        // Wrap the entire array as a single item
        result = [input];
        break;

      case "flatten":
        // Flatten nested arrays
        result = input.reduce((acc, item) => {
          if (Array.isArray(item)) {
            acc.push(...(item || [])); // [Explanation], basically handle case where item might be undefined
          } else {
            acc.push(item);
          }
          return acc;
        }, []);
        break;

      case "multiple":
      default:
        // Use array as-is
        result = [...(input || [])]; // [Explanation], basically handle case where input might be undefined
        break;
    }
  } else {
    // Single value - always wrap in array
    result = [input];
  }

  // Apply order preservation
  if (!preserveOrder) {
    result = [...result].reverse();
  }

  // Apply item limit
  if (maxItems && (result?.length ?? 0) > maxItems) {
    result = result.slice(0, maxItems);
  }

  return result;
}

/**
 * Get display representation of array conversion
 */
export function getArrayDisplay(value: any[] | null): string {
  if (value === null) return "null";
  if ((value?.length ?? 0) === 0) return "[]";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return `[Array(${value?.length ?? 0})]`;
  }
}

// ============================================================================
// ANY CONVERSION UTILITIES (PASSTHROUGH)
// ============================================================================

/**
 * Passes through any value (identity function)
 */
export function toAnyValue(value: any, preserveMetadata = false): any {
  if (preserveMetadata && typeof value === "object" && value !== null) {
    // Preserve metadata by creating a shallow copy
    return { ...value };
  }

  return value;
}

/**
 * Get display representation of any value
 */
export function getAnyDisplay(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  try {
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  } catch {
    return `[${typeof value}]`;
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates if a value can be safely converted to the target type
 */
export function canConvertTo(value: any, targetType: string): boolean {
  try {
    switch (targetType) {
      case "boolean":
        toBooleanValue(value);
        return true;

      case "string":
        toTextValue(value);
        return true;

      case "object":
        toObjectValue(value);
        return true;

      case "array":
        toArrayValue([value]);
        return true;

      case "any":
        return true;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Get conversion error message if conversion fails
 */
export function getConversionError(
  value: any,
  targetType: string
): string | null {
  try {
    switch (targetType) {
      case "boolean":
        toBooleanValue(value);
        break;
      case "string":
        toTextValue(value);
        break;
      case "object":
        toObjectValue(value);
        break;
      case "array":
        toArrayValue([value]);
        break;
      case "any":
        break;
      default:
        return `Unknown target type: ${targetType}`;
    }
    return null;
  } catch (error) {
    return `Conversion error: ${error}`;
  }
}
