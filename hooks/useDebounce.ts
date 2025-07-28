/**
 * USE DEBOUNCE HOOK - Performance optimization for search inputs
 *
 * • Debounces input values to reduce API calls
 * • Configurable delay for different use cases
 * • Returns debounced value after specified delay
 * • Useful for search inputs and other frequent updates
 *
 * Keywords: debounce, performance, search, optimization
 */

import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}
