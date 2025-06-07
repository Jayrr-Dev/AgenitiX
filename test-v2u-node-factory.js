// Test script to check if NodeFactory recognizes V2U nodes
console.log("🔍 Testing V2U Node Factory Recognition");

const fs = require("fs");

// Test 1: Check if V2U nodes exist in the generated registry
const registryPath =
  "./features/business-logic-modern/infrastructure/node-creation/json-node-registry/generated/nodeRegistry.ts";
if (fs.existsSync(registryPath)) {
  const registryContent = fs.readFileSync(registryPath, "utf8");

  const v2uNodes = [
    "createTextV2U",
    "viewOutputV2U",
    "triggerOnToggleV2U",
    "testErrorV2U",
  ];
  console.log("📋 V2U Nodes in Generated Registry:");
  v2uNodes.forEach((nodeType) => {
    const found = registryContent.includes(`${nodeType}:`);
    console.log(`  - ${nodeType}: ${found ? "FOUND" : "MISSING"}`);
  });

  // Extract the export structure to understand the problem
  console.log("\n📁 Registry Export Structure:");
  const exportMatch = registryContent.match(
    /export const GENERATED_NODE_REGISTRY = \{([\s\S]*?)\} as const;/
  );
  if (exportMatch) {
    const registryKeys = exportMatch[1].match(/(\w+):/g);
    if (registryKeys) {
      console.log(
        "  Registry keys found:",
        registryKeys.map((k) => k.replace(":", "")).slice(0, 10)
      );
      console.log(`  Total keys: ${registryKeys.length}`);
    }
  }
} else {
  console.log("❌ Generated registry file not found!");
}

// Test 2: Check the NodeFactory import path and structure
const nodeFactoryPath =
  "./features/business-logic-modern/infrastructure/node-creation/factory/index.ts";
if (fs.existsSync(nodeFactoryPath)) {
  const factoryContent = fs.readFileSync(nodeFactoryPath, "utf8");
  console.log("\n🏭 NodeFactory Export:");
  const exportMatch = factoryContent.match(
    /export.*NodeFactory.*from.*['"](.*?)['"]/
  );
  if (exportMatch) {
    console.log(`  NodeFactory exported from: ${exportMatch[1]}`);
  }
} else {
  console.log("❌ NodeFactory index file not found!");
}

// Test 3: Check the integrated factory path
const integratedFactoryPath =
  "./features/business-logic-modern/infrastructure/node-creation/factory/utils/nodeFactoryIntegrated.ts";
if (fs.existsSync(integratedFactoryPath)) {
  const integratedContent = fs.readFileSync(integratedFactoryPath, "utf8");
  console.log("\n🔗 Integrated Factory Import:");
  const jsonFactoryImport = integratedContent.match(
    /import.*JsonNodeFactory.*from.*['"](.*?)['"]/
  );
  if (jsonFactoryImport) {
    console.log(`  JsonNodeFactory imported from: ${jsonFactoryImport[1]}`);
  }
} else {
  console.log("❌ Integrated factory file not found!");
}

console.log("\n🎯 Potential Issue:");
console.log(
  "  The NodeFactory might be using the wrong registry or import path"
);
console.log(
  "  Check if JsonNodeFactory is looking at the correct registry with V2U nodes"
);
