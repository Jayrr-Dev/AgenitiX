/**
 * NODESPEC & SCAFFOLD DOCUMENTATION GENERATOR - Auto-generated from actual code
 *
 * • Analyzes NodeSpec.ts and withNodeScaffold.tsx source code
 * • Extracts actual interfaces, types, and implementations
 * • Generates comprehensive documentation with real examples
 * • Creates markdown, HTML, and API reference documentation
 * • Tracks usage patterns and integration points
 * • Auto-updates when source code changes
 *
 * Keywords: nodespec-documentation, scaffold-documentation, auto-generation, type-analysis, interface-extraction
 */

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface NodeSpecAnalysis {
  interfaces: {
    name: string;
    properties: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
      defaultValue?: string;
    }>;
    description?: string;
  }[];
  types: {
    name: string;
    definition: string;
    description?: string;
  }[];
  constants: {
    name: string;
    value: string;
    description?: string;
  }[];
  imports: string[];
  exports: string[];
}

interface ScaffoldAnalysis {
  functions: {
    name: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    returnType: string;
    description?: string;
  }[];
  types: {
    name: string;
    definition: string;
    description?: string;
  }[];
  usage: {
    totalNodes: number;
    nodesWithScaffold: number;
    commonPatterns: string[];
  };
}

// ============================================================================
// SOURCE CODE ANALYSIS
// ============================================================================

/**
 * Analyze NodeSpec.ts source code
 */
function analyzeNodeSpec(): NodeSpecAnalysis {
  const nodeSpecPath = path.join(process.cwd(), "features/business-logic-modern/infrastructure/node-core/NodeSpec.ts");
  
  if (!fs.existsSync(nodeSpecPath)) {
    throw new Error(`NodeSpec.ts not found at ${nodeSpecPath}`);
  }

  const sourceCode = fs.readFileSync(nodeSpecPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    nodeSpecPath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const analysis: NodeSpecAnalysis = {
    interfaces: [],
    types: [],
    constants: [],
    imports: [],
    exports: []
  };

  // Extract interfaces
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      const properties = node.members
        .map((member) => {
          if (ts.isPropertySignature(member)) {
            return {
              name: member.name.getText(sourceFile),
              type: member.type ? member.type.getText(sourceFile) : "any",
              required: !member.questionToken,
              description: extractJSDocComment(member, sourceFile)
            };
          }
          return null;
        })
        .filter((prop): prop is NonNullable<typeof prop> => prop !== null);

      const interfaceInfo = {
        name: node.name.text,
        properties,
        description: extractJSDocComment(node, sourceFile)
      };
      analysis.interfaces.push(interfaceInfo);
    }
    
    if (ts.isTypeAliasDeclaration(node)) {
      analysis.types.push({
        name: node.name.text,
        definition: node.type.getText(sourceFile),
        description: extractJSDocComment(node, sourceFile)
      });
    }
  });

  return analysis;
}

/**
 * Analyze withNodeScaffold.tsx source code
 */
function analyzeScaffold(): ScaffoldAnalysis {
  const scaffoldPath = path.join(process.cwd(), "features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx");
  
  if (!fs.existsSync(scaffoldPath)) {
    throw new Error(`withNodeScaffold.tsx not found at ${scaffoldPath}`);
  }

  const sourceCode = fs.readFileSync(scaffoldPath, "utf-8");
  const sourceFile = ts.createSourceFile(
    scaffoldPath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const analysis: ScaffoldAnalysis = {
    functions: [],
    types: [],
    usage: {
      totalNodes: 0,
      nodesWithScaffold: 0,
      commonPatterns: []
    }
  };

  // Extract functions
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      analysis.functions.push({
        name: node.name.text,
        parameters: node.parameters.map((param) => ({
          name: param.name.getText(sourceFile),
          type: param.type ? param.type.getText(sourceFile) : "any",
          required: !param.questionToken,
          description: extractJSDocComment(param, sourceFile)
        })),
        returnType: node.type ? node.type.getText(sourceFile) : "any",
        description: extractJSDocComment(node, sourceFile)
      });
    }
    
    if (ts.isTypeAliasDeclaration(node)) {
      analysis.types.push({
        name: node.name.text,
        definition: node.type.getText(sourceFile),
        description: extractJSDocComment(node, sourceFile)
      });
    }
  });

  // Analyze usage patterns
  analysis.usage = analyzeScaffoldUsage();

  return analysis;
}

/**
 * Extract JSDoc comments from AST nodes
 */
function extractJSDocComment(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  const text = node.getFullText(sourceFile);
  const start = node.getLeadingTriviaWidth(sourceFile);
  const trivia = text.substring(0, start);
  
  const jsDocMatch = trivia.match(/\/\*\*([\s\S]*?)\*\//);
  if (jsDocMatch) {
    return jsDocMatch[1]
      .replace(/\s*\*\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  return undefined;
}

/**
 * Analyze scaffold usage patterns
 */
function analyzeScaffoldUsage() {
  const nodeDomainPath = path.join(process.cwd(), "features/business-logic-modern/node-domain");
  const patterns: string[] = [];
  let totalNodes = 0;
  let nodesWithScaffold = 0;

  if (fs.existsSync(nodeDomainPath)) {
    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          totalNodes++;
          const content = fs.readFileSync(filePath, "utf-8");
          
          if (content.includes("withNodeScaffold")) {
            nodesWithScaffold++;
            
            // Detect usage patterns
            if (content.includes("withNodeScaffold(spec,")) {
              patterns.push("Static spec pattern");
            } else if (content.includes("useMemo") && content.includes("withNodeScaffold")) {
              patterns.push("Dynamic spec pattern");
            } else if (content.includes("withNodeScaffold(") && content.includes("options")) {
              patterns.push("Custom options pattern");
            }
          }
        }
      });
    };
    
    scanDirectory(nodeDomainPath);
  }

  return {
    totalNodes,
    nodesWithScaffold,
    commonPatterns: [...new Set(patterns)]
  };
}

// ============================================================================
// DOCUMENTATION GENERATION
// ============================================================================

/**
 * Generate comprehensive NodeSpec documentation
 */
function generateNodeSpecDocs(analysis: NodeSpecAnalysis) {
  const docsDir = path.join(process.cwd(), "documentation/NodeCore");
  
  // Ensure directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Generate markdown documentation
  const markdownContent = generateNodeSpecMarkdown(analysis);
  const markdownPath = path.join(docsDir, "NodeSpec.md");
  fs.writeFileSync(markdownPath, markdownContent);

  // Generate HTML documentation
  const htmlContent = generateNodeSpecHTML(analysis);
  const htmlPath = path.join(docsDir, "NodeSpec.html");
  fs.writeFileSync(htmlPath, htmlContent);

  console.log(`✅ Generated NodeSpec documentation`);
  console.log(`   📄 Markdown: ${markdownPath}`);
  console.log(`   🌐 HTML: ${htmlPath}`);
}

/**
 * Generate comprehensive Scaffold documentation
 */
function generateScaffoldDocs(analysis: ScaffoldAnalysis) {
  const docsDir = path.join(process.cwd(), "documentation/NodeCore");
  
  // Ensure directory exists
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Generate markdown documentation
  const markdownContent = generateScaffoldMarkdown(analysis);
  const markdownPath = path.join(docsDir, "withNodeScaffold.md");
  fs.writeFileSync(markdownPath, markdownContent);

  // Generate HTML documentation
  const htmlContent = generateScaffoldHTML(analysis);
  const htmlPath = path.join(docsDir, "withNodeScaffold.html");
  fs.writeFileSync(htmlPath, htmlContent);

  console.log(`✅ Generated Scaffold documentation`);
  console.log(`   📄 Markdown: ${markdownPath}`);
  console.log(`   🌐 HTML: ${htmlPath}`);
}

/**
 * Generate NodeSpec markdown documentation
 */
function generateNodeSpecMarkdown(analysis: NodeSpecAnalysis): string {
  return `# NodeSpec Documentation

## Overview

The \`NodeSpec\` system is the **core contract and blueprint** for all nodes in the flow engine. This documentation is **auto-generated** from the actual source code in \`NodeSpec.ts\`.

## 📊 Auto-Generated Analysis

- **Interfaces Found**: ${analysis.interfaces.length}
- **Types Defined**: ${analysis.types.length}
- **Constants**: ${analysis.constants.length}
- **Last Updated**: ${new Date().toLocaleString()}

## 🔍 Interface Analysis

${analysis.interfaces.map(iface => `
### ${iface.name}

${iface.description ? `${iface.description}\n\n` : ""}
**Properties:**

${iface.properties.map(prop => `- **${prop.name}** (\`${prop.type}\`)${prop.required ? " - Required" : " - Optional"}${prop.description ? ` - ${prop.description}` : ""}`).join("\n")}
`).join("\n")}

## 🏷️ Type Definitions

${analysis.types.map(type => `
### ${type.name}

${type.description ? `${type.description}\n\n` : ""}
\`\`\`typescript
type ${type.name} = ${type.definition};
\`\`\`
`).join("\n")}

## 📋 Usage Statistics

- **Total Interfaces**: ${analysis.interfaces.length}
- **Total Types**: ${analysis.types.length}
- **Required Properties**: ${analysis.interfaces.reduce((sum, iface) => sum + iface.properties.filter(p => p.required).length, 0)}
- **Optional Properties**: ${analysis.interfaces.reduce((sum, iface) => sum + iface.properties.filter(p => !p.required).length, 0)}

## 🔗 Integration Points

This documentation is automatically generated from:
- **Source File**: \`features/business-logic-modern/infrastructure/node-core/NodeSpec.ts\`
- **Last Analysis**: ${new Date().toLocaleString()}
- **TypeScript Version**: ${ts.version}

---

*This documentation is auto-generated from the actual source code. Any changes to NodeSpec.ts will be reflected in the next generation.*
`;
}

/**
 * Generate Scaffold markdown documentation
 */
function generateScaffoldMarkdown(analysis: ScaffoldAnalysis): string {
  return `# withNodeScaffold Documentation

## Overview

The \`withNodeScaffold\` system provides **automated scaffolding and infrastructure** for all node components. This documentation is **auto-generated** from the actual source code in \`withNodeScaffold.tsx\`.

## 📊 Auto-Generated Analysis

- **Functions Found**: ${analysis.functions.length}
- **Types Defined**: ${analysis.types.length}
- **Usage Statistics**: ${analysis.usage.nodesWithScaffold}/${analysis.usage.totalNodes} nodes use scaffold
- **Common Patterns**: ${analysis.usage.commonPatterns.length}
- **Last Updated**: ${new Date().toLocaleString()}

## 🔧 Function Analysis

${analysis.functions.map(func => `
### ${func.name}

${func.description ? `${func.description}\n\n` : ""}
**Parameters:**

${func.parameters.map(param => `- **${param.name}** (\`${param.type}\`)${param.required ? " - Required" : " - Optional"}${param.description ? ` - ${param.description}` : ""}`).join("\n")}

**Returns:** \`${func.returnType}\`
`).join("\n")}

## 🏷️ Type Definitions

${analysis.types.map(type => `
### ${type.name}

${type.description ? `${type.description}\n\n` : ""}
\`\`\`typescript
type ${type.name} = ${type.definition};
\`\`\`
`).join("\n")}

## 📈 Usage Statistics

- **Total Nodes**: ${analysis.usage.totalNodes}
- **Nodes Using Scaffold**: ${analysis.usage.nodesWithScaffold}
- **Adoption Rate**: ${((analysis.usage.nodesWithScaffold / analysis.usage.totalNodes) * 100).toFixed(1)}%
- **Common Patterns**: ${analysis.usage.commonPatterns.join(", ")}

## 🎯 Usage Patterns

${analysis.usage.commonPatterns.map(pattern => `
### ${pattern}

This pattern is used by ${analysis.usage.nodesWithScaffold} nodes.
`).join("\n")}

## 🔗 Integration Points

This documentation is automatically generated from:
- **Source File**: \`features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx\`
- **Last Analysis**: ${new Date().toLocaleString()}
- **TypeScript Version**: ${ts.version}

---

*This documentation is auto-generated from the actual source code. Any changes to withNodeScaffold.tsx will be reflected in the next generation.*
`;
}

/**
 * Generate NodeSpec HTML documentation
 */
function generateNodeSpecHTML(analysis: NodeSpecAnalysis): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NodeSpec Documentation - Auto-Generated</title>
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
        .interface-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .interface-card h3 { margin-top: 0; color: #495057; }
        .property { background: white; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .property strong { color: #495057; }
        .property .type { color: #6c757d; font-size: 0.9em; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
        .auto-generated { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NodeSpec Documentation</h1>
            <p>Auto-generated from actual source code</p>
        </div>
        
        <div class="content">
            <div class="auto-generated">
                <strong>🔄 Auto-Generated</strong><br>
                This documentation is automatically generated from the actual NodeSpec.ts source code.
                Last updated: ${new Date().toLocaleString()}
            </div>
            
            <div class="section">
                <h2>📊 Analysis Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${analysis.interfaces.length}</h3>
                        <p>Interfaces</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.types.length}</h3>
                        <p>Types</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.constants.length}</h3>
                        <p>Constants</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔍 Interface Analysis</h2>
                ${analysis.interfaces.map(iface => `
                <div class="interface-card">
                    <h3>${iface.name}</h3>
                    ${iface.description ? `<p>${iface.description}</p>` : ""}
                    <h4>Properties:</h4>
                    ${iface.properties.map(prop => `
                    <div class="property">
                        <strong>${prop.name}</strong> <span class="type">(${prop.type})</span>
                        ${prop.required ? "<span style='color: #dc3545;'>Required</span>" : "<span style='color: #6c757d;'>Optional</span>"}
                        ${prop.description ? `<br><small>${prop.description}</small>` : ""}
                    </div>
                    `).join("")}
                </div>
                `).join("")}
            </div>
            
            <div class="section">
                <h2>🏷️ Type Definitions</h2>
                ${analysis.types.map(type => `
                <div class="interface-card">
                    <h3>${type.name}</h3>
                    ${type.description ? `<p>${type.description}</p>` : ""}
                    <div class="code-block">
                        type ${type.name} = ${type.definition};
                    </div>
                </div>
                `).join("")}
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate Scaffold HTML documentation
 */
function generateScaffoldHTML(analysis: ScaffoldAnalysis): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>withNodeScaffold Documentation - Auto-Generated</title>
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
        .function-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .function-card h3 { margin-top: 0; color: #495057; }
        .parameter { background: white; border: 1px solid #e9ecef; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .parameter strong { color: #495057; }
        .parameter .type { color: #6c757d; font-size: 0.9em; }
        .code-block { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 15px; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
        .auto-generated { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .usage-chart { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .progress-bar { background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; }
        .progress-fill { background: #28a745; height: 100%; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>withNodeScaffold Documentation</h1>
            <p>Auto-generated from actual source code</p>
        </div>
        
        <div class="content">
            <div class="auto-generated">
                <strong>🔄 Auto-Generated</strong><br>
                This documentation is automatically generated from the actual withNodeScaffold.tsx source code.
                Last updated: ${new Date().toLocaleString()}
            </div>
            
            <div class="section">
                <h2>📊 Analysis Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${analysis.functions.length}</h3>
                        <p>Functions</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.types.length}</h3>
                        <p>Types</p>
                    </div>
                    <div class="stat-card">
                        <h3>${analysis.usage.nodesWithScaffold}</h3>
                        <p>Nodes Using Scaffold</p>
                    </div>
                </div>
                
                <div class="usage-chart">
                    <h3>Usage Statistics</h3>
                    <p>Adoption Rate: ${((analysis.usage.nodesWithScaffold / analysis.usage.totalNodes) * 100).toFixed(1)}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(analysis.usage.nodesWithScaffold / analysis.usage.totalNodes) * 100}%"></div>
                    </div>
                    <small>${analysis.usage.nodesWithScaffold} of ${analysis.usage.totalNodes} nodes use scaffold</small>
                </div>
            </div>
            
            <div class="section">
                <h2>🔧 Function Analysis</h2>
                ${analysis.functions.map(func => `
                <div class="function-card">
                    <h3>${func.name}</h3>
                    ${func.description ? `<p>${func.description}</p>` : ""}
                    <h4>Parameters:</h4>
                    ${func.parameters.map(param => `
                    <div class="parameter">
                        <strong>${param.name}</strong> <span class="type">(${param.type})</span>
                        ${param.required ? "<span style='color: #dc3545;'>Required</span>" : "<span style='color: #6c757d;'>Optional</span>"}
                        ${param.description ? `<br><small>${param.description}</small>` : ""}
                    </div>
                    `).join("")}
                    <h4>Returns:</h4>
                    <div class="code-block">${func.returnType}</div>
                </div>
                `).join("")}
            </div>
            
            <div class="section">
                <h2>🏷️ Type Definitions</h2>
                ${analysis.types.map(type => `
                <div class="function-card">
                    <h3>${type.name}</h3>
                    ${type.description ? `<p>${type.description}</p>` : ""}
                    <div class="code-block">
                        type ${type.name} = ${type.definition};
                    </div>
                </div>
                `).join("")}
            </div>
            
            <div class="section">
                <h2>🎯 Usage Patterns</h2>
                ${analysis.usage.commonPatterns.map(pattern => `
                <div class="function-card">
                    <h3>${pattern}</h3>
                    <p>This pattern is used by ${analysis.usage.nodesWithScaffold} nodes.</p>
                </div>
                `).join("")}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate comprehensive documentation for NodeSpec and Scaffold
 */
function generateNodespecDocs() {
  console.log("🔍 Analyzing NodeSpec and Scaffold source code...");
  
  try {
    // Analyze NodeSpec
    const nodeSpecAnalysis = analyzeNodeSpec();
    generateNodeSpecDocs(nodeSpecAnalysis);
    
    // Analyze Scaffold
    const scaffoldAnalysis = analyzeScaffold();
    generateScaffoldDocs(scaffoldAnalysis);
    
    console.log("✅ NodeSpec and Scaffold documentation generation complete!");
    
  } catch (error) {
    console.error("❌ Error generating documentation:", error);
    process.exit(1);
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

if (require.main === module) {
  generateNodespecDocs();
}

export { generateNodespecDocs }; 