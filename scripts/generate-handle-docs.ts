/**
 * HANDLE SYSTEM DOCUMENTATION GENERATOR - Comprehensive handle system analysis
 *
 * • Analyzes handle specifications from all nodes
 * • Documents type mapping system and validation rules
 * • Generates handle type reference and usage guides
 * • Creates visual documentation with examples
 * • Tracks handle usage patterns and statistics
 *
 * Keywords: handle-documentation, type-system, validation-rules, connection-system, auto-generation
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface HandleSpec {
  id: string;
  dataType?: string;
  tsSymbol?: string;
  code?: string;
  position: "top" | "bottom" | "left" | "right";
  type: "source" | "target";
}

interface HandleTypeInfo {
  code: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  examples: string[];
  validationRules: string[];
}

interface NodeHandleAnalysis {
  nodeKind: string;
  nodeDisplayName: string;
  nodeCategory: string;
  handles: HandleSpec[];
  handleCount: number;
  inputCount: number;
  outputCount: number;
  typeUsage: Record<string, number>;
  positionUsage: Record<string, number>;
}

interface HandleSystemStats {
  totalHandles: number;
  totalNodes: number;
  typeDistribution: Record<string, number>;
  positionDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  validationErrors: string[];
  recommendations: string[];
}

// ============================================================================
// HANDLE TYPE DEFINITIONS
// ============================================================================

const HANDLE_TYPE_MAP: Record<string, HandleTypeInfo> = {
  // Legacy single-letter codes
  j: {
    code: "j",
    label: "JSON",
    description: "JavaScript Object Notation - flexible data structure",
    color: "var(--core-handle-types-json-color)",
    icon: "{}",
    examples: [
      "{text: 'Hello'}",
      "{data: [1,2,3]}",
      "{config: {enabled: true}}",
    ],
    validationRules: [
      "Must be valid JSON",
      "Accepts objects and arrays",
      "Type-safe validation",
    ],
  },
  s: {
    code: "s",
    label: "String",
    description: "Text data - UTF-8 encoded strings",
    color: "var(--core-handle-types-string-color)",
    icon: "T",
    examples: ["'Hello World'", "'JSON string'", "'User input'"],
    validationRules: [
      "Must be string type",
      "UTF-8 encoding",
      "No length limit",
    ],
  },
  n: {
    code: "n",
    label: "Number",
    description: "Numeric data - integers and floating point",
    color: "var(--core-handle-types-number-color)",
    icon: "#",
    examples: ["42", "3.14", "-1", "0"],
    validationRules: [
      "Must be numeric",
      "Supports integers and floats",
      "No NaN or Infinity",
    ],
  },
  b: {
    code: "b",
    label: "Boolean",
    description: "True/false values for control flow",
    color: "var(--core-handle-types-boolean-color)",
    icon: "✓",
    examples: ["true", "false"],
    validationRules: [
      "Must be boolean",
      "Only true/false values",
      "No type coercion",
    ],
  },
  a: {
    code: "a",
    label: "Array",
    description: "Ordered collection of values",
    color: "var(--core-handle-types-array-color)",
    icon: "[]",
    examples: ["[1,2,3]", "['a','b','c']", "[{id: 1}, {id: 2}]"],
    validationRules: [
      "Must be array type",
      "Ordered collection",
      "Heterogeneous elements allowed",
    ],
  },
  o: {
    code: "o",
    label: "Object",
    description: "Key-value pair collection",
    color: "var(--core-handle-types-object-color)",
    icon: "{}",
    examples: ["{id: 1, name: 'John'}", "{config: {enabled: true}}"],
    validationRules: [
      "Must be object type",
      "Key-value pairs",
      "No circular references",
    ],
  },
  x: {
    code: "x",
    label: "Any",
    description: "Unrestricted type - accepts any value",
    color: "var(--core-handle-types-any-color)",
    icon: "?",
    examples: ["Any value", "Mixed types", "Unknown data"],
    validationRules: ["Accepts any type", "No validation", "Use with caution"],
  },
  t: {
    code: "t",
    label: "Tools",
    description: "AI agent tool configurations and definitions",
    color: "var(--core-handle-types-tools-color)",
    icon: "🔧",
    examples: [
      "{webSearch: enabled}",
      "{database: {query: true}}",
      "{email: {send: true}}",
    ],
    validationRules: [
      "Must be tool configuration object",
      "Tool-specific validation",
      "AI agent compatible",
    ],
  },
};

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Scan all nodes for handle specifications
 */
function scanNodeHandles(): NodeHandleAnalysis[] {
  const nodeBasePath = path.join(
    process.cwd(),
    "features/business-logic-modern/node-domain"
  );
  const domains = [
    "create",
    "view",
    "trigger",
    "test",
    "cycle",
    "store",
    "custom",
  ];
  const analyses: NodeHandleAnalysis[] = [];

  domains.forEach((domain) => {
    const domainPath = path.join(nodeBasePath, domain);
    if (!fs.existsSync(domainPath)) {
      return;
    }

    const files = fs
      .readdirSync(domainPath)
      .filter((file) => file.endsWith(".node.tsx"))
      .map((file) => {
        const kind = file.replace(".node.tsx", "");
        return { kind, filePath: path.join(domainPath, file) };
      });

    files.forEach(({ kind, filePath }) => {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const analysis = analyzeNodeHandles(content, kind, domain);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (_error) {
        console.warn(`⚠️  Could not analyze handles for: ${filePath}`);
      }
    });
  });

  return analyses;
}

/**
 * Analyze handles in a single node file
 */
function analyzeNodeHandles(
  content: string,
  kind: string,
  _domain: string
): NodeHandleAnalysis | null {
  // Extract NodeSpec
  const specMatch = content.match(/const\s+spec:\s+NodeSpec\s*=\s*{([^}]+)}/);
  if (!specMatch) {
    return null;
  }

  const _specContent = specMatch[1];

  // Extract display name
  const displayNameMatch = content.match(/displayName:\s*["']([^"']+)["']/);
  const displayName = displayNameMatch ? displayNameMatch[1] : kind;

  // Extract category
  const categoryMatch = content.match(/category:\s*CATEGORIES\.([A-Z_]+)/);
  const category = categoryMatch ? categoryMatch[1] : "UNKNOWN";

  // Extract handles array
  const handlesMatch = content.match(/handles:\s*\[([\s\S]*?)\]/);
  if (!handlesMatch) {
    return null;
  }

  const handlesContent = handlesMatch[1];
  const handles = parseHandlesArray(handlesContent);

  // Analyze handle usage
  const typeUsage: Record<string, number> = {};
  const positionUsage: Record<string, number> = {};

  handles.forEach((handle) => {
    const type = handle.code || handle.dataType || "unknown";
    typeUsage[type] = (typeUsage[type] || 0) + 1;
    positionUsage[handle.position] = (positionUsage[handle.position] || 0) + 1;
  });

  return {
    nodeKind: kind,
    nodeDisplayName: displayName,
    nodeCategory: category,
    handles,
    handleCount: handles.length,
    inputCount: handles.filter((h) => h.type === "target").length,
    outputCount: handles.filter((h) => h.type === "source").length,
    typeUsage,
    positionUsage,
  };
}

/**
 * Parse handles array from NodeSpec
 */
function parseHandlesArray(handlesContent: string): HandleSpec[] {
  const handles: HandleSpec[] = [];
  const handleRegex = /{\s*([^}]+)\s*}/g;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: This is a valid pattern for regex.exec
  while ((match = handleRegex.exec(handlesContent)) !== null) {
    const handleContent = match[1];

    const idMatch = handleContent.match(/id:\s*["']([^"']+)["']/);
    const dataTypeMatch = handleContent.match(/dataType:\s*["']([^"']+)["']/);
    const tsSymbolMatch = handleContent.match(/tsSymbol:\s*["']([^"']+)["']/);
    const codeMatch = handleContent.match(/code:\s*["']([^"']+)["']/);
    const positionMatch = handleContent.match(/position:\s*["']([^"']+)["']/);
    const typeMatch = handleContent.match(/type:\s*["']([^"']+)["']/);

    if (idMatch && positionMatch && typeMatch) {
      handles.push({
        id: idMatch[1],
        dataType: dataTypeMatch ? dataTypeMatch[1] : undefined,
        tsSymbol: tsSymbolMatch ? tsSymbolMatch[1] : undefined,
        code: codeMatch ? codeMatch[1] : undefined,
        position: positionMatch[1] as "top" | "bottom" | "left" | "right",
        type: typeMatch[1] as "source" | "target",
      });
    }
  }

  return handles;
}

/**
 * Generate handle system statistics
 */
function generateHandleStats(
  analyses: NodeHandleAnalysis[]
): HandleSystemStats {
  const stats: HandleSystemStats = {
    totalHandles: 0,
    totalNodes: analyses.length,
    typeDistribution: {},
    positionDistribution: {},
    categoryDistribution: {},
    validationErrors: [],
    recommendations: [],
  };

  analyses.forEach((analysis) => {
    stats.totalHandles += analysis.handleCount;

    // Category distribution
    stats.categoryDistribution[analysis.nodeCategory] =
      (stats.categoryDistribution[analysis.nodeCategory] || 0) + 1;

    // Type distribution
    Object.entries(analysis.typeUsage).forEach(([type, count]) => {
      stats.typeDistribution[type] =
        (stats.typeDistribution[type] || 0) + count;
    });

    // Position distribution
    Object.entries(analysis.positionUsage).forEach(([position, count]) => {
      stats.positionDistribution[position] =
        (stats.positionDistribution[position] || 0) + count;
    });

    // Validation checks
    if (analysis.inputCount === 0) {
      stats.validationErrors.push(`${analysis.nodeKind}: No input handles`);
    }
    if (analysis.outputCount === 0) {
      stats.validationErrors.push(`${analysis.nodeKind}: No output handles`);
    }
    if (analysis.handles.some((h) => !(h.code || h.tsSymbol))) {
      stats.validationErrors.push(
        `${analysis.nodeKind}: Handle without type specification`
      );
    }
  });

  // Recommendations
  if (stats.totalHandles === 0) {
    stats.recommendations.push("No handles found - check node specifications");
  }
  if (Object.keys(stats.typeDistribution).length < 3) {
    stats.recommendations.push(
      "Limited type diversity - consider more handle types"
    );
  }
  if (stats.validationErrors.length > 0) {
    stats.recommendations.push("Fix validation errors for better type safety");
  }

  return stats;
}

// ============================================================================
// DOCUMENTATION GENERATION
// ============================================================================

/**
 * Generate comprehensive handle system documentation
 */
function generateHandleDocumentation() {
  const analyses = scanNodeHandles();
  const stats = generateHandleStats(analyses);

  // Generate documentation formats
  generateMarkdownDoc(analyses, stats);
  generateHTMLDoc(analyses, stats);
  generateTypeReferenceDoc(analyses, stats);
}

/**
 * Generate markdown documentation
 */
function generateMarkdownDoc(
  analyses: NodeHandleAnalysis[],
  stats: HandleSystemStats
) {
  const docsDir = path.join(process.cwd(), "documentation", "handles");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const markdown = `# Handle System Documentation

## Overview

The handle system provides type-safe connections between nodes with comprehensive validation and visual feedback.

## 📊 System Statistics

- **Total Nodes:** ${stats.totalNodes}
- **Total Handles:** ${stats.totalHandles}
- **Average Handles per Node:** ${(stats.totalHandles / stats.totalNodes).toFixed(1)}
- **Type Diversity:** ${Object.keys(stats.typeDistribution).length} types
- **Last Updated:** ${new Date().toLocaleString()}

## 🎯 Handle Types

| Code | Type | Description | Icon | Color |
|------|------|-------------|------|-------|
${Object.entries(HANDLE_TYPE_MAP)
  .map(
    ([code, info]) =>
      `| \`${code}\` | ${info.label} | ${info.description} | ${info.icon} | \`${info.color}\` |`
  )
  .join("\n")}

## 📍 Position Distribution

${Object.entries(stats.positionDistribution)
  .map(
    ([position, count]) =>
      `- **${position.toUpperCase()}**: ${count} handles (${((count / stats.totalHandles) * 100).toFixed(1)}%)`
  )
  .join("\n")}

## 🏷️ Type Distribution

${Object.entries(stats.typeDistribution)
  .map(
    ([type, count]) =>
      `- **${HANDLE_TYPE_MAP[type]?.label || type}**: ${count} handles (${((count / stats.totalHandles) * 100).toFixed(1)}%)`
  )
  .join("\n")}

## 🏗️ Node Handle Analysis

${analyses
  .map(
    (analysis) => `
### ${analysis.nodeDisplayName}

- **Node Type:** \`${analysis.nodeKind}\`
- **Category:** ${analysis.nodeCategory}
- **Total Handles:** ${analysis.handleCount}
- **Inputs:** ${analysis.inputCount}
- **output:** ${analysis.outputCount}

#### Handle Specifications

${analysis.handles
  .map(
    (handle) => `- **${handle.id}** (${handle.type}) [${handle.position}]
  - Type: ${handle.code || handle.tsSymbol || "unspecified"}
  - Code: \`${handle.code || "none"}\`
  - TS Symbol: \`${handle.tsSymbol || "none"}\``
  )
  .join("\n")}
`
  )
  .join("\n")}

## ⚠️ Validation Issues

${
  stats.validationErrors.length > 0
    ? stats.validationErrors.map((error) => `- ❌ ${error}`).join("\n")
    : "- ✅ No validation issues found"
}

## 💡 Recommendations

${stats.recommendations.map((rec) => `- 💡 ${rec}`).join("\n")}

## 🔧 Usage Examples

### Basic Handle Specification

\`\`\`typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    { id: "input", code: "j", position: "top", type: "target" },
    { id: "output", code: "s", position: "right", type: "source" },
    { id: "input", code: "b", position: "left", type: "target" },
  ],
};
\`\`\`

### Type-Safe Handles with TS Symbols

\`\`\`typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    { id: "data", tsSymbol: "CreateTextOutput", position: "right", type: "source" },
    { id: "trigger", code: "b", position: "left", type: "target" },
  ],
};
\`\`\`

## 🎨 Visual Design

### Handle Styling

- **Size:** 10px diameter
- **Position Offset:** 7.5px from node edge
- **Spacing:** 7.5px between handles on same side
- **Z-Index:** 30 (above node content)

### Type Colors

${Object.entries(HANDLE_TYPE_MAP)
  .map(
    ([_code, info]) => `- **${info.label}**: \`${info.color}\` (${info.icon})`
  )
  .join("\n")}

### Connection Validation

- ✅ **Type Compatibility**: Automatic validation prevents incompatible connections
- ✅ **Visual Feedback**: Toast notifications for connection errors
- ✅ **Debounced Alerts**: 2-second debounce to prevent spam
- ✅ **User-Friendly Messages**: Clear error descriptions

---

*This documentation is automatically generated from node specifications.*
`;

  const markdownPath = path.join(docsDir, "HANDLE_SYSTEM.md");
  fs.writeFileSync(markdownPath, markdown);
}

/**
 * Generate HTML documentation
 */
function generateHTMLDoc(
  analyses: NodeHandleAnalysis[],
  stats: HandleSystemStats
) {
  const docsDir = path.join(process.cwd(), "documentation", "handles");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Handle System Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 20px; text-align: center; }
        .stat-card h3 { margin-top: 0; color: #1976d2; }
        .stat-value { font-size: 2em; font-weight: bold; color: #0d47a1; }
        .type-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
        .type-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; }
        .type-card h4 { margin-top: 0; color: #495057; }
        .type-icon { font-size: 1.5em; margin-right: 10px; }
        .node-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin: 20px 0; }
        .node-card { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; }
        .node-card h3 { margin-top: 0; color: #856404; }
        .handle-list { list-style: none; padding: 0; }
        .handle-item { background: white; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .handle-item strong { color: #495057; }
        .handle-item .type { color: #6c757d; font-size: 0.9em; }
        .validation-errors { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .validation-errors h3 { color: #721c24; margin-top: 0; }
        .recommendations { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .recommendations h3 { color: #0c5460; margin-top: 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Handle System Documentation</h1>
            <p>Type-safe connections with comprehensive validation and visual feedback</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>System Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Nodes</h3>
                        <div class="stat-value">${stats.totalNodes}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Handles</h3>
                        <div class="stat-value">${stats.totalHandles}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Avg Handles/Node</h3>
                        <div class="stat-value">${(stats.totalHandles / stats.totalNodes).toFixed(1)}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Type Diversity</h3>
                        <div class="stat-value">${Object.keys(stats.typeDistribution).length}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Handle Types</h2>
                <div class="type-grid">
                    ${Object.entries(HANDLE_TYPE_MAP)
                      .map(
                        ([code, info]) => `
                    <div class="type-card">
                        <h4><span class="type-icon">${info.icon}</span>${info.label}</h4>
                        <p><strong>Code:</strong> <code>${code}</code></p>
                        <p><strong>Description:</strong> ${info.description}</p>
                        <p><strong>Color:</strong> <code>${info.color}</code></p>
                        <p><strong>Examples:</strong></p>
                        <ul>
                            ${info.examples.map((ex) => `<li><code>${ex}</code></li>`).join("")}
                        </ul>
                    </div>
                    `
                      )
                      .join("")}
                </div>
            </div>

            <div class="section">
                <h2>Node Handle Analysis</h2>
                <div class="node-grid">
                    ${analyses
                      .map(
                        (analysis) => `
                    <div class="node-card">
                        <h3>${analysis.nodeDisplayName}</h3>
                        <p><strong>Node Type:</strong> <code>${analysis.nodeKind}</code></p>
                        <p><strong>Category:</strong> ${analysis.nodeCategory}</p>
                        <p><strong>Total Handles:</strong> ${analysis.handleCount}</p>
                        <p><strong>Inputs:</strong> ${analysis.inputCount} | <strong>output:</strong> ${analysis.outputCount}</p>

                        <h4>Handle Specifications</h4>
                        <ul class="handle-list">
                            ${analysis.handles
                              .map(
                                (handle) => `
                            <li class="handle-item">
                                <strong>${handle.id}</strong> <span class="type">(${handle.type}) [${handle.position}]</span><br>
                                <small>Type: ${handle.code || handle.tsSymbol || "unspecified"}</small>
                            </li>
                            `
                              )
                              .join("")}
                        </ul>
                    </div>
                    `
                      )
                      .join("")}
                </div>
            </div>

            ${
              stats.validationErrors.length > 0
                ? `
            <div class="validation-errors">
                <h3>⚠️ Validation Issues</h3>
                <ul>
                    ${stats.validationErrors.map((error) => `<li>❌ ${error}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }

            ${
              stats.recommendations.length > 0
                ? `
            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                    ${stats.recommendations.map((rec) => `<li>💡 ${rec}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }
        </div>
    </div>
</body>
</html>`;

  const htmlPath = path.join(docsDir, "handle-system.html");
  fs.writeFileSync(htmlPath, htmlContent);
}

/**
 * Generate type reference documentation
 */
function generateTypeReferenceDoc(
  _analyses: NodeHandleAnalysis[],
  stats: HandleSystemStats
) {
  const docsDir = path.join(process.cwd(), "documentation", "handles");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const reference = `# Handle Type Reference

## Quick Reference

| Code | Type | Use Case | Validation |
|------|------|----------|------------|
${Object.entries(HANDLE_TYPE_MAP)
  .map(
    ([code, info]) =>
      `| \`${code}\` | ${info.label} | ${info.description} | ${info.validationRules.join(", ")} |`
  )
  .join("\n")}

## Type Compatibility Matrix

| Source \\ Target | JSON | String | Number | Boolean | Array | Object | Any |
|------------------|------|--------|--------|---------|-------|--------|-----|
${Object.keys(HANDLE_TYPE_MAP)
  .map((sourceType) => {
    const source = HANDLE_TYPE_MAP[sourceType];
    return `| **${source.label}** | ${Object.keys(HANDLE_TYPE_MAP)
      .map((targetType) => {
        const _target = HANDLE_TYPE_MAP[targetType];
        const compatible = isTypeCompatible(sourceType, targetType);
        return compatible ? "✅" : "❌";
      })
      .join(" | ")} |`;
  })
  .join("\n")}

## Usage Patterns

### Most Common Handle Combinations

${Object.entries(stats.typeDistribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(
    ([type, count]) =>
      `- **${HANDLE_TYPE_MAP[type]?.label || type}**: ${count} uses`
  )
  .join("\n")}

### Position Preferences

${Object.entries(stats.positionDistribution)
  .sort(([, a], [, b]) => b - a)
  .map(
    ([position, count]) =>
      `- **${position.toUpperCase()}**: ${count} handles (${((count / stats.totalHandles) * 100).toFixed(1)}%)`
  )
  .join("\n")}

## Best Practices

### 1. Type Safety
- ✅ Use \`tsSymbol\` for type-safe connections
- ✅ Provide fallback \`code\` when using \`tsSymbol\`
- ✅ Validate handle types in your node logic

### 2. Handle Positioning
- ✅ Place inputs on top/left
- ✅ Place output on right/bottom
- ✅ Use consistent positioning across similar nodes

### 3. Type Selection
- ✅ Use specific types when possible (avoid 'any')
- ✅ Consider data flow when choosing types
- ✅ Document type expectations in node descriptions

### 4. Validation
- ✅ Test handle connections during development
- ✅ Handle type mismatches gracefully
- ✅ Provide clear error messages for users

## Examples

### Basic Input/Output Pattern
\`\`\`typescript
handles: [
  { id: "input", code: "j", position: "top", type: "target" },
  { id: "output", code: "s", position: "right", type: "source" },
]
\`\`\`

### Control Flow Pattern
\`\`\`typescript
handles: [
  { id: "trigger", code: "b", position: "left", type: "target" },
  { id: "data", code: "j", position: "top", type: "target" },
  { id: "result", code: "s", position: "right", type: "source" },
]
\`\`\`

### Type-Safe Pattern
\`\`\`typescript
handles: [
  { id: "input", tsSymbol: "InputType", code: "j", position: "top", type: "target" },
  { id: "output", tsSymbol: "OutputType", code: "s", position: "right", type: "source" },
]
\`\`\`

---

*Generated from ${stats.totalNodes} nodes with ${stats.totalHandles} handles*
`;

  const referencePath = path.join(docsDir, "TYPE_REFERENCE.md");
  fs.writeFileSync(referencePath, reference);
}

/**
 * Check type compatibility
 */
function isTypeCompatible(sourceType: string, targetType: string): boolean {
  // Any type can connect to any type
  if (sourceType === "x" || targetType === "x") {
    return true;
  }

  // Same types are compatible
  if (sourceType === targetType) {
    return true;
  }

  // JSON can connect to most types
  if (sourceType === "j") {
    return ["s", "n", "b", "a", "o"].includes(targetType);
  }

  // String can connect to string
  if (sourceType === "s" && targetType === "s") {
    return true;
  }

  // Number can connect to number
  if (sourceType === "n" && targetType === "n") {
    return true;
  }

  // Boolean can connect to boolean
  if (sourceType === "b" && targetType === "b") {
    return true;
  }

  // Array can connect to array
  if (sourceType === "a" && targetType === "a") {
    return true;
  }

  // Object can connect to object
  if (sourceType === "o" && targetType === "o") {
    return true;
  }

  return false;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
  generateHandleDocumentation();
}

export { generateHandleDocumentation };
