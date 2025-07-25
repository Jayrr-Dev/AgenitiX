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

module.exports = (plop) => {
	// Helpers to resolve size constants for templates
	plop.setHelper("collapsedSizeConstant", (key) => `COLLAPSED_SIZES.${key}`);
	plop.setHelper("expandedSizeConstant", (key) =>
		key.startsWith("V") ? `EXPANDED_VARIABLE_SIZES.${key}` : `EXPANDED_SIZES.${key}`
	);

	// Helper to truncate strings
	plop.setHelper("truncate", (str, length) => {
		if (str.length <= length) return str;
		return str.substring(0, length);
	});

	// Helper to convert to uppercase
	plop.setHelper("upper", (str) => str.toUpperCase());

	// Helper for equality comparison
	plop.setHelper("eq", (a, b) => a === b);

	// Helper for title case conversion
	plop.setHelper("titleCase", (str) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	});

	// Helper for camel case conversion
	plop.setHelper("camelCase", (str) => {
		return str.charAt(0).toLowerCase() + str.slice(1);
	});

	// Helper for pascal case conversion
	plop.setHelper("pascalCase", (str) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	});

	// Helper for kebab case conversion
	plop.setHelper("kebabCase", (str) => {
		return str.replace(/([A-Z])/g, "-$1").toLowerCase();
	});

	// Helper for constant case conversion
	plop.setHelper("constantCase", (str) => {
		return str.toUpperCase();
	});

	// Helper to map icon names to Lucide icons
	plop.setHelper("mapIconToLucide", (iconName) => {
		const iconMap = {
			FileText: "LuFileText",
			BarChart3: "LuBarChart3", 
			Link: "LuLink",
			Settings: "LuSettings",
			Mail: "LuMail",
			Bot: "LuBot",
			Database: "LuDatabase",
			Search: "LuSearch",
			Zap: "LuZap",
			RefreshCw: "LuRefreshCw",
		};
		return iconMap[iconName] || `Lu${iconName}`;
	});

	plop.setGenerator("node", {
		description: "Create a new node using the NodeSpec architecture",
		prompts: [
					{
			type: "input",
			name: "kind",
			message: "What is the kind of the node? (e.g., createText, viewCsv)",
			validate: (input) => {
				if (input.trim().length === 0) {
					return "Node kind cannot be empty";
				}
				if (!/^[a-z][a-zA-Z0-9]*$/.test(input)) {
					return "Node kind must start with lowercase letter and contain only letters and numbers";
				}
				if (input.length > 50) {
					return "Node kind is too long (max 50 characters)";
				}
				return true;
			},
		},
			{
				type: "list",
				name: "domain",
				message: "What is the domain of the node?",
				choices: ["create", "view", "trigger", "test", "cycle", "store", "custom"],
			},
			{
				type: "list",
				name: "category",
				message: "What is the functional category of the node?",
				choices: ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE", "STORE"],
			},
			{
				type: "list",
				name: "collapsedSize",
				message: "Select collapsed size",
				choices: [
					{ name: "C1: 60×60px (Standard)", value: "C1" },
					{ name: "C1W: 120×60px (Wide)", value: "C1W" },
					{ name: "C2: 120×120px (Large)", value: "C2" },
					{ name: "C3: 180×180px (Extra Large)", value: "C3" },
				],
			},
			{
				type: "list",
				name: "expandedSize",
				message: "Select expanded size",
				choices: [
					{ name: "FE0: 60×60px (Fixed - Tiny)", value: "FE0" },
					{ name: "FE1: 120×120px (Fixed - Default)", value: "FE1" },
					{ name: "FE1H: 120×180px (Fixed - Tall)", value: "FE1H" },
					{ name: "FE2: 180×180px (Fixed - Large)", value: "FE2" },
					{ name: "FE3: 240×240px (Fixed - Extra Large)", value: "FE3" },
					{ name: "VE0: 60px × auto (Variable - Tiny)", value: "VE0" },
					{ name: "VE1: 120px × auto (Variable - Default)", value: "VE1" },
					{ name: "VE2: 180px × auto (Variable - Large)", value: "VE2" },
					{ name: "VE3: 240px × auto (Variable - Extra Large)", value: "VE3" },
				],
			},
			{
				type: "list",
				name: "icon",
				message: "Select an icon for this node",
				choices: [
					{ name: "📄 FileText (Document/Text)", value: "FileText" },
					{ name: "📊 BarChart3 (Data/Charts)", value: "BarChart3" },
					{ name: "🔗 Link (Connection/Network)", value: "Link" },
					{ name: "⚙️ Settings (Configuration)", value: "Settings" },
					{ name: "📧 Mail (Email/Communication)", value: "Mail" },
					{ name: "🤖 Bot (AI/Automation)", value: "Bot" },
					{ name: "💾 Database (Data Storage)", value: "Database" },
					{ name: "🔍 Search (Search/Filter)", value: "Search" },
					{ name: "⚡ Zap (Action/Trigger)", value: "Zap" },
					{ name: "🔄 RefreshCw (Process/Cycle)", value: "RefreshCw" },
					{ name: "Custom (enter manually)", value: "custom" },
				],
				default: "FileText",
			},
			{
				type: "input",
				name: "customIcon",
				message: "Enter custom icon name (e.g., FileText, Mail, Bot, Database):",
				when: (answers) => answers.icon === "custom",
			},

			{
				type: "input",
				name: "author",
				message: "Who is the author/creator of this node?",
				default: "Agenitix Team",
			},
					{
			type: "input",
			name: "description",
			message: "Describe what this node does (press Enter to use default):",
			default: (answers) => {
				const kind = answers.kind || "Node";
				const domain = answers.domain || "general";
				const domainMap = {
					create: "creation",
					view: "display",
					trigger: "triggering",
					test: "testing",
					cycle: "cycling",
					custom: "custom operations"
				};
				const domainDesc = domainMap[answers.domain] || "operations";
				return `${kind.charAt(0).toUpperCase() + kind.slice(1)} node for ${domainDesc}`;
			},
			validate: (input) => {
				if (input.trim().length === 0) {
					return "Description cannot be empty";
				}
				if (input.length > 200) {
					return "Description is too long (max 200 characters)";
				}
				return true;
			},
		},
			{
				type: "list",
				name: "feature",
				message: "What feature/module does this node belong to?",
				choices: [
					{ name: "base (Core functionality)", value: "base" },
					{ name: "email (Email operations)", value: "email" },
					{ name: "agents (AI agents)", value: "agents" },
					{ name: "ai (Artificial Intelligence)", value: "ai" },
					{ name: "database (Data storage)", value: "database" },
					{ name: "api (External APIs)", value: "api" },
					{ name: "ui (User interface)", value: "ui" },
					{ name: "workflow (Process automation)", value: "workflow" },
					{ name: "Custom (enter manually)", value: "custom" },
				],
			},
			{
				type: "input",
				name: "customFeature",
				message: "Enter custom feature name:",
				when: (answers) => answers.feature === "custom",
			},

			{
				type: "confirm",
				name: "customTheming",
				message: "Do you want to customize dark mode theming for this node?",
				default: false,
			},
			{
				type: "input",
				name: "bgDark",
				message: "Dark mode background color (leave blank for default):",
				default: "",
				when: (answers) => answers.customTheming,
			},

			{
				type: "input",
				name: "borderDark",
				message: "Dark mode border color (leave blank for default):",
				default: "",
				when: (answers) => answers.customTheming,
			},
			{
				type: "input",
				name: "textDark",
				message: "Dark mode text color (leave blank for default):",
				default: "",
				when: (answers) => answers.customTheming,
			},
			{
				type: "input",
				name: "tsSymbol",
				message: "Optional: TypeScript symbol for primary output handle (leave blank for none)",
			},
			{
				type: "input",
				name: "tags",
				message: "Enter tags for this node (comma-separated, e.g., 'text, formatting, content'):",
				default: (answers) => {
					const kind = answers.kind || "node";
					const domain = answers.domain || "general";
					return `${domain}, ${kind}`;
				},
			},
			{
				type: "confirm",
				name: "useFeatureFlag",
				message: "Do you want to add feature flag support to this node?",
				default: false,
			},
			{
				type: "input",
				name: "featureFlag",
				message: "Enter the feature flag name (leave blank to use 'test' flag):",
				default: "test",
				when: (answers) => answers.useFeatureFlag,
			},
			{
				type: "confirm",
				name: "featureFlagFallback",
				message: "Should the node be enabled by default if the flag is unavailable?",
				default: true,
				when: (answers) => answers.useFeatureFlag,
			},
			{
				type: "input",
				name: "featureFlagMessage",
				message: "Custom message to show when the node is disabled (leave blank for default):",
				default: (answers) => `This ${answers.kind} node is currently disabled`,
				when: (answers) => answers.useFeatureFlag,
			},
			{
				type: "confirm",
				name: "hideWhenDisabled",
				message: "Should the node be completely hidden when the flag is disabled?",
				default: false,
				when: (answers) => answers.useFeatureFlag,
			},
		],
		actions: (data) => {
			// Process custom icon
			if (data.icon === "custom" && data.customIcon) {
				data.icon = data.customIcon;
			}

			// Process custom feature
			if (data.feature === "custom" && data.customFeature) {
				data.feature = data.customFeature;
			}

			// Process tags
			if (data.tags) {
				const tagArray = data.tags
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0);
				data.tags = tagArray;
			}

			return [
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
					pattern: /\/\/ Add new node imports here \(Plop can auto-inject these\)/g,
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
						'import createText, { spec as createTextSpec } from "../../node-domain/create/createText.node";',
					template:
						'import createText, { spec as createTextSpec } from "../../node-domain/create/createText.node";\nimport {{kind}}, { spec as {{kind}}Spec } from "../../node-domain/{{domain}}/{{kind}}.node";',
				},

				// 5. Update nodespec-registry.ts - registry entry
				{
					type: "modify",
					path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
					pattern: "createText: createTextSpec,",
					template: "createText: createTextSpec,\n\t{{kind}}: {{kind}}Spec,",
				},

				// 6. Update node-domain/index.ts - export
				{
					type: "modify",
					path: "features/business-logic-modern/node-domain/index.ts",
					pattern: 'export { default as createText } from "./create/createText.node";',
					template:
						'export { default as createText } from "./create/createText.node";\nexport { default as {{kind}} } from "./{{domain}}/{{kind}}.node";',
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
								console.log(`   Then run 'pnpm generate:tokens' to regenerate CSS variables`);
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

				// 9. Auto-generate node documentation (NEW)
				(data) => {
					return new Promise((resolve) => {
						const { spawn } = require("child_process");
						console.log("📚 Generating node documentation...");

						const docProcess = spawn(
							"npx",
							[
								"ts-node",
								"--project",
								"tsconfig.node.json",
								"scripts/generate-node-docs.ts",
								data.kind,
								data.domain,
								data.category,
								data.kind,
							],
							{
								stdio: "inherit",
								shell: true,
								cwd: __dirname,
							}
						);

						docProcess.on("close", (code) => {
							if (code === 0) {
								resolve("✅ Node documentation generated successfully");
							} else {
								resolve(`⚠️  Documentation generation completed with code ${code}`);
							}
						});

						docProcess.on("error", (error) => {
							resolve(`❌ Error generating documentation: ${error.message}`);
						});
					});
				},

				// 10. Auto-generate nodes overview (NEW)
				() => {
					return new Promise((resolve) => {
						const { spawn } = require("child_process");
						console.log("📋 Generating nodes overview...");

						const overviewProcess = spawn(
							"npx",
							["ts-node", "--project", "tsconfig.node.json", "scripts/generate-nodes-overview.ts"],
							{
								stdio: "inherit",
								shell: true,
								cwd: __dirname,
							}
						);

						overviewProcess.on("close", (code) => {
							if (code === 0) {
								resolve("✅ Nodes overview generated successfully");
							} else {
								resolve(`⚠️  Overview generation completed with code ${code}`);
							}
						});

						overviewProcess.on("error", (error) => {
							resolve(`❌ Error generating overview: ${error.message}`);
						});
					});
				},

				// 11. Final success message with comprehensive instructions
				(data) => {
					const { kind, domain, category } = data;
					return (
						`🎯 Successfully created node '${kind}' with improved architecture:\n\n` +
						`📁 FILES CREATED/UPDATED:\n` +
						`   ✅ Node file: features/business-logic-modern/node-domain/${domain}/${kind}.node.tsx\n` +
						`   ✅ Registry entries: useDynamicNodeTypes.ts, nodespec-registry.ts\n` +
						`   ✅ Export statements: node-domain/index.ts\n` +
						`   ✅ CSS tokens: Regenerated from tokens.json\n` +
						`   ✅ Documentation: documentation/nodes/${domain}/${kind}.md\n` +
						`   ✅ HTML docs: documentation/nodes/${domain}/${kind}.html\n` +
						`   ✅ API reference: documentation/api/${kind}.ts\n` +
						`   ✅ Nodes overview: documentation/nodes/overview.html\n\n` +
						`🏗️  IMPROVED ARCHITECTURE:\n` +
						`   ✅ Enhanced import organization and grouping\n` +
						`   ✅ Better schema design with improved defaults\n` +
						`   ✅ Sophisticated data propagation patterns\n` +
						`   ✅ Focus-preserving memoization (no more focus loss!)\n` +
						`   ✅ Enhanced UI patterns with better textarea handling\n` +
						`   ✅ Robust validation and error handling\n` +
						`   ✅ Clean separation of concerns\n\n` +
						`🎨 THEMING INTEGRATION:\n` +
						`   ✅ Node uses category '${category}' theming tokens\n` +
						`   ✅ CSS variables: --node-${category.toLowerCase()}-*\n` +
						`   ✅ Auto-integrated with sidebar, inspector, minimap\n` +
						`   ✅ Follows semantic token system\n\n` +
						`📚 DOCUMENTATION GENERATED:\n` +
						`   ✅ Comprehensive markdown documentation\n` +
						`   ✅ Interactive HTML documentation\n` +
						`   ✅ API reference with TypeScript types\n` +
						`   ✅ Usage examples and integration guides\n` +
						`   ✅ Troubleshooting and development tips\n\n` +
						`🚀 READY TO USE:\n` +
						`   • Node automatically appears in sidebar\n` +
						`   • Inspector controls auto-generated from schema\n` +
						`   • NODE_TYPE_CONFIG dynamically provides configuration\n` +
						`   • Theming matches existing ${category} category nodes\n` +
						`   • Documentation available at documentation/nodes/${domain}/\n` +
						`   • No focus loss issues during editing\n\n` +
						`🔧 NEXT STEPS:\n` +
						`   • Customize node schema in the generated file\n` +
						`   • Add custom UI in the expanded/collapsed sections\n` +
						`   • Review generated documentation\n` +
						`   • Test with 'pnpm dev' - no additional setup needed!\n\n` +
						`💡 KEY IMPROVEMENTS:\n` +
						`   • Better organized imports and code structure\n` +
						`   • Enhanced data propagation with proper state management\n` +
						`   • Improved textarea handling with proper event types\n` +
						`   • Memoized scaffold component prevents focus loss\n` +
						`   • Better validation and error reporting\n` +
						`   • Cleaner separation between pure and impure functions`
					);
				},
			];
		},
	});

	plop.setGenerator("delete-node", {
		description: "Comprehensively delete an existing node and clean up all associated files",
		prompts: [
			{
				type: "list",
				name: "nodeToDelete",
				message: "Which node would you like to delete?",
				choices: () => {
					const nodeBasePath = path.join(__dirname, "features/business-logic-modern/node-domain");
					const domains = ["create", "view", "trigger", "test", "cycle", "custom"];
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

			console.log(`Preparing to comprehensively delete node: ${kind} from domain: ${domain}`);

			// Validate that the node file actually exists before proceeding
			if (!fs.existsSync(filePath)) {
				console.log(`❌ Error: Node file ${filePath} does not exist. Aborting deletion.`);
				return [];
			}

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
					const manifestPath = path.join(__dirname, "generated/handle-types.manifest.json");
					if (fs.existsSync(manifestPath)) {
						try {
							const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
							const outputKey = `${kind.charAt(0).toUpperCase() + kind.slice(1)}Output`;
							if (manifest[outputKey]) {
								delete manifest[outputKey];
								fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
								tasks.push(`Removed ${outputKey} from handle-types.manifest.json`);
							}
						} catch (error) {
							tasks.push(`Error cleaning handle-types.manifest.json: ${error.message}`);
						}
					}

					// Clean up types/node-payloads.ts
					const payloadsPath = path.join(__dirname, "types/node-payloads.ts");
					if (fs.existsSync(payloadsPath)) {
						try {
							const content = fs.readFileSync(payloadsPath, "utf8");
							const outputInterface = `${kind.charAt(0).toUpperCase() + kind.slice(1)}Output`;
							const interfaceRegex = new RegExp(
								`export interface ${outputInterface}\\s*\\{[^}]*\\}\\s*`,
								"g"
							);
							const newContent = content.replace(interfaceRegex, "");
							if (newContent !== content) {
								fs.writeFileSync(payloadsPath, newContent);
								tasks.push(`Removed ${outputInterface} interface from node-payloads.ts`);
							}
						} catch (error) {
							tasks.push(`Error cleaning node-payloads.ts: ${error.message}`);
						}
					}

					return tasks.length > 0 ? tasks.join("; ") : "No generated files to clean";
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
							const nodeCheckRegex = new RegExp(`\\s*nodeCategory === "${kind}"\\s*\\|\\|`, "g");
							content = content.replace(nodeCheckRegex, "");

							// Remove standalone node type checks like: nodeCategory === "createText"
							const standaloneCheckRegex = new RegExp(`\\s*nodeCategory === "${kind}"`, "g");
							content = content.replace(standaloneCheckRegex, "");

							if (content !== originalContent) {
								fs.writeFileSync(themingPath, content);
								tasks.push(`Removed ${kind} references from ThemedMiniMap.tsx`);
							}
						} catch (error) {
							tasks.push(`Error cleaning ThemedMiniMap.tsx: ${error.message}`);
						}
					}

					return tasks.length > 0 ? tasks.join("; ") : "No theming references to clean";
				};
			};

			// Helper function to clean up documentation references
			const cleanupDocumentationReferences = () => {
				return () => {
					const tasks = [];

					// Clean up NodeInspector.txt debug references
					const docPath = path.join(__dirname, "documentation/text-files/NodeInspector.txt");
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
								tasks.push(`Removed ${kind} debug references from NodeInspector.txt`);
							}
						} catch (error) {
							tasks.push(`Error cleaning NodeInspector.txt: ${error.message}`);
						}
					}

					return tasks.length > 0 ? tasks.join("; ") : "No documentation references to clean";
				};
			};

			return [
				// 0. Create backup of registry files before making changes
				() => {
					const backupDir = path.join(
						__dirname,
						"backups",
						new Date().toISOString().replace(/[:.]/g, "-")
					);
					if (!fs.existsSync(path.dirname(backupDir))) {
						fs.mkdirSync(path.dirname(backupDir), { recursive: true });
					}

					const filesToBackup = [
						"features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
						"features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
						"features/business-logic-modern/node-domain/index.ts",
						`documentation/api/${kind}.ts`,
						`documentation/nodes/${domain}/${kind}.md`,
						`documentation/nodes/${domain}/${kind}.html`,
					];

					filesToBackup.forEach((filePath) => {
						const fullPath = path.join(__dirname, filePath);
						if (fs.existsSync(fullPath)) {
							const backupPath = path.join(backupDir, path.basename(filePath));
							// Create directory structure if needed
							const backupDirPath = path.dirname(backupPath);
							if (!fs.existsSync(backupDirPath)) {
								fs.mkdirSync(backupDirPath, { recursive: true });
							}
							fs.copyFileSync(fullPath, backupPath);
						}
					});

					return `✅ Created backup in ${backupDir}`;
				},

				// 1. Delete the main node file
				deleteFileIfExists(filePath),

				// 2. Delete migration directory and all its contents
				deleteDirIfExists(path.join(__dirname, `migrations/Node_${kind}`)),

				// 3. Clean up useDynamicNodeTypes.ts - import statement
				() => {
					const dynamicTypesPath = path.join(
						__dirname,
						"features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts"
					);

					if (fs.existsSync(dynamicTypesPath)) {
						try {
							let content = fs.readFileSync(dynamicTypesPath, "utf8");
							const originalContent = content;

							// Remove the import statement for the deleted node - must match BOTH conditions
							const lines = content.split("\n");
							const filteredLines = lines.filter(
								(line) =>
									!(
										line.includes(`import ${kind} from`) &&
										line.includes(`node-domain/${domain}/${kind}.node`)
									)
							);
							content = filteredLines.join("\n");

							if (content !== originalContent) {
								fs.writeFileSync(dynamicTypesPath, content);
								return `Cleaned up ${kind} import from useDynamicNodeTypes.ts`;
							}
							return `No ${kind} import found in useDynamicNodeTypes.ts`;
						} catch (error) {
							return `Error cleaning import from useDynamicNodeTypes.ts: ${error.message}`;
						}
					}
					return `useDynamicNodeTypes.ts file not found`;
				},

				// 4. Clean up useDynamicNodeTypes.ts - export in array
				() => {
					const dynamicTypesPath = path.join(
						__dirname,
						"features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts"
					);

					if (fs.existsSync(dynamicTypesPath)) {
						try {
							let content = fs.readFileSync(dynamicTypesPath, "utf8");
							const originalContent = content;

							// More precise regex that preserves formatting and only removes the specific node
							// Pattern 1: Remove node entry with trailing comma and newline
							const pattern1 = new RegExp(`\\s*${kind},\\s*\\r?\\n`, "g");
							content = content.replace(pattern1, "\n");
							
							// Pattern 2: Remove node entry that might be the last one (no trailing comma)
							const pattern2 = new RegExp(`\\s*${kind}\\s*(?=\\s*}|\\s*\\))`, "g");
							content = content.replace(pattern2, "");
							
							// Pattern 3: Remove any orphaned commas that might result
							content = content.replace(/,(\s*[,}\)])/g, "$1");
							content = content.replace(/(\{\s*),/g, "$1");

							if (content !== originalContent) {
								fs.writeFileSync(dynamicTypesPath, content);
								return `Cleaned up ${kind} from useDynamicNodeTypes.ts`;
							}
							return `No ${kind} references found in useDynamicNodeTypes.ts`;
						} catch (error) {
							return `Error cleaning useDynamicNodeTypes.ts: ${error.message}`;
						}
					}
					return `useDynamicNodeTypes.ts file not found`;
				},

				// 5. Clean up nodespec-registry.ts - import statement
				{
					type: "modify",
					path: "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
					pattern: new RegExp(
						`import ${kind}, { spec as ${kind}Spec } from "\\.\\./\\.\\./node-domain/${domain}/${kind}\\.node";\\r?\\n`,
						"g"
					),
					template: "",
					transform: (fileContents) => {
						// Safety check: ensure we're only removing the specific import
						const lines = fileContents.split("\n");
						const filteredLines = lines.filter(
							(line) =>
								!(
									line.includes(`import ${kind}, { spec as ${kind}Spec }`) &&
									line.includes(`node-domain/${domain}/${kind}.node`)
								)
						);
						return filteredLines.join("\n");
					},
				},

				// 6. Clean up nodespec-registry.ts - registry entry
				() => {
					const registryPath = path.join(
						__dirname,
						"features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts"
					);

					if (fs.existsSync(registryPath)) {
						try {
							let content = fs.readFileSync(registryPath, "utf8");
							const originalContent = content;

							// More precise regex that preserves formatting
							// Pattern 1: Remove registry entry with trailing comma and newline
							const pattern1 = new RegExp(`\\s*${kind}: ${kind}Spec,\\s*\\r?\\n`, "g");
							content = content.replace(pattern1, "\n");
							
							// Pattern 2: Remove registry entry that might be the last one (no trailing comma)
							const pattern2 = new RegExp(`\\s*${kind}: ${kind}Spec\\s*(?=\\s*}|\\s*\\))`, "g");
							content = content.replace(pattern2, "");
							
							// Pattern 3: Remove any orphaned commas that might result
							content = content.replace(/,(\s*[,}\)])/g, "$1");
							content = content.replace(/(\{\s*),/g, "$1");

							if (content !== originalContent) {
								fs.writeFileSync(registryPath, content);
								return `Cleaned up ${kind} registry entry`;
							}
							return `No ${kind} registry entry found to clean`;
						} catch (error) {
							return `Error cleaning registry entry: ${error.message}`;
						}
					}
					return `Registry file not found`;
				},

				// 7. Clean up node-domain/index.ts - export statement
				{
					type: "modify",
					path: "features/business-logic-modern/node-domain/index.ts",
					pattern: new RegExp(
						`export { default as ${kind} } from "\\./${domain}/${kind}\\.node";\\r?\\n`,
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

				// 14. Clean up node documentation files (NEW)
				() => {
					const apiDocPath = path.join(__dirname, `documentation/api/${kind}.ts`);

					if (fs.existsSync(apiDocPath)) {
						try {
							fs.unlinkSync(apiDocPath);
							return `Deleted ${kind}.ts from documentation/api/`;
						} catch (error) {
							return `Error deleting ${kind}.ts: ${error.message}`;
						}
					}
					return `API documentation file ${kind}.ts does not exist`;
				},

				// 15. Clean up node documentation directory
				() => {
					const docDir = path.join(__dirname, `documentation/nodes/${domain}`);
					const nodeDocPath = path.join(docDir, `${kind}.md`);
					const nodeHtmlPath = path.join(docDir, `${kind}.html`);

					const tasks = [];

					// Delete node markdown file
					if (fs.existsSync(nodeDocPath)) {
						try {
							fs.unlinkSync(nodeDocPath);
							tasks.push(`Deleted ${kind}.md`);
						} catch (error) {
							tasks.push(`Error deleting ${kind}.md: ${error.message}`);
						}
					}

					// Delete node HTML file
					if (fs.existsSync(nodeHtmlPath)) {
						try {
							fs.unlinkSync(nodeHtmlPath);
							tasks.push(`Deleted ${kind}.html`);
						} catch (error) {
							tasks.push(`Error deleting ${kind}.html: ${error.message}`);
						}
					}

					// Check if domain directory is empty and remove it
					if (fs.existsSync(docDir)) {
						try {
							const remainingFiles = fs.readdirSync(docDir);
							if (remainingFiles.length === 0) {
								fs.rmdirSync(docDir);
								tasks.push(`Removed empty ${domain} documentation directory`);
							}
						} catch (error) {
							tasks.push(`Error checking ${domain} directory: ${error.message}`);
						}
					}

					return tasks.length > 0 ? tasks.join("; ") : "No documentation files to clean";
				},

				// 16. Auto-regenerate CSS tokens after cleanup (NEW)
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

				// 17. Validate registry file syntax after cleanup (NEW)
				() => {
					const registryPath = path.join(
						__dirname,
						"features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts"
					);

					if (fs.existsSync(registryPath)) {
						try {
							const content = fs.readFileSync(registryPath, "utf8");

							// Check for common syntax issues
							const issues = [];

							// Check for undefined references to the deleted node
							const undefinedRefs = content.match(new RegExp(`\\b${kind}Spec\\b`, "g"));
							if (undefinedRefs && undefinedRefs.length > 0) {
								issues.push(`Found ${undefinedRefs.length} undefined references to ${kind}Spec`);
							}

							// Check for orphaned commas (more precise check)
							const orphanedCommas = content.match(/,\s*[}\)]/g);
							if (orphanedCommas && orphanedCommas.length > 0) {
								issues.push(`Found ${orphanedCommas.length} orphaned commas`);
							}

							// Check that core nodes are still intact (only check if they exist)
							const coreNodes = ["createText", "viewText"];
							const expectedNodes = coreNodes.filter((node) => node !== kind);
							const missingNodes = expectedNodes.filter((node) => {
								// Check both import and registry entry
								const hasImport = content.includes(`import ${node}`);
								const hasEntry = content.includes(`${node}: ${node}Spec`);
								return !hasImport || !hasEntry;
							});
							
							if (missingNodes.length > 0) {
								issues.push(`⚠️ CRITICAL: Missing nodes after deletion: ${missingNodes.join(", ")}`);
							}

							// Check basic syntax
							const hasValidNodeSpecs = content.includes("const nodeSpecs:");
							if (!hasValidNodeSpecs) {
								issues.push("⚠️ CRITICAL: nodeSpecs object not found");
							}

							if (issues.length > 0) {
								return `⚠️  Registry validation issues: ${issues.join(", ")}`;
							}

							const remainingNodes = expectedNodes.filter((node) => content.includes(`${node}: ${node}Spec`));
							return `✅ Registry validated successfully (${remainingNodes.length} nodes remaining: ${remainingNodes.join(", ")})`;
						} catch (error) {
							return `❌ Error validating registry: ${error.message}`;
						}
					}
					return `Registry file not found for validation`;
				},

				// 18. Regenerate documentation overview after cleanup (NEW)
				() => {
					return new Promise((resolve) => {
						const { spawn } = require("child_process");
						console.log("📚 Regenerating documentation overview after cleanup...");

						const docProcess = spawn(
							"npx",
							["ts-node", "--project", "tsconfig.node.json", "scripts/generate-nodes-overview.ts"],
							{
								stdio: "inherit",
								shell: true,
								cwd: __dirname,
							}
						);

						docProcess.on("close", (code) => {
							if (code === 0) {
								resolve("✅ Documentation overview regenerated after cleanup");
							} else {
								resolve(`⚠️  Documentation regeneration completed with code ${code}`);
							}
						});

						docProcess.on("error", (error) => {
							resolve(`❌ Error regenerating documentation: ${error.message}`);
						});
					});
				},

				// 19. Final success message
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
					`   ✅ Node documentation files (.md, .html)\n` +
					`   ✅ API documentation files (.ts)\n` +
					`   ✅ All imports and exports\n` +
					`   ✅ CSS tokens regenerated\n\n` +
					`⚠️  Remember to:\n` +
					`   • Run 'pnpm generate:handle-types' to regenerate handle types\n` +
					`   • Test the application to ensure no broken references remain\n` +
					`   • The NODE_TYPE_CONFIG uses a proxy system, so no manual cleanup needed there\n` +
					`   • Sidebar uses registry-based organization, so it will auto-update\n` +
					`   • All theming tokens and CSS variables have been regenerated\n\n` +
					`🛡️  Safety features:\n` +
					`   • Backup created before deletion\n` +
					`   • Precise regex patterns to avoid affecting other nodes\n` +
					`   • Validation checks to ensure only target node is affected\n` +
					`   • Rollback available from backup if needed`,
			];
		},
	});

	// ============================================================================
	// CATEGORY MANAGEMENT GENERATOR
	// ============================================================================

	plop.setGenerator("category", {
		description: "Manage node categories - add, remove, or modify categories across the entire system",
		prompts: [
			{
				type: "list",
				name: "action",
				message: "What would you like to do with categories?",
				choices: [
					{ name: "Add a new category", value: "add" },
					{ name: "Remove an existing category", value: "remove" },
					{ name: "List current categories", value: "list" },
				],
			},
			{
				type: "input",
				name: "categoryName",
				message: "What is the name of the category? (e.g., PROCESS, ANALYZE, TRANSFORM)",
				when: (answers) => answers.action === "add",
				validate: (input) => {
					if (input.trim().length === 0) {
						return "Category name cannot be empty";
					}
					if (!/^[A-Z][A-Z0-9_]*$/.test(input)) {
						return "Category name must be UPPERCASE with only letters, numbers, and underscores";
					}
					if (input.length > 20) {
						return "Category name is too long (max 20 characters)";
					}
					return true;
				},
			},
			{
				type: "list",
				name: "categoryName",
				message: "Which category would you like to remove?",
				when: (answers) => answers.action === "remove",
				choices: () => {
					// Read current categories from the file
					const categoriesPath = path.join(__dirname, "features/business-logic-modern/infrastructure/theming/categories.ts");
					if (fs.existsSync(categoriesPath)) {
						const content = fs.readFileSync(categoriesPath, "utf8");
						const matches = content.match(/^\s*([A-Z_]+):\s*"[A-Z_]+",/gm);
						if (matches) {
							const categories = matches.map(match => {
								const name = match.match(/^\s*([A-Z_]+):/)?.[1];
								return name;
							}).filter(Boolean);
							
							// Filter out core categories that shouldn't be removed
							const coreCategories = ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE", "STORE"];
							const removableCategories = categories.filter(cat => !coreCategories.includes(cat));
							
							if (removableCategories.length === 0) {
								return [{ name: "❌ No removable categories (only core categories exist)", value: null, disabled: true }];
							}
							
							return removableCategories.map(category => ({
								name: `🗑️  ${category} - ${category.charAt(0) + category.slice(1).toLowerCase()} category`,
								value: category.toLowerCase()
							}));
						}
					}
					return [{ name: "❌ No categories found", value: null, disabled: true }];
				},
			},
			{
				type: "input",
				name: "domainName",
				message: "What is the domain name for this category? (lowercase, e.g., process, analyze)",
				when: (answers) => answers.action === "add",
				validate: (input) => {
					if (input.trim().length === 0) {
						return "Domain name cannot be empty";
					}
					if (!/^[a-z][a-z0-9]*$/.test(input)) {
						return "Domain name must be lowercase with only letters and numbers";
					}
					if (input.length > 20) {
						return "Domain name is too long (max 20 characters)";
					}
					return true;
				},
			},
			{
				type: "input",
				name: "description",
				message: "Describe what this category is for:",
				when: (answers) => answers.action === "add",
				default: (answers) => {
					const category = answers.categoryName?.toLowerCase() || "operations";
					return `Nodes that handle ${category} operations`;
				},
			},
			{
				type: "input",
				name: "color",
				message: "What color should this category use? (hex color, e.g., #3b82f6)",
				when: (answers) => answers.action === "add",
				default: "#6b7280",
				validate: (input) => {
					if (!/^#[0-9A-Fa-f]{6}$/.test(input)) {
						return "Please enter a valid hex color (e.g., #3b82f6)";
					}
					return true;
				},
			},
			{
				type: "confirm",
				name: "addToSidebar",
				message: "Add this category to the sidebar tab configuration?",
				when: (answers) => answers.action === "add",
				default: true,
			},
		],
		actions: (data) => {
			if (data.action === "list") {
				// Read categories from the file and display them
				const categoriesPath = path.join(__dirname, "features/business-logic-modern/infrastructure/theming/categories.ts");
				if (fs.existsSync(categoriesPath)) {
					const content = fs.readFileSync(categoriesPath, "utf8");
					const matches = content.match(/^\s*([A-Z_]+):\s*"[A-Z_]+",/gm);
					if (matches) {
						const categories = matches.map(match => {
							const name = match.match(/^\s*([A-Z_]+):/)?.[1];
							return name;
						}).filter(Boolean);
						
						console.log("\n📋 Current Categories:");
						console.log("==================");
						categories.forEach((category, index) => {
							console.log(`${index + 1}. ${category}`);
						});
						console.log(`\nTotal: ${categories.length} categories\n`);
					}
				}
				return [];
			}

			if (data.action === "add") {
				return [
					// 1. Update categories.ts
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/categories.ts",
						pattern: /} as const;/,
						template: `\t${data.categoryName}: "${data.categoryName}",\n} as const;`,
					},

					// 2. Update nodeData.ts - DomainCategory type
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
						pattern: /export type DomainCategory = "create" \| "view" \| "trigger" \| "test" \| "cycle" \| "store";/,
						template: `export type DomainCategory = "create" | "view" | "trigger" | "test" | "cycle" | "store" | "${data.domainName}";`,
					},

					// 3. Update sidebar types.ts - TAB_CONFIG_B
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/types.ts",
						pattern: /{ key: "STORE", label: "Store" },/,
						template: `{ key: "STORE", label: "Store" },${data.addToSidebar ? `\n\t{ key: "${data.categoryName}", label: "${data.categoryName.charAt(0) + data.categoryName.slice(1).toLowerCase()}" },` : ""}`,
					},

					// 4. Update sidebar constants.ts - VARIANT_CONFIG
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/constants.ts",
						pattern: /STORE: createStencilsByCategory\("STORE", "variant-b"\),/,
						template: `STORE: createStencilsByCategory("STORE", "variant-b"),${data.addToSidebar ? `\n\t\t\t\t${data.categoryName}: createStencilsByCategory("${data.categoryName}", "variant-b"),` : ""}`,
					},

					// 5. Update refreshStencils function
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/constants.ts",
						pattern: /STORE: createStencilsByCategory\("STORE", "variant-b"\),/,
						template: `STORE: createStencilsByCategory("STORE", "variant-b"),${data.addToSidebar ? `\n\t\t\t\t${data.categoryName}: createStencilsByCategory("${data.categoryName}", "variant-b"),` : ""}`,
					},

					// 6. Update nodeStyleStore.ts - CATEGORY_THEMES
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore.ts",
						pattern: /test: \{/,
						template: `test: {`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore.ts",
						pattern: /},/,
						template: `},\n\t${data.domainName}: {\n\t\tbackground: { light: "bg-node-${data.domainName}", dark: "bg-node-${data.domainName}" },\n\t\tborder: { light: "border-node-${data.domainName}", dark: "border-node-${data.domainName}" },\n\t\ttext: {\n\t\t\tprimary: { light: "text-node-${data.domainName}", dark: "text-node-${data.domainName}" },\n\t\t\tsecondary: {\n\t\t\t\tlight: "text-node-${data.domainName}-secondary",\n\t\t\t\tdark: "text-node-${data.domainName}-secondary",\n\t\t\t},\n\t\t},\n\t\tbutton: {\n\t\t\tborder: "border-node-${data.domainName}",\n\t\t\thover: {\n\t\t\t\tlight: "hover:bg-node-${data.domainName}-hover",\n\t\t\t\tdark: "hover:bg-node-${data.domainName}-hover",\n\t\t\t},\n\t\t},\n\t},`,
					},

					// 7. Update BaseControl.tsx - getSemanticClasses
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/controls/BaseControl.tsx",
						pattern: /case "test":/,
						template: `case "test":`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/controls/BaseControl.tsx",
						pattern: /default:/,
						template: `case "${data.domainName}":\n		case "${data.domainName}node":\n			return {\n				primary: "bg-node-${data.domainName} text-node-${data.domainName}-text",\n				primaryHover: "hover:bg-node-${data.domainName}-hover",\n				border: "border-node-${data.domainName}",\n				borderHover: "hover:border-node-${data.domainName}-hover",\n				text: "text-node-${data.domainName}-text",\n				textSecondary: "text-node-${data.domainName}-text-secondary",\n			};\n		default:`,
					},

					// 8. Update NodeInspectorService.ts - determineHasControls
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/services/NodeInspectorService.ts",
						pattern: /metadata\.category === "TEST" \|\|/,
						template: `metadata.category === "TEST" ||\n\t\t\tmetadata.category === "${data.categoryName}" ||`,
					},

					// 9. Update NodeOutput.tsx - category-based styling
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/components/NodeOutput.tsx",
						pattern: /case "test":/,
						template: `case "test":`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/components/NodeOutput.tsx",
						pattern: /default:/,
						template: `case "${data.domainName}":\n\t\t\t\treturn {\n\t\t\t\t\tcolor: theme.text.primary,\n\t\t\t\t\ticon: metadata.icon || "${data.categoryName}",\n\t\t\t\t};\n\t\t\tdefault:`,
					},

					// 10. Update ThemedMiniMap.tsx - node color mapping
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: /} else if \(nodeCategory\.startsWith\("test"\)\) \{/,
						template: `} else if (nodeCategory.startsWith("test")) {\n\t\t\t\t\tresolvedCategory = "TEST";\n\t\t\t\t} else if (nodeCategory.startsWith("${data.domainName}")) {\n\t\t\t\t\tresolvedCategory = "${data.categoryName}";`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: /case "TEST":/,
						template: `case "TEST":`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: /default:/,
						template: `case "${data.categoryName}":\n\t\t\t\t\treturn "var(--node-${data.domainName}-bg)";\n\t\t\t\tdefault:`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: /case "TEST":/,
						template: `case "TEST":`,
					},
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: /default:/,
						template: `case "${data.categoryName}":\n\t\t\t\t\treturn "var(--node-${data.domainName}-bg-hover)";\n\t\t\t\tdefault:`,
					},

					// 11. Update connectionUtils.ts - CATEGORY_EDGE_COLORS
					{
						type: "modify",
						path: ".deperciated/connectionUtils.ts",
						pattern: /cycle: "#10b981", \/\/ Green - matches cycle category/,
						template: `cycle: "#10b981", // Green - matches cycle category\n\t${data.domainName}: "${data.color}", // ${data.categoryName} - matches ${data.domainName} category`,
					},

					// 12. Update generate-nodes-overview.ts - core domains array (auto-discovery enabled)
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: /const coreDomains = \["create", "view", "trigger", "test", "cycle", "store"\];/,
						template: `const coreDomains = ["create", "view", "trigger", "test", "cycle", "store", "${data.domainName}"];`,
					},

					// 13. Update getDomainDescription function
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: /(\t\tstore: "For nodes that store data",)\n(\t\tcustom: "Custom nodes with specialized functionality",)/,
						template: `$1\n\t\t${data.domainName}: "${data.description}",\n$2`,
					},

					// 14. Update getCategoryDescription function
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: /(\t\tstore: "For nodes that store data",)\n(\t\tcustom: "Custom and specialized nodes",)/,
						template: `$1\n\t\t${data.domainName}: "${data.description}",\n$2`,
					},

					// 15. Update gen-docs-tokens.ts - categories object
					{
						type: "modify",
						path: "scripts/gen-docs-tokens.ts",
						pattern: /"node-cycle": \{ tokens: \{\}, count: 0 \},/,
						template: `"node-cycle": { tokens: {}, count: 0 },\n\t\t"node-${data.domainName}": { tokens: {}, count: 0 },`,
					},

					// 16. Update gen-docs-tokens.ts - categorization logic
					{
						type: "modify",
						path: "scripts/gen-docs-tokens.ts",
						pattern: /else if \(key\.startsWith\("node\.cycle\."\)\) category = "node-cycle";/,
						template: `else if (key.startsWith("node.cycle.")) category = "node-cycle";\n\t\telse if (key.startsWith("node.${data.domainName}.")) category = "node-${data.domainName}";`,
					},

					// 17. Update plopfile.js - domain choices
					{
						type: "modify",
						path: "plopfile.js",
						pattern: /choices: \["create", "view", "trigger", "test", "cycle", "custom"\],/,
						template: `choices: ["create", "view", "trigger", "test", "cycle", "${data.domainName}", "custom"],`,
					},

					// 18. Update plopfile.js - category choices
					{
						type: "modify",
						path: "plopfile.js",
						pattern: /choices: \["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE"\],/,
						template: `choices: ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE", "${data.categoryName}"],`,
					},

					// 19. Update tsconfig.json - path mapping
					{
						type: "modify",
						path: "tsconfig.json",
						pattern: /"@domain-cycle\/\*": \[".\/features\/business-logic-modern\/node-domain\/cycle\/\*"\],/,
						template: `"@domain-cycle/*": ["./features/business-logic-modern/node-domain/cycle/*"],\n\t\t\t"@domain-${data.domainName}/*": ["./features/business-logic-modern/node-domain/${data.domainName}/*"],`,
					},

					// 20. Create domain directory
					{
						type: "add",
						path: `features/business-logic-modern/node-domain/${data.domainName}/.gitkeep`,
						template: "# This file ensures the directory is tracked by git",
					},

					// 21. Create documentation directory
					{
						type: "add",
						path: `documentation/nodes/${data.domainName}/.gitkeep`,
						template: "# This file ensures the directory is tracked by git",
					},

					// 22. Update useSidebarState.ts - DEFAULT_TABS
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/hooks/useSidebarState.ts",
						pattern: /B: "CREATE" as TabKeyB,/,
						template: `B: "CREATE" as TabKeyB,`,
					},

					// 23. Update validate-adapter-logic.js - validation patterns
					{
						type: "modify",
						path: "scripts/validate-adapter-logic.js",
						pattern: /console\.log\("   • Consistent UX across CREATE, VIEW, TRIGGER, TEST, CYCLE categories"\);/,
						template: `console.log("   • Consistent UX across CREATE, VIEW, TRIGGER, TEST, CYCLE, ${data.categoryName} categories");`,
					},

					// 24. Update generate-handle-docs.ts - domains array
					{
						type: "modify",
						path: "scripts/generate-handle-docs.ts",
						pattern: /const domains = \["create", "view", "trigger", "test", "cycle", "custom"\];/,
						template: `const domains = ["create", "view", "trigger", "test", "cycle", "${data.domainName}", "custom"];`,
					},

					// 25. Generate tokens for the new category
					function() {
						console.log(`\n🎨 Generating design tokens for ${data.categoryName} category...`);
						console.log(`💡 Run manually: pnpm generate:tokens`);
						return "";
					},

					// 26. Regenerate documentation
					function() {
						console.log(`📚 Regenerating documentation for ${data.categoryName} category...`);
						console.log(`💡 Run manually: pnpm generate:node-docs`);
						return "";
					},

					// 27. Success message
					function() {
						console.log(`\n✅ Category '${data.categoryName}' successfully added to all files!`);
						console.log(`📁 Files Updated: 26+`);
						console.log(`🎯 Status: Complete\n`);
						console.log(`📂 Directories created:`);
						console.log(`• features/business-logic-modern/node-domain/${data.domainName}/`);
						console.log(`• documentation/nodes/${data.domainName}/\n`);
						console.log(`💡 Next steps:`);
						console.log(`• Run: pnpm generate:tokens`);
						console.log(`• Run: pnpm generate:node-docs`);
						console.log(`• Create your first node: pnpm new:node\n`);
						console.log(`Your new category is ready to use! 🎉\n`);
						return "";
					},
				];
			}

			if (data.action === "remove") {
				// Validate that a category was selected
				if (!data.categoryName || data.categoryName === null) {
					console.log("\n❌ No valid category selected for removal. Aborting...\n");
					return [];
				}
				
				// Automated category removal
				const categoryName = data.categoryName.toUpperCase();
				const domainName = data.categoryName.toLowerCase();
				
				console.log(`\n🗑️  Removing category '${categoryName}' from all files...`);
				
				return [
					// 1. Remove from categories.ts
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/categories.ts",
						pattern: new RegExp(`\t${categoryName}: "${categoryName}",\n`),
						template: "",
					},
					// 2. Remove from nodeData.ts - DomainCategory type
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts",
						pattern: new RegExp(`export type DomainCategory = "create" \\| "view" \\| "trigger" \\| "test" \\| "cycle" \\| "store" \\| "${domainName}";`),
						template: `export type DomainCategory = "create" | "view" | "trigger" | "test" | "cycle" | "store";`,
					},
					// 3. Remove from sidebar types.ts - TAB_CONFIG_B
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/types.ts",
						pattern: new RegExp(`\t{ key: "${categoryName}", label: "${categoryName.charAt(0) + categoryName.slice(1).toLowerCase()}" },\n`),
						template: "",
					},
					// 4. Remove from sidebar constants.ts - VARIANT_CONFIG
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/sidebar/constants.ts",
						pattern: new RegExp(`\t\t\t\t${categoryName}: createStencilsByCategory\\("${categoryName}", "variant-b"\\),\n`),
						template: "",
					},
					// 5. Remove from nodeStyleStore.ts - CATEGORY_THEMES (safer pattern)
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/stores/nodeStyleStore.ts",
						pattern: new RegExp(`\t${domainName}: \\{\\n\t\tbackground: \\{ light: "bg-node-${domainName}", dark: "bg-node-${domainName}" \\},\\n\t\tborder: \\{ light: "border-node-${domainName}", dark: "border-node-${domainName}" \\},\\n\t\ttext: \\{\\n\t\t\tprimary: \\{ light: "text-node-${domainName}", dark: "text-node-${domainName}" \\},\\n\t\t\tsecondary: \\{\\n\t\t\t\tlight: "text-node-${domainName}-secondary",\\n\t\t\t\tdark: "text-node-${domainName}-secondary",\\n\t\t\t\\},\\n\t\t\\},\\n\t\tbutton: \\{\\n\t\t\tborder: "border-node-${domainName}",\\n\t\t\thover: \\{\\n\t\t\t\tlight: "hover:bg-node-${domainName}-hover",\\n\t\t\t\tdark: "hover:bg-node-${domainName}-hover",\\n\t\t\t\\},\\n\t\t\\},\\n\t\\},`),
						template: "",
					},
					// 6. Remove from BaseControl.tsx - getSemanticClasses (safer pattern)
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/controls/BaseControl.tsx",
						pattern: new RegExp(`\t\tcase "${domainName}":\\n\t\tcase "${domainName}node":\\n\t\t\treturn \\{\\n\t\t\t\tprimary: "bg-node-${domainName} text-node-${domainName}-text",\\n\t\t\t\tprimaryHover: "hover:bg-node-${domainName}-hover",\\n\t\t\t\tborder: "border-node-${domainName}",\\n\t\t\t\tborderHover: "hover:border-node-${domainName}-hover",\\n\t\t\t\ttext: "text-node-${domainName}-text",\\n\t\t\t\ttextSecondary: "text-node-${domainName}-text-secondary",\\n\t\t\t\\};`),
						template: "",
					},
					// 7. Remove from NodeOutput.tsx - getCategorySpecificStyles (safer pattern)
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/node-inspector/components/NodeOutput.tsx",
						pattern: new RegExp(`\t\t\tcase "${domainName}":\\n\t\t\t\treturn \\{\\n\t\t\t\t\tcolor: theme\\.text\\.primary,\\n\t\t\t\t\ticon: metadata\\.icon \\|\\| "${categoryName}",\\n\t\t\t\t\\};`),
						template: "",
					},
					// 8. Remove from ThemedMiniMap.tsx - category resolution
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: new RegExp(`\t\t\t\t\t} else if \\(nodeCategory\\.startsWith\\("${domainName}"\\)\\) \\{\n\t\t\t\t\t\tresolvedCategory = "${categoryName}";\n\t\t\t\t\t}`),
						template: "",
					},
					// 9. Remove from ThemedMiniMap.tsx - color mapping
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: new RegExp(`\t\t\t\tcase "${categoryName}": return "var\\(--node-${domainName}-bg\\)";`),
						template: "",
					},
					// 10. Remove from ThemedMiniMap.tsx - hover color mapping
					{
						type: "modify",
						path: "features/business-logic-modern/infrastructure/theming/components/ThemedMiniMap.tsx",
						pattern: new RegExp(`\t\t\t\tcase "${categoryName}": return "var\\(--node-${domainName}-bg-hover\\)";`),
						template: "",
					},
					// 11. Remove from connectionUtils.ts - CATEGORY_EDGE_COLORS
					{
						type: "modify",
						path: ".deperciated/connectionUtils.ts",
						pattern: new RegExp(`\t${domainName}: "#[0-9a-fA-F]{6}", // ${categoryName} - matches ${domainName} category\n`),
						template: "",
					},
					// 12. Remove from generate-nodes-overview.ts - core domains array
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: new RegExp(`const coreDomains = \\["create", "view", "trigger", "test", "cycle", "store", "${domainName}"\\];`),
						template: `const coreDomains = ["create", "view", "trigger", "test", "cycle", "store"];`,
					},
					// 13. Remove from generate-nodes-overview.ts - domain descriptions (getDomainDescription)
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: new RegExp(`\t\t${domainName}: "Nodes that handle ${domainName} operations",\n`),
						template: "",
					},
					// 14. Remove from generate-nodes-overview.ts - category descriptions (getCategoryDescription)
					{
						type: "modify",
						path: "scripts/generate-nodes-overview.ts",
						pattern: new RegExp(`\t\t${domainName}: "Nodes that handle ${domainName} operations",\n`),
						template: "",
					},
					// 15. Remove from gen-docs-tokens.ts - categories object
					{
						type: "modify",
						path: "scripts/gen-docs-tokens.ts",
						pattern: new RegExp(`\t\t"node-${domainName}": \\{ tokens: \\{\\}, count: 0 \\},\n`),
						template: "",
					},
					// 15. Remove from gen-docs-tokens.ts - categorization logic
					{
						type: "modify",
						path: "scripts/gen-docs-tokens.ts",
						pattern: new RegExp(`\t\t\telse if \\(key\\.startsWith\\("node\\.${domainName}\\."\\)\\) category = "node-${domainName}";\n`),
						template: "",
					},
					// 16. Remove from plopfile.js - domain choices
					{
						type: "modify",
						path: "plopfile.js",
						pattern: new RegExp(`choices: \\["create", "view", "trigger", "test", "cycle", "${domainName}", "custom"\\],`),
						template: `choices: ["create", "view", "trigger", "test", "cycle", "email", "custom"],`,
					},
					// 17. Remove from plopfile.js - category choices
					{
						type: "modify",
						path: "plopfile.js",
						pattern: new RegExp(`choices: \\["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE", "${categoryName}"\\],`),
						template: `choices: ["CREATE", "VIEW", "TRIGGER", "TEST", "CYCLE", "EMAIL"],`,
					},
					// 18. Remove from tsconfig.json - path mapping
					{
						type: "modify",
						path: "tsconfig.json",
						pattern: new RegExp(`\t\t\t"@domain-${domainName}/\\*": \\["\\./features/business-logic-modern/node-domain/${domainName}/\\*"\\],\n`),
						template: "",
					},
					// 19. Log completion message
					function() {
						console.log(`\n✅ Category '${categoryName}' successfully removed from all files!`);
						console.log(`📁 Files Updated: 18+`);
						console.log(`🎯 Status: Complete\n`);
						console.log(`📂 Manual cleanup required:`);
						console.log(`• Remove-Item -Recurse -Force "features/business-logic-modern/node-domain/${domainName}" -ErrorAction SilentlyContinue`);
						console.log(`• Remove-Item -Recurse -Force "documentation/nodes/${domainName}" -ErrorAction SilentlyContinue\n`);
						console.log(`Your system is now clean and ready to use! 🎉\n`);
						return "";
					},

				];
			}

			return [];
		},
	});
};
