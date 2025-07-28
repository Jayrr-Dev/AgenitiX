/**
 * Code-gen: Generate CSS custom properties from `tokens.json`.
 *
 * Usage:
 *   pnpm ts-node scripts/gen-tokens.ts   # writes app/styles/_generated_tokens.css
 *
 * The script:
 *   1. Loads core token JSON (spacing, colors …).
 *   2. Flattens nested objects into `--core-<path>` custom properties.
 *   3. Outputs a `@theme` block so Tailwind can consume variables.
 *
 * NOTE: This does not overwrite manual edits; it rewrites the file fully.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import tokens from "../features/business-logic-modern/infrastructure/theming/tokens.json";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const flatten = (
	obj: Record<string, any>,
	prefix: string[] = [],
	out: Record<string, string> = {}
) => {
	for (const [key, value] of Object.entries(obj)) {
		const path = [...prefix, key];
		if (typeof value === "object" && value !== null) {
			flatten(value, path, out);
		} else {
			out[path.join("-")] = String(value);
		}
	}
	return out;
};

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

const flat = flatten(tokens);

// Separate dark and light tokens
const lightTokens: Record<string, string> = {};
const darkTokens: Record<string, string> = {};

for (const [name, val] of Object.entries(flat)) {
	if (name.endsWith("-dark")) {
		const baseName = name.replace(/-dark$/, "");
		darkTokens[baseName] = val;
	} else {
		lightTokens[name] = val;
	}
}

// Build CSS
let css = "/* AUTO-GENERATED FILE — do not edit directly  */\n";

// Light theme / default variables (use :root instead of @theme for broad browser support)
css += ":root {\n";
for (const [name, val] of Object.entries(lightTokens)) {
	const needsCorePrefix = !(name.startsWith("node-") || name.startsWith("infra-"));
	const varName = needsCorePrefix ? `--core-${name}` : `--${name}`;
	css += `  ${varName}: ${val};\n`;
}
css += "}\n\n";

// Dark theme overrides
css += "html.dark {\n";
for (const [name, val] of Object.entries(darkTokens)) {
	const needsCorePrefix = !(name.startsWith("node-") || name.startsWith("infra-"));
	const varName = needsCorePrefix ? `--core-${name}` : `--${name}`;
	css += `  ${varName}: ${val};\n`;
}
css += "}\n";

// Write
const outPath = join(process.cwd(), "app/styles/_generated_tokens.css");
writeFileSync(outPath, css);
