import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { createGenerator } from "ts-json-schema-generator";

/**
 * Build-time script to generate JSON-Schema for all tsSymbol handles
 * Usage:  pnpm ts-node scripts/gen-handle-types.ts
 */

// 1. locate all node files
const NODE_GLOB = "features/business-logic-modern/node-domain/**/*.node.tsx";
const projectRoot = path.resolve(__dirname, "..");

function extractSymbolsFromFile(filePath: string): string[] {
	const content = fs.readFileSync(filePath, "utf8");
	const symbols: string[] = [];
	const regex = /tsSymbol\s*:\s*["'`]([^"'`]+)["'`]/g;
	let match;
	while ((match = regex.exec(content)) !== null) {
		symbols.push(match[1]);
	}
	return symbols;
}

async function generateSchemas() {
	const files = await fg(NODE_GLOB, { cwd: projectRoot, absolute: true });
	const uniqueSymbols = new Set<string>();
	files.forEach((file) => {
		extractSymbolsFromFile(file).forEach((s) => uniqueSymbols.add(s));
	});

	if (uniqueSymbols.size === 0) {
		console.log("No tsSymbol handles found. Skipping schema generation.");
		return;
	}

	const tsConfigPath = path.join(projectRoot, "tsconfig.json");
	const generator = createGenerator({
		path: tsConfigPath,
		tsconfig: tsConfigPath,
		expose: "export",
		skipTypeCheck: true,
		topRef: false,
	});

	const manifest: Record<string, any> = {};
	uniqueSymbols.forEach((symbol) => {
		try {
			const schema = generator.createSchema(symbol);
			manifest[symbol] = schema.definitions?.[symbol] || schema; // pick definition if present
		} catch (err) {
			console.warn(`⚠️  Could not generate schema for ${symbol}:`, (err as any).message);
		}
	});

	const outDir = path.join(projectRoot, "generated");
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
	const outFile = path.join(outDir, "handle-types.manifest.json");
	fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
	console.log(
		`✅ handle-types manifest written to ${path.relative(projectRoot, outFile)} with ${Object.keys(manifest).length} entries.`
	);
}

generateSchemas().catch((err) => {
	console.error("Schema generation failed", err);
	process.exit(1);
});
