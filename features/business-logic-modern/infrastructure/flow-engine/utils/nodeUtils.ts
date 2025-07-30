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
 * Safely stringify a value to JSON, handling circular references.
 * @param value The value to stringify.
 * @param space The space parameter for JSON.stringify.
 * @returns A JSON string.
 */
export const safeStringify = (value: unknown, space = 2): string => {
	const cache = new Set();
	return JSON.stringify(
		value,
		(_key, val) => {
			if (typeof val === "object" && val !== null) {
				if (cache.has(val)) {
					return "[Circular]";
				}
				cache.add(val);
			}
			return val;
		},
		space
	);
};

/**
 * Extracts a meaningful value from node data for display purposes.
 *
 * Priority: outputs > outputs.result > inputs.value > data itself (as stringified JSON)
 *
 * @param data The node data object.
 * @returns The extracted value, or the stringified object if no primary value is found.
 */
export const extractNodeValue = (data: Record<string, unknown> | null | undefined): unknown => {
	if (!data) {
		return null;
	}

	// Check for outputs first (most common case)
	if (data.outputs !== undefined && data.outputs !== null) {
		return data.outputs;
	}

	// Check for outputs.result (nested case)
	if (data.outputs && typeof data.outputs === "object" && data.outputs !== null) {
		const outputs = data.outputs as Record<string, unknown>;
		if ("result" in outputs) {
			return outputs.result;
		}
	}

	// Check for inputs.value
	if (data.inputs && typeof data.inputs === "object" && data.inputs !== null) {
		const inputs = data.inputs as Record<string, unknown>;
		if ("value" in inputs) {
			return inputs.value;
		}
	}

	// Check for isProcessing (AI Agent specific)
	if (data.isProcessing !== undefined && data.isProcessing !== null) {
		// If isProcessing is a string, return it directly
		if (typeof data.isProcessing === "string") {
			return data.isProcessing;
		}
		// If isProcessing is an Error, return the error message
		if (data.isProcessing instanceof Error) {
			return `Error: ${data.isProcessing.message}`;
		}
	}

	// Special handling for AI Agent - if outputs is an object, try to extract the actual response
	if (data.outputs && typeof data.outputs === "object" && data.outputs !== null) {
		// Check if this looks like AI Agent data (has AI-specific fields)
		if ("selectedProvider" in data.outputs || "systemPrompt" in data.outputs) {
			// This is likely the entire node data object, not the actual output
			// Try to get the actual response from isProcessing
			if (data.isProcessing && typeof data.isProcessing === "string") {
				return data.isProcessing;
			}
			// If no isProcessing, return a placeholder
			return "No AI response available";
		}
	}

	// Fallback to stringified data
	return safeStringify(data);
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
