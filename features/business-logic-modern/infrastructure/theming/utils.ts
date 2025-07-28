/**
 * THEMING UTILITIES – Shared helper functions (single source-of-truth)
 *
 * • combineTokens  – join class strings safely
 * • getVariant     – lookup variant value from config map
 * • getConditionalVariant – choose variant based on boolean flag
 *
 * These helpers are framework-agnostic and have **zero** references to
 * specific components or global configs, so they can be reused across
 * the entire codebase (and by Plop generators) without risk of drift.
 */

// ---------------------------------------------------------------------
// combineTokens --------------------------------------------------------
// ---------------------------------------------------------------------

/**
 * Join any number of class / token strings, skipping falsy values.
 * Identical to clsx/twMerge for simple cases but with zero deps.
 */
export const combineTokens = (...tokens: Array<string | false | undefined | null>): string =>
	tokens.filter(Boolean).join(" ");

/**
 * Back-compat alias – some legacy files import `combineStyles`.
 * Will be removed once all legacy imports are migrated.
 */
export const combineStyles = combineTokens; // eslint-disable-line import/prefer-default-export

// ---------------------------------------------------------------------
// getVariant helpers ---------------------------------------------------
// ---------------------------------------------------------------------

/**
 * Generic variant lookup.
 *
 * @param variantsByCategory – an object whose values are objects of string→string
 * @param category           – key into variantsByCategory
 * @param variant            – desired variant name
 * @param fallback           – optional string if variant not found
 */
export function getVariant<
	C extends string,
	V extends Record<string, string>,
	T extends Record<C, V>,
>(variantsByCategory: T, category: C, variant: string, fallback = ""): string {
	const cat = variantsByCategory[category] as Record<string, string> | undefined;
	if (!cat) {
		return fallback;
	}
	return cat[variant] ?? fallback;
}

/**
 * Convenience helper to choose between two variants via a boolean flag.
 */
export function getConditionalVariant<
	C extends string,
	V extends Record<string, string>,
	T extends Record<C, V>,
>(
	variantsByCategory: T,
	category: C,
	condition: boolean,
	trueVariant: string,
	falseVariant: string,
	fallback = ""
): string {
	return getVariant(variantsByCategory, category, condition ? trueVariant : falseVariant, fallback);
}
