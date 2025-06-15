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

// Ensure documentation directory exists
const outDir = join(process.cwd(), "documentation");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const out = join(outDir, "core-tokens.md");
writeFileSync(out, md);
console.log("✔ Generated", out);
