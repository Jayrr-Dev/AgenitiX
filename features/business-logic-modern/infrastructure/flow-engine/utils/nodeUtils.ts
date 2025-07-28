/**
 * NODE UTILS - General-purpose node utility functions
 *
 * • Safe JSON stringification to prevent circular reference errors
 * • Intelligent value extraction from node data objects
 * • Readable hexadecimal ID generation for nodes and edges
 *
 * Keywords: nodes, utilities, stringify, extract, safe, id-generation
 */

/**
 * Safely stringifies a value, handling circular references.
 * @param value - The value to stringify.
 * @param space - The indentation space for formatting.
 * @returns A JSON string.
 */
export const safeStringify = (value: any, space = 2): string => {
	const cache = new Set();
	return JSON.stringify(
		value,
		(_key, value) => {
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
	if (data.output !== undefined) {
		return data.output;
	}
	if (data.outputs !== undefined) {
		return data.outputs;
	}
	if (data.value !== undefined) {
		return data.value;
	}
	if (data.text !== undefined) {
		return data.text;
	}
	if (data.result !== undefined) {
		return data.result;
	}
	if (data.payload !== undefined) {
		return data.payload;
	}

	// Fallback for objects with a single key
	const keys = Object.keys(data);
	if (keys.length === 1) {
		return data[keys[0]];
	}

	// If no primary value is found, return the whole data object for inspection
	return data;
};

/**
 * Generates a readable hexadecimal ID for nodes and edges.
 * Format: prefix_timestamp_hex (e.g., "node_1a2b3c4d_5e6f")
 * @param prefix - The prefix for the ID (e.g., "node", "edge").
 * @returns A unique, readable hexadecimal ID.
 */
export const generateReadableId = (prefix: string): string => {
	const timestamp = Date.now().toString(16); // Convert timestamp to hex
	const random = Math.floor(Math.random() * 0x10000)
		.toString(16)
		.padStart(4, "0"); // 4-digit hex
	return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generates a unique node ID with readable hexadecimal format.
 * @returns A unique node ID (e.g., "node_1a2b3c4d_5e6f").
 */
export const generateNodeId = (): string => {
	return generateReadableId("node");
};

/**
 * Generates a unique edge ID with readable hexadecimal format.
 * @returns A unique edge ID (e.g., "edge_1a2b3c4d_5e6f").
 */
export const generateEdgeId = (): string => {
	return generateReadableId("edge");
};
