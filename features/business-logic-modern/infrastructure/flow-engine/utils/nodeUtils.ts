/**
 * NODE UTILS - General-purpose node utility functions
 *
 * • Safe JSON stringification to prevent circular reference errors
 * • Intelligent value extraction from node data objects
 *
 * Keywords: nodes, utilities, stringify, extract, safe
 */

/**
 * Safely stringifies a value, handling circular references.
 * @param value - The value to stringify.
 * @param space - The indentation space for formatting.
 * @returns A JSON string.
 */
export const safeStringify = (value: any, space: number = 2): string => {
  const cache = new Set();
  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.add(value);
      }
      return value;
    },
    space
  );
};

/**
 * Extracts a primary "value" from a node's data object for display.
 * It intelligently checks for common properties that store output values.
 * @param data - The node's data object.
 * @returns The extracted value, or the stringified object if no primary value is found.
 */
export const extractNodeValue = (data: Record<string, any> | null | undefined): any => {
  if (!data) {
    return null;
  }

  // Prioritize specific, meaningful keys for output
  if (data.output !== undefined) return data.output;
  if (data.value !== undefined) return data.value;
  if (data.text !== undefined) return data.text;
  if (data.result !== undefined) return data.result;
  if (data.payload !== undefined) return data.payload;

  // Fallback for objects with a single key
  const keys = Object.keys(data);
  if (keys.length === 1) {
    return data[keys[0]];
  }

  // If no primary value is found, return the whole data object for inspection
  return data;
}; 