/**
 * COMMAND DOCUMENTATION GENERATOR - Auto-generated from actual scripts and commands
 *
 * • Analyzes package.json scripts, plop generators, and custom scripts
 * • Extracts command descriptions, parameters, and usage patterns
 * • Generates comprehensive documentation with examples and integration points
 * • Creates markdown, HTML, and API reference documentation
 * • Tracks command usage, dependencies, and execution patterns
 * • Auto-updates when scripts or commands change
 *
 * Keywords: command-documentation, script-analysis, auto-generation, cli-documentation, usage-patterns
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface CommandAnalysis {
	name: string;
	description: string;
	script: string;
	category: string;
	dependencies: string[];
	parameters: Array<{
		name: string;
		type: string;
		required: boolean;
		description?: string;
		defaultValue?: string;
	}>;
	examples: string[];
	integrationPoints: string[];
	executionTime?: string;
	outputFiles?: string[];
	inputFiles?: string[];
}

interface ScriptAnalysis {
	packageScripts: CommandAnalysis[];
	plopGenerators: CommandAnalysis[];
	customScripts: CommandAnalysis[];
	categories: {
		[key: string]: CommandAnalysis[];
	};
	statistics: {
		totalCommands: number;
		totalScripts: number;
		totalGenerators: number;
		categories: string[];
	};
}

// ============================================================================
// SCRIPT ANALYSIS
// ============================================================================

/**
 * Analyze package.json scripts
 */
function analyzePackageScripts(): CommandAnalysis[] {
	const packageJsonPath = path.join(process.cwd(), "package.json");

	if (!fs.existsSync(packageJsonPath)) {
		throw new Error(`package.json not found at ${packageJsonPath}`);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
	const scripts = packageJson.scripts || {};

	const commands: CommandAnalysis[] = [];

	for (const [name, script] of Object.entries(scripts)) {
		const command = analyzeScriptCommand(name, script as string);
		commands.push(command);
	}

	return commands;
}

/**
 * Analyze individual script command
 */
function analyzeScriptCommand(name: string, script: string): CommandAnalysis {
	const category = categorizeCommand(name, script);
	const dependencies = extractDependencies(script);
	const parameters = extractParameters(script);
	const examples = generateExamples(name, script);
	const integrationPoints = extractIntegrationPoints(script);
	const outputFiles = extractOutputFiles(script);
	const inputFiles = extractInputFiles(script);

	return {
		name,
		description: generateDescription(name, script),
		script,
		category,
		dependencies,
		parameters,
		examples,
		integrationPoints,
		outputFiles,
		inputFiles,
	};
}

/**
 * Categorize command based on name and script
 */
function categorizeCommand(name: string, script: string): string {
	const lowerName = name.toLowerCase();
	const lowerScript = script.toLowerCase();

	if (lowerName.includes("generate") || lowerScript.includes("generate")) {
		return "Generation";
	}

	if (lowerName.includes("build") || lowerName.includes("start") || lowerName.includes("dev")) {
		return "Development";
	}

	if (lowerName.includes("lint") || lowerName.includes("format") || lowerName.includes("check")) {
		return "Quality Assurance";
	}

	if (lowerName.includes("new") || lowerName.includes("create") || lowerName.includes("plop")) {
		return "Scaffolding";
	}

	if (lowerName.includes("validate") || lowerName.includes("test")) {
		return "Validation";
	}

	if (lowerName.includes("migrate") || lowerName.includes("update")) {
		return "Migration";
	}

	return "Utilities";
}

/**
 * Extract dependencies from script
 */
function extractDependencies(script: string): string[] {
	const dependencies: string[] = [];

	// Extract npm/pnpm packages
	const packageMatches = script.match(/(?:pnpm|npm|yarn)\s+([a-zA-Z0-9@\-_./]+)/g);
	if (packageMatches) {
		packageMatches.forEach((match) => {
			const packageName = match.replace(/(?:pnpm|npm|yarn)\s+/, "");
			if (!dependencies.includes(packageName)) {
				dependencies.push(packageName);
			}
		});
	}

	// Extract ts-node scripts
	if (script.includes("ts-node")) {
		dependencies.push("ts-node");
	}

	// Extract node scripts
	if (script.includes("node")) {
		dependencies.push("node");
	}

	return dependencies;
}

/**
 * Extract parameters from script
 */
function extractParameters(script: string): Array<{
	name: string;
	type: string;
	required: boolean;
	description?: string;
	defaultValue?: string;
}> {
	const parameters: Array<{
		name: string;
		type: string;
		required: boolean;
		description?: string;
		defaultValue?: string;
	}> = [];

	// Extract --project parameter
	if (script.includes("--project")) {
		parameters.push({
			name: "project",
			type: "string",
			required: true,
			description: "TypeScript project configuration file",
		});
	}

	// Extract --write parameter
	if (script.includes("--write")) {
		parameters.push({
			name: "write",
			type: "boolean",
			required: false,
			description: "Write changes to files",
			defaultValue: "false",
		});
	}

	// Extract --exit-code parameter
	if (script.includes("--exit-code")) {
		parameters.push({
			name: "exitCode",
			type: "boolean",
			required: false,
			description: "Exit with code on validation failure",
			defaultValue: "false",
		});
	}

	return parameters;
}

/**
 * Generate examples for command
 */
function generateExamples(name: string, script: string): string[] {
	const examples: string[] = [];

	// Basic usage
	examples.push(`pnpm ${name}`);

	// With parameters
	if (script.includes("--project")) {
		examples.push(`pnpm ${name} --project tsconfig.node.json`);
	}

	if (script.includes("--write")) {
		examples.push(`pnpm ${name} --write`);
	}

	// Development examples
	if (name.includes("dev")) {
		examples.push(`pnpm ${name} # Start development server`);
	}

	if (name.includes("build")) {
		examples.push(`pnpm ${name} # Build for production`);
	}

	return examples;
}

/**
 * Extract integration points from script
 */
function extractIntegrationPoints(script: string): string[] {
	const integrationPoints: string[] = [];

	if (script.includes("ts-node")) {
		integrationPoints.push("TypeScript Compilation");
	}

	if (script.includes("next")) {
		integrationPoints.push("Next.js Framework");
	}

	if (script.includes("biome")) {
		integrationPoints.push("Biome Linting");
	}

	if (script.includes("plop")) {
		integrationPoints.push("Plop Scaffolding");
	}

	if (script.includes("git")) {
		integrationPoints.push("Git Version Control");
	}

	if (script.includes("postcss")) {
		integrationPoints.push("PostCSS Processing");
	}

	return integrationPoints;
}

/**
 * Extract output files from script
 */
function extractOutputFiles(script: string): string[] {
	const outputFiles: string[] = [];

	if (script.includes("_generated_tokens.css")) {
		outputFiles.push("app/styles/_generated_tokens.css");
	}

	if (script.includes("gen-docs-tokens")) {
		outputFiles.push("documentation/tokens-preview.html");
	}

	if (script.includes("generate-node-docs")) {
		outputFiles.push("documentation/nodes/");
	}

	if (script.includes("generate-handle-docs")) {
		outputFiles.push("documentation/handles/");
	}

	if (script.includes("generate-nodespec-docs")) {
		outputFiles.push("documentation/NodeCore/");
	}

	return outputFiles;
}

/**
 * Extract input files from script
 */
function extractInputFiles(script: string): string[] {
	const inputFiles: string[] = [];

	if (script.includes("gen-tokens")) {
		inputFiles.push("scripts/gen-tokens.ts");
	}

	if (script.includes("generate-node-docs")) {
		inputFiles.push("features/business-logic-modern/node-domain/");
	}

	if (script.includes("generate-handle-docs")) {
		inputFiles.push("types/handle-types-manifest.d.ts");
	}

	if (script.includes("generate-nodespec-docs")) {
		inputFiles.push("features/business-logic-modern/infrastructure/node-core/NodeSpec.ts");
		inputFiles.push("features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx");
	}

	return inputFiles;
}

/**
 * Generate description for command
 */
function generateDescription(name: string, _script: string): string {
	const descriptions: { [key: string]: string } = {
		dev: "Start development server with hot reload",
		build: "Build application for production",
		start: "Start production server",
		lint: "Run linting checks on codebase",
		"lint:fix": "Fix linting issues automatically",
		format: "Format code using Biome",
		plop: "Run Plop scaffolding tool",
		"new:node": "Create a new node using Plop",
		"migrate:nodes": "Migrate all nodes to latest schema",
		"generate:handle-types": "Generate TypeScript handle type definitions",
		"generate:tokens": "Generate CSS design tokens",
		"generate:docs": "Generate documentation tokens",
		"generate:node-docs": "Generate node documentation",
		"generate:nodes-overview": "Generate nodes overview documentation",
		"generate:handle-docs": "Generate handle system documentation",
		"generate:ui-overview": "Generate UI components overview",
		"regenerate:ui-docs": "Regenerate UI documentation",
		"generate:infrastructure-overview": "Generate infrastructure documentation",
		"generate:theming-overview": "Generate theming documentation",
		"generate:nodespec-docs": "Generate NodeSpec and Scaffold documentation",
		"check:token-drift": "Check for token generation drift",
		"validate:tokens": "Validate design tokens",
		"ci:tokens": "Run token validation in CI",
		"validate:colors": "Validate primitive color tokens",
		"validate:adapter": "Validate adapter logic",
		postinstall: "Run post-installation tasks",
	};

	return descriptions[name] || `Execute ${name} command`;
}

// ============================================================================
// PLOP ANALYSIS
// ============================================================================

/**
 * Analyze plop generators
 */
function analyzePlopGenerators(): CommandAnalysis[] {
	const plopfilePath = path.join(process.cwd(), "plopfile.js");

	if (!fs.existsSync(plopfilePath)) {
		return [];
	}

	const plopContent = fs.readFileSync(plopfilePath, "utf-8");
	const generators: CommandAnalysis[] = [];

	// Extract generator names from plopfile
	const generatorMatches = plopContent.match(/plop\.setGenerator\("([^"]+)"/g);

	if (generatorMatches) {
		generatorMatches.forEach((match) => {
			const name = match.match(/"([^"]+)"/)?.[1];
			if (name) {
				const generator = analyzePlopGenerator(name, plopContent);
				generators.push(generator);
			}
		});
	}

	return generators;
}

/**
 * Analyze individual plop generator
 */
function analyzePlopGenerator(name: string, plopContent: string): CommandAnalysis {
	const description = extractPlopDescription(name, plopContent);
	const prompts = extractPlopPrompts(name, plopContent);
	const actions = extractPlopActions(name, plopContent);

	return {
		name: `plop ${name}`,
		description: description || `Generate ${name} using Plop`,
		script: `plop ${name}`,
		category: "Scaffolding",
		dependencies: ["plop"],
		parameters: prompts.map((prompt) => ({
			name: prompt.name,
			type: prompt.type,
			required: !prompt.optional,
			description: prompt.message,
			defaultValue: prompt.default,
		})),
		examples: [`pnpm plop ${name}`, `npx plop ${name}`],
		integrationPoints: ["Plop Scaffolding", "File Generation", "Template System"],
		outputFiles: actions.map((action) => action.output),
		inputFiles: ["plopfile.js", "tooling/dev-scripts/plop-templates/"],
	};
}

/**
 * Extract plop generator description
 */
function extractPlopDescription(name: string, plopContent: string): string {
	const pattern = new RegExp(
		`plop\\.setGenerator\\("${name}",\\s*{[\\s\\S]*?description:\\s*"([^"]+)"`,
		"g"
	);
	const match = pattern.exec(plopContent);
	return match?.[1] || `Generate ${name} using Plop`;
}

/**
 * Extract plop prompts
 */
function extractPlopPrompts(
	name: string,
	plopContent: string
): Array<{ name: string; type: string; message: string; optional: boolean; default?: string }> {
	const prompts: Array<{
		name: string;
		type: string;
		message: string;
		optional: boolean;
		default?: string;
	}> = [];

	const generatorPattern = new RegExp(
		`plop\\.setGenerator\\("${name}",\\s*{[\\s\\S]*?prompts:\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?}`,
		"g"
	);
	const match = generatorPattern.exec(plopContent);

	if (match) {
		const promptsSection = match[1];
		const promptMatches = promptsSection.match(
			/{[^}]*name:\s*"([^"]+)"[^}]*type:\s*"([^"]+)"[^}]*message:\s*"([^"]+)"[^}]*}/g
		);

		if (promptMatches) {
			promptMatches.forEach((promptMatch) => {
				const nameMatch = promptMatch.match(/name:\s*"([^"]+)"/);
				const typeMatch = promptMatch.match(/type:\s*"([^"]+)"/);
				const messageMatch = promptMatch.match(/message:\s*"([^"]+)"/);
				const defaultMatch = promptMatch.match(/default:\s*"([^"]+)"/);

				if (nameMatch && typeMatch && messageMatch) {
					prompts.push({
						name: nameMatch[1],
						type: typeMatch[1],
						message: messageMatch[1],
						optional: false,
						default: defaultMatch?.[1],
					});
				}
			});
		}
	}

	return prompts;
}

/**
 * Extract plop actions
 */
function extractPlopActions(name: string, plopContent: string): Array<{ output: string }> {
	const actions: Array<{ output: string }> = [];

	const generatorPattern = new RegExp(
		`plop\\.setGenerator\\("${name}",\\s*{[\\s\\S]*?actions:\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?}`,
		"g"
	);
	const match = generatorPattern.exec(plopContent);

	if (match) {
		const actionsSection = match[1];
		const fileMatches = actionsSection.match(/path:\s*"([^"]+)"/g);

		if (fileMatches) {
			fileMatches.forEach((fileMatch) => {
				const pathMatch = fileMatch.match(/"([^"]+)"/);
				if (pathMatch) {
					actions.push({ output: pathMatch[1] });
				}
			});
		}
	}

	return actions;
}

// ============================================================================
// CUSTOM SCRIPTS ANALYSIS
// ============================================================================

/**
 * Analyze custom scripts in scripts directory
 */
function analyzeCustomScripts(): CommandAnalysis[] {
	const scriptsDir = path.join(process.cwd(), "scripts");
	const scripts: CommandAnalysis[] = [];

	if (!fs.existsSync(scriptsDir)) {
		return scripts;
	}

	const files = fs.readdirSync(scriptsDir);

	files.forEach((file) => {
		if (file.endsWith(".ts") || file.endsWith(".js")) {
			const scriptPath = path.join(scriptsDir, file);
			const script = analyzeCustomScript(file, scriptPath);
			scripts.push(script);
		}
	});

	return scripts;
}

/**
 * Analyze individual custom script
 */
function analyzeCustomScript(filename: string, scriptPath: string): CommandAnalysis {
	const content = fs.readFileSync(scriptPath, "utf-8");
	const name = filename.replace(/\.(ts|js)$/, "");

	return {
		name: `node scripts/${filename}`,
		description: extractScriptDescription(content) || `Execute ${name} script`,
		script: `node scripts/${filename}`,
		category: categorizeScript(filename, content),
		dependencies: extractScriptDependencies(content),
		parameters: [],
		examples: [
			`node scripts/${filename}`,
			`npx ts-node --project tsconfig.node.json scripts/${filename}`,
		],
		integrationPoints: extractScriptIntegrationPoints(content),
		outputFiles: extractScriptOutputFiles(content),
		inputFiles: extractScriptInputFiles(content),
	};
}

/**
 * Extract script description from JSDoc
 */
function extractScriptDescription(content: string): string | undefined {
	const jsDocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
	if (jsDocMatch) {
		const jsDoc = jsDocMatch[1];
		const descriptionMatch = jsDoc.match(/\*\s*([^*\n]+)/);
		return descriptionMatch?.[1]?.trim();
	}
	return undefined;
}

/**
 * Categorize script based on filename and content
 */
function categorizeScript(filename: string, content: string): string {
	const lowerFilename = filename.toLowerCase();
	const lowerContent = content.toLowerCase();

	if (lowerFilename.includes("generate") || lowerContent.includes("generate")) {
		return "Generation";
	}

	if (lowerFilename.includes("validate") || lowerContent.includes("validate")) {
		return "Validation";
	}

	if (lowerFilename.includes("migrate") || lowerContent.includes("migrate")) {
		return "Migration";
	}

	if (lowerFilename.includes("gen-") || lowerFilename.includes("generate")) {
		return "Generation";
	}

	return "Utilities";
}

/**
 * Extract script dependencies
 */
function extractScriptDependencies(content: string): string[] {
	const dependencies: string[] = [];

	if (content.includes("typescript")) {
		dependencies.push("typescript");
	}

	if (content.includes("fs")) {
		dependencies.push("node:fs");
	}

	if (content.includes("path")) {
		dependencies.push("node:path");
	}

	if (content.includes("ts-node")) {
		dependencies.push("ts-node");
	}

	return dependencies;
}

/**
 * Extract script integration points
 */
function extractScriptIntegrationPoints(content: string): string[] {
	const integrationPoints: string[] = [];

	if (content.includes("documentation")) {
		integrationPoints.push("Documentation System");
	}

	if (content.includes("tokens")) {
		integrationPoints.push("Design Tokens");
	}

	if (content.includes("nodes")) {
		integrationPoints.push("Node System");
	}

	if (content.includes("handles")) {
		integrationPoints.push("Handle System");
	}

	if (content.includes("theming")) {
		integrationPoints.push("Theming System");
	}

	return integrationPoints;
}

/**
 * Extract script output files
 */
function extractScriptOutputFiles(content: string): string[] {
	const outputFiles: string[] = [];

	const fileMatches = content.match(/writeFileSync\([^,]+,\s*[^,]+,\s*"([^"]+)"/g);
	if (fileMatches) {
		fileMatches.forEach((match) => {
			const fileMatch = match.match(/"([^"]+)"/);
			if (fileMatch) {
				outputFiles.push(fileMatch[1]);
			}
		});
	}

	return outputFiles;
}

/**
 * Extract script input files
 */
function extractScriptInputFiles(content: string): string[] {
	const inputFiles: string[] = [];

	const fileMatches = content.match(/readFileSync\([^,]+,\s*"([^"]+)"/g);
	if (fileMatches) {
		fileMatches.forEach((match) => {
			const fileMatch = match.match(/"([^"]+)"/);
			if (fileMatch) {
				inputFiles.push(fileMatch[1]);
			}
		});
	}

	return inputFiles;
}

// ============================================================================
// DOCUMENTATION GENERATION
// ============================================================================

/**
 * Generate comprehensive command documentation
 */
function generateCommandDocs(analysis: ScriptAnalysis) {
	const docsDir = path.join(process.cwd(), "documentation/Commands");

	// Ensure directory exists
	if (!fs.existsSync(docsDir)) {
		fs.mkdirSync(docsDir, { recursive: true });
	}

	// Generate markdown documentation
	const markdownContent = generateCommandMarkdown(analysis);
	const markdownPath = path.join(docsDir, "README.md");
	fs.writeFileSync(markdownPath, markdownContent);

	// Generate HTML documentation
	const htmlContent = generateCommandHTML(analysis);
	const htmlPath = path.join(docsDir, "index.html");
	fs.writeFileSync(htmlPath, htmlContent);

	// Generate category-specific documentation
	analysis.statistics.categories.forEach((category) => {
		const categoryCommands = analysis.categories[category];
		if (categoryCommands) {
			const categoryMarkdown = generateCategoryMarkdown(category, categoryCommands);
			const categoryPath = path.join(docsDir, `${category.toLowerCase().replace(/\s+/g, "-")}.md`);
			fs.writeFileSync(categoryPath, categoryMarkdown);
		}
	});
}

/**
 * Generate command markdown documentation
 */
function generateCommandMarkdown(analysis: ScriptAnalysis): string {
	return `# Command Documentation

## Overview

This section contains **auto-generated documentation** for all commands, scripts, and generators in the project. All documentation is automatically generated from the actual source code and updated when commands change.

## 📊 Auto-Generated Analysis

- **Total Commands**: ${analysis.statistics.totalCommands}
- **Package Scripts**: ${analysis.statistics.totalScripts}
- **Plop Generators**: ${analysis.statistics.totalGenerators}
- **Categories**: ${analysis.statistics.categories.length}
- **Last Updated**: ${new Date().toLocaleString()}

## 🎯 Command Categories

${analysis.statistics.categories
	.map(
		(category) => `
### ${category}
${analysis.categories[category]?.length || 0} commands

${analysis.categories[category]?.map((cmd) => `- **[${cmd.name}](#${cmd.name.toLowerCase().replace(/[^a-z0-9]/g, "-")})** - ${cmd.description}`).join("\n") || "No commands in this category"}
`
	)
	.join("\n")}

## 📋 Detailed Command Reference

${analysis.packageScripts
	.concat(analysis.plopGenerators)
	.concat(analysis.customScripts)
	.map(
		(cmd) => `
### ${cmd.name}

${cmd.description}

**Script:** \`${cmd.script}\`

**Category:** ${cmd.category}

${cmd.dependencies.length > 0 ? `**Dependencies:** ${cmd.dependencies.join(", ")}` : ""}

${
	cmd.parameters.length > 0
		? `
**Parameters:**
${cmd.parameters.map((param) => `- **${param.name}** (\`${param.type}\`)${param.required ? " - Required" : " - Optional"}${param.description ? ` - ${param.description}` : ""}${param.defaultValue ? ` (default: ${param.defaultValue})` : ""}`).join("\n")}`
		: ""
}

${
	cmd.examples.length > 0
		? `
**Examples:**
${cmd.examples
	.map(
		(example) => `\`\`\`bash
${example}
\`\`\``
	)
	.join("\n")}`
		: ""
}

${
	cmd.integrationPoints.length > 0
		? `
**Integration Points:**
${cmd.integrationPoints.map((point) => `- ${point}`).join("\n")}`
		: ""
}

${
	cmd.inputFiles && cmd.inputFiles.length > 0
		? `
**Input Files:**
${cmd.inputFiles.map((file) => `- \`${file}\``).join("\n")}`
		: ""
}

${
	cmd.outputFiles && cmd.outputFiles.length > 0
		? `
**Output Files:**
${cmd.outputFiles.map((file) => `- \`${file}\``).join("\n")}`
		: ""
}
`
	)
	.join("\n")}

## 🔗 Integration Points

This documentation is automatically generated from:
- **Package.json Scripts** - All npm/pnpm scripts
- **Plop Generators** - Scaffolding and generation commands
- **Custom Scripts** - TypeScript and JavaScript scripts in scripts/
- **Last Analysis**: ${new Date().toLocaleString()}

---

*This documentation is auto-generated from the actual source code. Any changes to scripts or commands will be reflected in the next generation.*
`;
}

/**
 * Generate category markdown documentation
 */
function generateCategoryMarkdown(category: string, commands: CommandAnalysis[]): string {
	return `# ${category} Commands

## Overview

This category contains ${commands.length} commands related to ${category.toLowerCase()} operations.

## 📋 Commands

${commands
	.map(
		(cmd) => `
### ${cmd.name}

${cmd.description}

**Script:** \`${cmd.script}\`

${cmd.dependencies.length > 0 ? `**Dependencies:** ${cmd.dependencies.join(", ")}` : ""}

${
	cmd.parameters.length > 0
		? `
**Parameters:**
${cmd.parameters.map((param) => `- **${param.name}** (\`${param.type}\`)${param.required ? " - Required" : " - Optional"}${param.description ? ` - ${param.description}` : ""}${param.defaultValue ? ` (default: ${param.defaultValue})` : ""}`).join("\n")}`
		: ""
}

${
	cmd.examples.length > 0
		? `
**Examples:**
${cmd.examples
	.map(
		(example) => `\`\`\`bash
${example}
\`\`\``
	)
	.join("\n")}`
		: ""
}

${
	cmd.integrationPoints.length > 0
		? `
**Integration Points:**
${cmd.integrationPoints.map((point) => `- ${point}`).join("\n")}`
		: ""
}

${
	cmd.inputFiles && cmd.inputFiles.length > 0
		? `
**Input Files:**
${cmd.inputFiles.map((file) => `- \`${file}\``).join("\n")}`
		: ""
}

${
	cmd.outputFiles && cmd.outputFiles.length > 0
		? `
**Output Files:**
${cmd.outputFiles.map((file) => `- \`${file}\``).join("\n")}`
		: ""
}
`
	)
	.join("\n")}

---

*This documentation is auto-generated from the actual source code.*
`;
}

/**
 * Generate command HTML documentation
 */
function generateCommandHTML(analysis: ScriptAnalysis): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Command Documentation - Auto-Generated</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 20px; text-align: center; }
        .stat-card h3 { margin: 0; color: #1976d2; font-size: 2em; }
        .stat-card p { margin: 5px 0 0 0; color: #0d47a1; }
        .command-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .command-card h3 { margin-top: 0; color: #495057; }
        .parameter { background: white; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .parameter strong { color: #495057; }
        .parameter .type { color: #6c757d; font-size: 0.9em; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
        .auto-generated { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .category-tabs { display: flex; gap: 10px; margin: 20px 0; }
        .category-tab { padding: 10px 20px; background: #e9ecef; border: none; border-radius: 4px; cursor: pointer; }
        .category-tab.active { background: #667eea; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Command Documentation</h1>
            <p>Auto-generated from actual scripts and commands</p>
        </div>
        
        <div class="content">
            <div class="auto-generated">
                <strong>🔄 Auto-Generated</strong><br>
                This documentation is automatically generated from the actual scripts and commands.
                Last updated: ${new Date().toLocaleString()}
            </div>
            
            <div class="section">
                <h2>📊 Analysis Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${analysis.statistics.totalCommands}</h3>
                        <p>Total Commands</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.statistics.totalScripts}</h3>
                        <p>Package Scripts</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.statistics.totalGenerators}</h3>
                        <p>Plop Generators</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.statistics.categories.length}</h3>
                        <p>Categories</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🎯 Command Categories</h2>
                <div class="category-tabs">
                    ${analysis.statistics.categories
											.map(
												(category) => `
                    <button class="category-tab" onclick="showCategory('${category}')">${category}</button>
                    `
											)
											.join("")}
                </div>
                
                ${analysis.statistics.categories
									.map(
										(category) => `
                <div id="category-${category}" class="category-section" style="display: none;">
                    <h3>${category} Commands</h3>
                    ${
											analysis.categories[category]
												?.map(
													(cmd) => `
                    <div class="command-card">
                        <h3>${cmd.name}</h3>
                        <p>${cmd.description}</p>
                        <div class="code-block">${cmd.script}</div>
                        ${cmd.dependencies.length > 0 ? `<p><strong>Dependencies:</strong> ${cmd.dependencies.join(", ")}</p>` : ""}
                        ${
													cmd.parameters.length > 0
														? `
                        <h4>Parameters:</h4>
                        ${cmd.parameters
													.map(
														(param) => `
                        <div class="parameter">
                            <strong>${param.name}</strong> <span class="type">(${param.type})</span>
                            ${param.required ? "<span style='color: #dc3545;'>Required</span>" : "<span style='color: #6c757d;'>Optional</span>"}
                            ${param.description ? `<br><small>${param.description}</small>` : ""}
                        </div>
                        `
													)
													.join("")}`
														: ""
												}
                        ${
													cmd.examples.length > 0
														? `
                        <h4>Examples:</h4>
                        ${cmd.examples.map((example) => `<div class="code-block">${example}</div>`).join("")}`
														: ""
												}
                    </div>
                    `
												)
												.join("") || "<p>No commands in this category</p>"
										}
                </div>
                `
									)
									.join("")}
            </div>
        </div>
    </div>
    
    <script>
        function showCategory(category) {
            // Hide all category sections
            document.querySelectorAll('.category-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.category-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected category
            document.getElementById('category-' + category).style.display = 'block';
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
        
        // Show first category by default
        showCategory('${analysis.statistics.categories[0] || "Development"}');
        document.querySelector('.category-tab').classList.add('active');
    </script>
</body>
</html>`;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate comprehensive documentation for all commands
 */
function generateAllCommandDocs() {
	try {
		// Analyze all command types
		const packageScripts = analyzePackageScripts();
		const plopGenerators = analyzePlopGenerators();
		const customScripts = analyzeCustomScripts();

		// Organize by categories
		const categories: { [key: string]: CommandAnalysis[] } = {};
		const allCommands = [...packageScripts, ...plopGenerators, ...customScripts];

		allCommands.forEach((cmd) => {
			if (!categories[cmd.category]) {
				categories[cmd.category] = [];
			}
			categories[cmd.category].push(cmd);
		});

		const analysis: ScriptAnalysis = {
			packageScripts,
			plopGenerators,
			customScripts,
			categories,
			statistics: {
				totalCommands: allCommands.length,
				totalScripts: packageScripts.length,
				totalGenerators: plopGenerators.length,
				categories: Object.keys(categories),
			},
		};

		generateCommandDocs(analysis);
	} catch (error) {
		console.error("❌ Error generating command documentation:", error);
		process.exit(1);
	}
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
	generateAllCommandDocs();
}

export { generateAllCommandDocs as generateCommandDocs };
