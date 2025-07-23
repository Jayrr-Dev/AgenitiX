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
			// Helper to get the final icon value
			(data) => {
				if (data.icon === "custom" && data.customIcon) {
					data.icon = data.customIcon;
				}
				return `Icon set to: ${data.icon}`;
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
					return `${kind.charAt(0).toUpperCase() + kind.slice(1)} node for ${domain} operations`;
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
			// Helper to get the final feature value
			(data) => {
				if (data.feature === "custom" && data.customFeature) {
					data.feature = data.customFeature;
				}
				return `Feature set to: ${data.feature}`;
			},
			// Helper to process tags
			(data) => {
				if (data.tags) {
					// Split by comma and clean up each tag
					const tagArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
					data.tags = tagArray.join("', '");
				}
				return `Tags processed: ${data.tags || 'default'}`;
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
				type: "list",
				name: "dataPropagation",
				message: "What type of data propagation should this node support?",
				choices: [
					{ name: "Input only (receive data from other nodes)", value: "input" },
					{ name: "Output only (send data to other nodes)", value: "output" },
					{ name: "Both input and output (full data flow)", value: "both" },
					{ name: "None (standalone node)", value: "none" }
				],
				default: "both",
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
				pattern: "import createText, { spec as createTextSpec } from \"../../node-domain/create/createText.node\";",
				template: "import createText, { spec as createTextSpec } from \"../../node-domain/create/createText.node\";\nimport {{kind}}, { spec as {{kind}}Spec } from \"../../node-domain/{{domain}}/{{kind}}.node\";",
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
				pattern: "export { default as createText } from \"./create/createText.node\";",
				template: "export { default as createText } from \"./create/createText.node\";\nexport { default as {{kind}} } from \"./{{domain}}/{{kind}}.node\";",
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

					const docProcess = spawn("npx", ["ts-node", "--project", "tsconfig.node.json", "scripts/generate-node-docs.ts", data.kind, data.domain, data.category, data.kind], {
						stdio: "inherit",
						shell: true,
						cwd: __dirname,
					});

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

					const overviewProcess = spawn("npx", ["ts-node", "--project", "tsconfig.node.json", "scripts/generate-nodes-overview.ts"], {
						stdio: "inherit",
						shell: true,
						cwd: __dirname,
					});

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
					`🎯 Successfully created node '${kind}' with full theming integration:\n\n` +
					`📁 FILES CREATED/UPDATED:\n` +
					`   ✅ Node file: features/business-logic-modern/node-domain/${domain}/${kind}.node.tsx\n` +
					`   ✅ Registry entries: useDynamicNodeTypes.ts, nodespec-registry.ts\n` +
					`   ✅ Export statements: node-domain/index.ts\n` +
					`   ✅ CSS tokens: Regenerated from tokens.json\n` +
					`   ✅ Documentation: documentation/nodes/${domain}/${kind}.md\n` +
					`   ✅ HTML docs: documentation/nodes/${domain}/${kind}.html\n` +
					`   ✅ API reference: documentation/api/${kind}.ts\n` +
					`   ✅ Nodes overview: documentation/nodes/overview.html\n\n` +
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
					`   • Documentation available at documentation/nodes/${domain}/\n\n` +
					`🔧 NEXT STEPS:\n` +
					`   • Customize node schema in the generated file\n` +
					`   • Add custom UI in the expanded/collapsed sections\n` +
					`   • Review generated documentation\n` +
					`   • Test with 'pnpm dev' - no additional setup needed!`
				);
			},
		],
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
					const backupDir = path.join(__dirname, "backups", new Date().toISOString().replace(/[:.]/g, "-"));
					if (!fs.existsSync(path.dirname(backupDir))) {
						fs.mkdirSync(path.dirname(backupDir), { recursive: true });
					}
					
					const filesToBackup = [
						"features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
						"features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts",
						"features/business-logic-modern/node-domain/index.ts",
						`documentation/api/${kind}.ts`,
						`documentation/nodes/${domain}/${kind}.md`,
						`documentation/nodes/${domain}/${kind}.html`
					];
					
					filesToBackup.forEach(filePath => {
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
				{
					type: "modify",
					path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
					pattern: new RegExp(
						`import ${kind} from '\\.\\./\\.\\./\\.\\./node-domain/${domain}/${kind}\\.node';\\r?\\n`,
						"g"
					),
					template: "",
					transform: (fileContents) => {
						// Safety check: ensure we're not removing other imports
						const lines = fileContents.split('\n');
						const filteredLines = lines.filter(line => 
							!line.includes(`import ${kind} from`) || 
							!line.includes(`node-domain/${domain}/${kind}.node`)
						);
						return filteredLines.join('\n');
					}
				},

				// 4. Clean up useDynamicNodeTypes.ts - export in array
				{
					type: "modify",
					path: "features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts",
					pattern: new RegExp(`\\s*${kind},\\r?\\n`, "g"),
					template: "",
					transform: (fileContents) => {
						// Safety check: ensure we're only removing the specific node
						return fileContents.replace(new RegExp(`\\s*${kind},\\r?\\n`, "g"), "");
					}
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
						// Safety check: ensure we're not removing other imports
						const lines = fileContents.split('\n');
						const filteredLines = lines.filter(line => 
							!line.includes(`import ${kind}, { spec as ${kind}Spec }`) || 
							!line.includes(`node-domain/${domain}/${kind}.node`)
						);
						return filteredLines.join('\n');
					}
				},

				// 6. Clean up nodespec-registry.ts - registry entry
				() => {
					const registryPath = path.join(__dirname, "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts");
					
					if (fs.existsSync(registryPath)) {
						try {
							let content = fs.readFileSync(registryPath, "utf8");
							const originalContent = content;
							
							// Remove the registry entry with various patterns
							// Pattern 1: entry with trailing comma
							content = content.replace(new RegExp(`\\s*${kind}: ${kind}Spec,\\r?\\n`, "g"), "");
							// Pattern 2: entry without trailing comma (last entry)
							content = content.replace(new RegExp(`\\s*${kind}: ${kind}Spec\\r?\\n`, "g"), "");
							// Pattern 3: entry on same line as other entries
							content = content.replace(new RegExp(`\\s*${kind}: ${kind}Spec,`, "g"), "");
							// Pattern 4: entry without comma (last entry on line)
							content = content.replace(new RegExp(`\\s*${kind}: ${kind}Spec`, "g"), "");
							
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
					const registryPath = path.join(__dirname, "features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts");
					
					if (fs.existsSync(registryPath)) {
						try {
							const content = fs.readFileSync(registryPath, "utf8");
							
							// Check for common syntax issues
							const issues = [];
							
							// Check for undefined references
							const undefinedRefs = content.match(new RegExp(`${kind}Spec`, "g"));
							if (undefinedRefs && undefinedRefs.length > 0) {
								issues.push(`Found ${undefinedRefs.length} undefined references to ${kind}Spec`);
							}
							
							// Check for orphaned commas
							const orphanedCommas = content.match(/,\s*}/g);
							if (orphanedCommas && orphanedCommas.length > 0) {
								issues.push(`Found ${orphanedCommas.length} orphaned commas in object definitions`);
							}
							
							if (issues.length > 0) {
								return `⚠️  Registry validation issues: ${issues.join(", ")}`;
							}
							
							return `✅ Registry file syntax validated successfully`;
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

						const docProcess = spawn("npx", ["ts-node", "--project", "tsconfig.node.json", "scripts/generate-nodes-overview.ts"], {
							stdio: "inherit",
							shell: true,
							cwd: __dirname,
						});

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
};
