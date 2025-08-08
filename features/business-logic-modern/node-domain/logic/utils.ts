/**
 * Logic domain utilities
 * Shared functions for logic gate operations
 */

/**
 * Extract boolean value from node data with priority order
 * Priority: output → store → booleanValue
 */
export function extractBooleanValue(sourceData: any): boolean | null {
	let inputValue: unknown = undefined;

	// Priority order: output → booleanValue → store → other fields
	if (sourceData?.output !== undefined && sourceData.output !== null) {
		inputValue = sourceData.output;
	} else if (sourceData?.booleanValue !== undefined && sourceData.booleanValue !== null) {
		inputValue = sourceData.booleanValue;
	} else if (sourceData?.store !== undefined && sourceData.store !== null) {
		inputValue = sourceData.store;
	} else {
		// Try common boolean field names
		if (sourceData?.value !== undefined) {
			inputValue = sourceData.value;
		} else if (sourceData?.state !== undefined) {
			inputValue = sourceData.state;
		} else if (sourceData?.isOn !== undefined) {
			inputValue = sourceData.isOn;
		} else if (sourceData?.enabled !== undefined) {
			inputValue = sourceData.enabled;
		} else if (sourceData?.isActive !== undefined) {
			inputValue = sourceData.isActive;
		}
	}

	// Convert to boolean - be more strict about what we accept
	if (inputValue === true) {
		return true;
	}
	if (inputValue === false) {
		return false;
	}
	
	// Try string conversion for "ON"/"OFF" or "true"/"false"
	if (typeof inputValue === 'string') {
		const lowerValue = inputValue.toLowerCase().trim();
		if (lowerValue === 'true' || lowerValue === 'on' || lowerValue === '1') {
			return true;
		}
		if (lowerValue === 'false' || lowerValue === 'off' || lowerValue === '0') {
			return false;
		}
	}
	
	// Try number conversion
	if (typeof inputValue === 'number') {
		return inputValue !== 0;
	}
	
	return null;
}

/**
 * Get visual display properties for boolean output
 */
export function getOutputDisplay(value: boolean | null) {
	if (value === true) {
		return {
			icon: "LuCheck",
			color: "text-green-600 dark:text-green-400",
		};
	}
	if (value === false) {
		return {
			icon: "LuX",
			color: "text-red-600 dark:text-red-400",
		};
	}
	return {
		icon: "LuMinus",
		color: "text-gray-500 dark:text-gray-400",
	};
}

/**
 * Logic gate computations
 */
export const LogicOperations = {
	/**
	 * AND gate: true if ALL inputs are true
	 */
	and: (inputs: boolean[]): boolean | null => {
		if (inputs.length === 0) return null;
		return inputs.every((input) => input === true);
	},

	/**
	 * OR gate: true if ANY input is true
	 */
	or: (inputs: boolean[]): boolean | null => {
		if (inputs.length === 0) return null;
		return inputs.some((input) => input === true);
	},

	/**
	 * NOT gate: invert the input
	 */
	not: (input: boolean | null): boolean | null => {
		if (input === null) return null;
		return !input;
	},

	/**
	 * XOR gate: true if ODD number of inputs are true
	 */
	xor: (inputs: boolean[]): boolean | null => {
		if (inputs.length === 0) return null;
		const trueCount = inputs.filter((input) => input === true).length;
		return trueCount % 2 === 1;
	},

	/**
	 * XNOR gate: true if EVEN number of inputs are true
	 */
	xnor: (inputs: boolean[]): boolean | null => {
		if (inputs.length === 0) return null;
		const trueCount = inputs.filter((input) => input === true).length;
		return trueCount % 2 === 0;
	},
} as const;
