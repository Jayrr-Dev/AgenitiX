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
	
	// Special handling for AI Agent when outputs is null - check processingResult
	if (data.selectedProvider || data.systemPrompt) { // This indicates it's an AI Agent node
		if (data.processingResult !== undefined && data.processingResult !== null) {
			return data.processingResult;
		}
		
		// If processing hasn't completed yet, return a placeholder instead of the full object
		if (data.processingState === "processing") {
			return "Processing...";
		}
		
		if (data.processingState === "error" && data.processingError) {
			return `Error: ${data.processingError}`;
		}
		
		// If no result yet, return empty instead of the full object
		return "No response yet";
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

	// For AI Agent, check processingResult as fallback if outputs is not available
	if (data.processingResult !== undefined && data.processingResult !== null) {
		if (typeof data.processingResult === "string") {
			return data.processingResult;
		}
	}

	// If outputs is an object but shouldn't be (data corruption), try to extract text
	if (data.outputs && typeof data.outputs === "object" && data.outputs !== null) {
		const outputObj = data.outputs as Record<string, unknown>;
		
		// Try to extract response text from malformed output object
		if (typeof outputObj.response === "string") {
			return outputObj.response;
		}
		if (typeof outputObj.text === "string") {
			return outputObj.text;
		}
		if (typeof outputObj.content === "string") {
			return outputObj.content;
		}
		
		// If it contains the full AI response object, extract the response field
		if (outputObj.threadId && outputObj.response) {
			return outputObj.response;
		}
		
		// Last resort: stringify the object but warn it shouldn't happen
		console.warn("AI Agent outputs field contains object instead of string:", outputObj);
		return JSON.stringify(outputObj);
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
