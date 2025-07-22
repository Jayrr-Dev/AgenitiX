import fs, { writeFileSync } from "fs";
import { join } from "path";
import tokens from "../features/business-logic-modern/infrastructure/theming/tokens.json";

const flatten = (
	obj: Record<string, any>,
	prefix: string[] = [],
	out: Record<string, string> = {}
) => {
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v === "object" && v !== null) {
			flatten(v, [...prefix, k], out);
		} else {
			out[[...prefix, k].join(".")] = String(v);
		}
	}
	return out;
};

const flat = flatten(tokens);

// Build markdown table
let md = "# Core Tokens\n\n| Token | Value |\n|-------|-------|\n";
for (const [k, v] of Object.entries(flat)) {
	md += `| ${k} | ${v} |\n`;
}

// Build HTML preview with color swatches
let html = `<!DOCTYPE html>
<html>
<head>
  <title>Design Tokens Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    .token-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0; }
    .token-group { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; }
    .token-group h3 { margin-top: 0; }
    .color-swatch { display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; }
    .swatch { width: 24px; height: 24px; border-radius: 4px; border: 1px solid #ccc; }
    .token-table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    .token-table th, .token-table td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
    .token-table th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Design Tokens</h1>
  <p>Auto-generated from <code>tokens.json</code> • Last updated: ${new Date().toLocaleString()}</p>
`;

// Add color swatches for node and infra tokens
const nodeColors = Object.entries(tokens.node || {});
const infraColors = Object.entries(tokens.infra || {});

if (nodeColors.length > 0) {
	html += `
  <div class="token-grid">
    <div class="token-group">
      <h3>Node Categories</h3>`;

	for (const [category, colors] of nodeColors) {
		const bg = (colors as any).bg;
		const text = (colors as any).text;
		if (bg && text) {
			html += `
      <div class="color-swatch">
        <div class="swatch" style="background: hsl(${bg}); color: hsl(${text}); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">Aa</div>
        <span><strong>${category}</strong> • bg: ${bg} • text: ${text}</span>
      </div>`;
		}
	}

	html += `
    </div>`;
}

if (infraColors.length > 0) {
	html += `
    <div class="token-group">
      <h3>Infrastructure Components</h3>`;

	for (const [component, colors] of infraColors) {
		const bg = (colors as any).bg;
		const text = (colors as any).text;
		if (bg && text) {
			html += `
      <div class="color-swatch">
        <div class="swatch" style="background: hsl(${bg}); color: hsl(${text}); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">Aa</div>
        <span><strong>${component}</strong> • bg: ${bg} • text: ${text}</span>
      </div>`;
		}
	}

	html += `
    </div>
  </div>`;
}

// Add full token table
html += `
  <h2>All Tokens</h2>
  <table class="token-table">
    <thead>
      <tr><th>Token</th><th>Value</th></tr>
    </thead>
    <tbody>`;

for (const [k, v] of Object.entries(flat)) {
	html += `<tr><td>${k}</td><td>${v}</td></tr>`;
}

html += `
    </tbody>
  </table>
</body>
</html>`;

// Ensure documentation directory exists
const outDir = join(process.cwd(), "documentation");
if (!fs.existsSync(outDir)) {
	fs.mkdirSync(outDir, { recursive: true });
}

// Write both files
const mdOut = join(outDir, "core-tokens.md");
const htmlOut = join(outDir, "tokens-preview.html");

writeFileSync(mdOut, md);
writeFileSync(htmlOut, html);

console.log("✔ Generated", mdOut);
console.log("✔ Generated", htmlOut, "- open in browser for visual preview");
