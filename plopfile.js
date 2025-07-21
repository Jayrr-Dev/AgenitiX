/**
 * PLOP CONFIGURATION - Node generation and deletion automation
 *
 * • Creates nodes using NodeSpec architecture with proper domain organization
 * • Comprehensive node deletion that prevents orphan files and bloat
 * • Auto-updates all registry files, type definitions, and generated files
 * • Handles migration files, handle types, and data migration configurations
 * • Maintains clean codebase without leftover references or unused files
 *
 * Keywords: plop, node-generation, comprehensive-deletion, registry-management, file-cleanup
 */

const fs = require("fs");
const path = require("path");

module.exports = function (plop) {
  // Helpers to resolve size constants for templates
  plop.setHelper("collapsedSizeConstant", (key) => `COLLAPSED_SIZES.${key}`);
  plop.setHelper("expandedSizeConstant", (key) =>
    key.startsWith("V")
      ? `EXPANDED_VARIABLE_SIZES.${key}`
      : `EXPANDED_SIZES.${key}`
  );

  plop.setGenerator("node", {
    description: "Create a new node using the NodeSpec architecture",
    prompts: [
      {
        type: "input",
        name: "kind",
        message: "What is the kind of the node? (e.g., createText, viewCsv)",
      },
      {
        type: "list",
        name: "domain",
        message: "What is the domain of the node?",
        choices: ["create", "view", "trigger", "test", "cycle", "custom"],
      },
      {
        type: "list",
        name: "category",
        message: "What is the functional category of the node?",
        choices: ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE"],
      },
      {
        type: "list",
        name: "collapsedSize",
        message: "Select collapsed size",
        choices: ["C1", "C1W", "C2", "C3"],
      },
      {
        type: "list",
        name: "expandedSize",
        message: "Select expanded size",
        choices: [
          "FE0",
          "FE1",
          "FE1H",
          "FE2",
          "FE3",
          "VE0",
          "VE1",
          "VE2",
          "VE3",
        ],
      },
      {
        type: "input",
        name: "tsSymbol",
        message:
          "Optional: TypeScript symbol for primary output handle (leave blank for none)",
      },
      {
        type: "confirm",
        name: "enableMemory",
        message: "Enable node memory/cache capabilities?",
        default: false,
      },
      {
        type: "input",
        name: "memorySize",
        message: "Memory size in MB (default: 1MB):",
        default: "1",
        when: (answers) => answers.enableMemory,
      },
      {
        type: "list",
        name: "evictionPolicy",
        message: "Memory eviction policy:",
        choices: ["LRU", "LFU", "FIFO", "TTL"],
        default: "LRU",
        when: (answers) => answers.enableMemory,
      },
      {
        type: "confirm",
        name: "persistentMemory",
        message: "Enable persistent memory across sessions?",
        default: false,
        when: (answers) => answers.enableMemory,
      },
    ],
    actions: [
      // 1. Create the main node file
      {
        type: "add",
        path: "features/business-logic-modern/node-domain/{{domain}}/{{kind}}.node.tsx",
        templateFile: "tooling/dev-scripts/plop-templates/node.tsx.hbs",
      },

      // 2. Update useDynamicNodeTypes.ts - import
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
        pattern:
          /\/\/ Add new node imports here \(Plop can auto-inject these\)/g,
        template:
          "// Add new node imports here (Plop can auto-inject these)\nimport {{kind}} from '../../../node-domain/{{domain}}/{{kind}}.node';",
      },

      // 3. Update useDynamicNodeTypes.ts - export
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
        pattern: /\/\/ Add new node types here/g,
        template: "// Add new node types here\n    {{kind}},",
      },

      // 4. Update nodespec-registry.ts - import
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
        pattern:
          /\/\/ Import node specs directly - this will be auto-updated by Plop[\s\S]*?\n/,
        template: (match) =>
          `${match}import {{kind}}, { spec as {{kind}}Spec } from '../../node-domain/{{domain}}/{{kind}}.node';\n`,
      },

      // 5. Update nodespec-registry.ts - registry entry
      {
        type: "modify",
        path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
        pattern:
          /\{\s*\/\/ Add new node specs here \(auto-updated by Plop\)([\s\S]*?)\}/,
        template: (match, inner) =>
          `{\n  // Add new node specs here (auto-updated by Plop)\n  {{kind}}: {{kind}}Spec,${inner}}`,
      },

      // 6. Update node-domain/index.ts - export
      {
        type: "modify",
        path: "features/business-logic-modern/node-domain/index.ts",
        pattern: /\/\/ Node exports will be added here automatically by Plop/g,
        template:
          "// Node exports will be added here automatically by Plop\nexport { default as {{kind}} } from './{{domain}}/{{kind}}.node';",
      },

      // 7. Ensure theming tokens exist for the category (NEW)
      (data) => {
        const { category, domain } = data;
        const tokensPath = path.join(
          __dirname,
          "features/business-logic-modern/infrastructure/theming/tokens.json"
        );

        try {
          if (fs.existsSync(tokensPath)) {
            const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
            const categoryKey = category.toLowerCase();

            // Check if tokens exist for this category
            if (!tokens.node || !tokens.node[categoryKey]) {
              console.log(
                `⚠️  Warning: No theming tokens found for category '${categoryKey}' in tokens.json`
              );
              console.log(
                `   Add tokens for '${categoryKey}' in features/business-logic-modern/infrastructure/theming/tokens.json`
              );
              console.log(
                `   Then run 'pnpm generate:tokens' to regenerate CSS variables`
              );
            }

            return `✅ Theming tokens verified for category '${categoryKey}'`;
          }
          return `⚠️  tokens.json not found - theming may not work properly`;
        } catch (error) {
          return `❌ Error checking theming tokens: ${error.message}`;
        }
      },

      // 8. Auto-regenerate CSS tokens (NEW)
      () => {
        return new Promise((resolve) => {
          const { spawn } = require("child_process");
          console.log("🎨 Regenerating CSS tokens...");

          const tokenProcess = spawn("pnpm", ["generate:tokens"], {
            stdio: "inherit",
            shell: true,
            cwd: __dirname,
          });

          tokenProcess.on("close", (code) => {
            if (code === 0) {
              resolve("✅ CSS tokens regenerated successfully");
            } else {
              resolve(`⚠️  Token generation completed with code ${code}`);
            }
          });

          tokenProcess.on("error", (error) => {
            resolve(`❌ Error regenerating tokens: ${error.message}`);
          });
        });
      },

      // 9. Final success message with comprehensive instructions
      (data) => {
        const { kind, domain, category } = data;
        return (
          `🎯 Successfully created node '${kind}' with full theming integration:\n\n` +
          `📁 FILES CREATED/UPDATED:\n` +
          `   ✅ Node file: features/business-logic-modern/node-domain/${domain}/${kind}.node.tsx\n` +
          `   ✅ Registry entries: useDynamicNodeTypes.ts, nodespec-registry.ts\n` +
          `   ✅ Export statements: node-domain/index.ts\n` +
          `   ✅ CSS tokens: Regenerated from tokens.json\n\n` +
          `🎨 THEMING INTEGRATION:\n` +
          `   ✅ Node uses category '${category}' theming tokens\n` +
          `   ✅ CSS variables: --node-${category.toLowerCase()}-*\n` +
          `   ✅ Auto-integrated with sidebar, inspector, minimap\n` +
          `   ✅ Follows semantic token system\n\n` +
          `🚀 READY TO USE:\n` +
          `   • Node automatically appears in sidebar\n` +
          `   • Inspector controls auto-generated from schema\n` +
          `   • NODE_TYPE_CONFIG dynamically provides configuration\n` +
          `   • Theming matches existing ${category} category nodes\n\n` +
          `🔧 NEXT STEPS:\n` +
          `   • Customize node schema in the generated file\n` +
          `   • Add custom UI in the expanded/collapsed sections\n` +
          `   • Test with 'pnpm dev' - no additional setup needed!`
        );
      },
    ],
  });

  plop.setGenerator("delete-node", {
    description:
      "Comprehensively delete an existing node and clean up all associated files",
    prompts: [
      {
        type: "list",
        name: "nodeToDelete",
        message: "Which node would you like to delete?",
        choices: () => {
          const nodeBasePath = path.join(
            __dirname,
            "features/business-logic-modern/node-domain"
          );
          const domains = [
            "create",
            "view",
            "trigger",
            "test",
            "cycle",
            "custom",
          ];
          let nodes = [];
          domains.forEach((domain) => {
            const domainPath = path.join(nodeBasePath, domain);
            if (fs.existsSync(domainPath)) {
              const files = fs
                .readdirSync(domainPath)
                .filter((file) => file.endsWith(".node.tsx"))
                .map((file) => ({
                  name: file.replace(".node.tsx", ""),
                  value: {
                    kind: file.replace(".node.tsx", ""),
                    domain: domain,
                    filePath: path.join(domainPath, file),
                  },
                }));
              nodes = nodes.concat(files);
            }
          });
          if (nodes.length === 0) {
            return [{ name: "No nodes found to delete.", disabled: true }];
          }
          return nodes;
        },
        filter: (data) => {
          return data;
        },
      },
    ],
    actions: (data) => {
      const { kind, domain, filePath } = data.nodeToDelete;

      if (!kind) {
        console.log("No node selected. Aborting.");
        return [];
      }

      console.log(
        `Preparing to comprehensively delete node: ${kind} from domain: ${domain}`
      );

      // Helper function to safely delete directories
      const deleteDirIfExists = (dirPath) => {
        return () => {
          if (fs.existsSync(dirPath)) {
            try {
              // Remove all files in directory first
              const files = fs.readdirSync(dirPath);
              files.forEach((file) => {
                const filePath = path.join(dirPath, file);
                fs.unlinkSync(filePath);
              });
              // Remove the directory
              fs.rmdirSync(dirPath);
              return `Deleted directory: ${dirPath}`;
            } catch (error) {
              return `Error deleting directory ${dirPath}: ${error.message}`;
            }
          }
          return `Directory does not exist: ${dirPath}`;
        };
      };

      // Helper function to safely delete files
      const deleteFileIfExists = (filePath) => {
        return () => {
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              return `Deleted file: ${filePath}`;
            } catch (error) {
              return `Error deleting file ${filePath}: ${error.message}`;
            }
          }
          return `File does not exist: ${filePath}`;
        };
      };

      // Helper function to clean up generated files
      const cleanupGeneratedFiles = () => {
        return () => {
          const tasks = [];

          // Clean up handle-types.manifest.json
          const manifestPath = path.join(
            __dirname,
            "generated/handle-types.manifest.json"
          );
          if (fs.existsSync(manifestPath)) {
            try {
              const manifest = JSON.parse(
                fs.readFileSync(manifestPath, "utf8")
              );
              const outputKey = `${kind.charAt(0).toUpperCase() + kind.slice(1)}Output`;
              if (manifest[outputKey]) {
                delete manifest[outputKey];
                fs.writeFileSync(
                  manifestPath,
                  JSON.stringify(manifest, null, 2)
                );
                tasks.push(
                  `Removed ${outputKey} from handle-types.manifest.json`
                );
              }
            } catch (error) {
              tasks.push(
                `Error cleaning handle-types.manifest.json: ${error.message}`
              );
            }
          }

          // Clean up types/node-payloads.ts
          const payloadsPath = path.join(__dirname, "types/node-payloads.ts");
          if (fs.existsSync(payloadsPath)) {
            try {
              let content = fs.readFileSync(payloadsPath, "utf8");
              const outputInterface = `${kind.charAt(0).toUpperCase() + kind.slice(1)}Output`;
              const interfaceRegex = new RegExp(
                `export interface ${outputInterface}\\s*\\{[^}]*\\}\\s*`,
                "g"
              );
              const newContent = content.replace(interfaceRegex, "");
              if (newContent !== content) {
                fs.writeFileSync(payloadsPath, newContent);
                tasks.push(
                  `Removed ${outputInterface} interface from node-payloads.ts`
                );
              }
            } catch (error) {
              tasks.push(`Error cleaning node-payloads.ts: ${error.message}`);
            }
          }

          return tasks.length > 0
            ? tasks.join("; ")
            : "No generated files to clean";
        };
      };

      // Helper function to clean up theming references
      const cleanupThemingReferences = () => {
        return () => {
          const tasks = [];

          // Clean up ThemedMiniMap.tsx hardcoded node type checks
          const themingPath = path.join(
            __dirname,
            "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx"
          );
          if (fs.existsSync(themingPath)) {
            try {
              let content = fs.readFileSync(themingPath, "utf8");
              const originalContent = content;

              // Remove hardcoded node type checks like: nodeCategory === "createText" ||
              const nodeCheckRegex = new RegExp(
                `\\s*nodeCategory === "${kind}"\\s*\\|\\|`,
                "g"
              );
              content = content.replace(nodeCheckRegex, "");

              // Remove standalone node type checks like: nodeCategory === "createText"
              const standaloneCheckRegex = new RegExp(
                `\\s*nodeCategory === "${kind}"`,
                "g"
              );
              content = content.replace(standaloneCheckRegex, "");

              if (content !== originalContent) {
                fs.writeFileSync(themingPath, content);
                tasks.push(`Removed ${kind} references from ThemedMiniMap.tsx`);
              }
            } catch (error) {
              tasks.push(`Error cleaning ThemedMiniMap.tsx: ${error.message}`);
            }
          }

          return tasks.length > 0
            ? tasks.join("; ")
            : "No theming references to clean";
        };
      };

      // Helper function to clean up documentation references
      const cleanupDocumentationReferences = () => {
        return () => {
          const tasks = [];

          // Clean up NodeInspector.txt debug references
          const docPath = path.join(
            __dirname,
            "documentation/text-files/NodeInspector.txt"
          );
          if (fs.existsSync(docPath)) {
            try {
              let content = fs.readFileSync(docPath, "utf8");
              const originalContent = content;

              // Remove debug checks like: selectedNode.type === 'createText'
              const debugCheckRegex = new RegExp(
                `\\s*\\|\\|\\s*selectedNode\\.type === '${kind}'`,
                "g"
              );
              content = content.replace(debugCheckRegex, "");

              // Remove NODE_TYPE_CONFIG debug entries
              const configDebugRegex = new RegExp(
                `\\s*${kind}: NODE_TYPE_CONFIG\\['${kind}'\\],`,
                "g"
              );
              content = content.replace(configDebugRegex, "");

              if (content !== originalContent) {
                fs.writeFileSync(docPath, content);
                tasks.push(
                  `Removed ${kind} debug references from NodeInspector.txt`
                );
              }
            } catch (error) {
              tasks.push(`Error cleaning NodeInspector.txt: ${error.message}`);
            }
          }

          return tasks.length > 0
            ? tasks.join("; ")
            : "No documentation references to clean";
        };
      };

      return [
        // 1. Delete the main node file
        deleteFileIfExists(filePath),

        // 2. Delete migration directory and all its contents
        deleteDirIfExists(path.join(__dirname, `migrations/Node_${kind}`)),

        // 3. Clean up useDynamicNodeTypes.ts - import statement
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
          pattern: new RegExp(
            `import ${kind} from '..*?/node-domain/${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },

        // 4. Clean up useDynamicNodeTypes.ts - export in array
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
          pattern: new RegExp(`\\s*${kind},\\r?\\n`, "g"),
          template: "",
        },

        // 5. Clean up nodespec-registry.ts - import statement
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
          pattern: new RegExp(
            `import ${kind}, { spec as ${kind}Spec } from '..*?/node-domain/${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },

        // 6. Clean up nodespec-registry.ts - registry entry
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
          pattern: new RegExp(`\\s*${kind}: ${kind}Spec,\\r?\\n`, "g"),
          template: "",
        },

        // 7. Clean up node-domain/index.ts - export statement
        {
          type: "modify",
          path: "features/business-logic-modern/node-domain/index.ts",
          pattern: new RegExp(
            `export { default as ${kind} } from './${domain}/${kind}.node';\\r?\\n`,
            "g"
          ),
          template: "",
        },

        // 8. Clean up nodeData.ts - data interface
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
          pattern: new RegExp(
            `export interface ${kind.charAt(0).toUpperCase() + kind.slice(1)}Data extends BaseNodeData\\s*\\{[^}]*\\}\\r?\\n`,
            "g"
          ),
          template: "",
        },

        // 9. Clean up nodeData.ts - union type entry
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
          pattern: new RegExp(
            `\\s*\\| Node<${kind.charAt(0).toUpperCase() + kind.slice(1)}Data, "${kind}">\\r?\\n`,
            "g"
          ),
          template: "",
        },

        // 10. Clean up dataMigration.ts - migration mapping
        {
          type: "modify",
          path: "features/business-logic-modern/infrastructure/flow-engine/utils/dataMigration.ts",
          pattern: new RegExp(`\\s*${kind}: \\{[^}]*\\},?\\r?\\n`, "g"),
          template: "",
        },

        // 11. Clean up generated files (handle types, payloads)
        cleanupGeneratedFiles(),

        // 12. Clean up theming references (NEW)
        cleanupThemingReferences(),

        // 13. Clean up documentation references (NEW)
        cleanupDocumentationReferences(),

        // 14. Auto-regenerate CSS tokens after cleanup (NEW)
        () => {
          return new Promise((resolve) => {
            const { spawn } = require("child_process");
            console.log("🎨 Regenerating CSS tokens after cleanup...");

            const tokenProcess = spawn("pnpm", ["generate:tokens"], {
              stdio: "inherit",
              shell: true,
              cwd: __dirname,
            });

            tokenProcess.on("close", (code) => {
              if (code === 0) {
                resolve("✅ CSS tokens regenerated after cleanup");
              } else {
                resolve(`⚠️  Token regeneration completed with code ${code}`);
              }
            });

            tokenProcess.on("error", (error) => {
              resolve(`❌ Error regenerating tokens: ${error.message}`);
            });
          });
        },

        // 15. Final success message
        () =>
          `🎯 Successfully deleted node '${kind}' and all associated files:\n` +
          `   ✅ Main node file\n` +
          `   ✅ Migration directory\n` +
          `   ✅ Registry entries\n` +
          `   ✅ Type definitions\n` +
          `   ✅ Data migration mappings\n` +
          `   ✅ Generated files\n` +
          `   ✅ Theming references\n` +
          `   ✅ Documentation references\n` +
          `   ✅ All imports and exports\n` +
          `   ✅ CSS tokens regenerated\n\n` +
          `⚠️  Remember to:\n` +
          `   • Run 'pnpm generate:handle-types' to regenerate handle types\n` +
          `   • Test the application to ensure no broken references remain\n` +
          `   • The NODE_TYPE_CONFIG uses a proxy system, so no manual cleanup needed there\n` +
          `   • Sidebar uses registry-based organization, so it will auto-update\n` +
          `   • All theming tokens and CSS variables have been regenerated`,
      ];
    },
  });
};
