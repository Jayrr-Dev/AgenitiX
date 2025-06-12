/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const { createGenerator } = require('ts-json-schema-generator');

// ---------------------------------------------------------------------------
// Generate JSON schema manifest for all handles that declare `tsSymbol`
// ---------------------------------------------------------------------------

const NODE_GLOB = 'features/business-logic-modern/node-domain/**/*.node.tsx';
const projectRoot = path.resolve(__dirname, '..');

function extractSymbolsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const symbols = [];
  const regex = /tsSymbol\s*:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    symbols.push(match[1]);
  }
  return symbols;
}

async function generate() {
  const files = await fg(NODE_GLOB, { cwd: projectRoot, absolute: true });
  const unique = new Set();
  files.forEach((f) => extractSymbolsFromFile(f).forEach((s) => unique.add(s)));

  if (unique.size === 0) {
    console.log('No tsSymbol handles found. Skipping schema generation.');
    return;
  }

  const tsconfig = path.join(projectRoot, 'tsconfig.json');
  const generator = createGenerator({
    tsconfig,
    expose: 'export',
    skipTypeCheck: true,
    topRef: false,
  });

  const manifest = {};
  unique.forEach((symbol) => {
    try {
      const schema = generator.createSchema(symbol);
      manifest[symbol] = schema.definitions?.[symbol] || schema;
    } catch (err) {
      console.warn(`⚠️  Could not generate schema for ${symbol}:`, err.message);
    }
  });

  const outDir = path.join(projectRoot, 'generated');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, 'handle-types.manifest.json');
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
  console.log(`✅ handle-types manifest generated with ${Object.keys(manifest).length} entries.`);
}

generate().catch((err) => {
  console.error('Schema generation failed', err);
  process.exit(1);
}); 