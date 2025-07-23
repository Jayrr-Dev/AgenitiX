/**
 * NODES OVERVIEW GENERATOR - Creates comprehensive overview of all available nodes
 *
 * • Scans all node domains and generates overview documentation
 * • Shows nodes by category with descriptions and features
 * • Creates both markdown and HTML overview pages
 * • Includes statistics and usage information
 * • Auto-updates when new nodes are added
 *
 * Keywords: nodes-overview, category-documentation, node-inventory, auto-generation
 */

import fs from "fs";
import path from "path";

interface NodeInfo {
	kind: string;
	domain: string;
	category: string;
	displayName: string;
	filePath: string;
	description?: string;
	features?: string[];
	theming?: {
		category: string;
		designTokens: {
			background: string;
			border: string;
			text: string;
		};
		responsive: {
			mobileOptimized: boolean;
			tabletOptimized: boolean;
			desktopOptimized: boolean;
		};
		accessibility: {
			keyboardSupport: boolean;
			screenReaderSupport: boolean;
			focusManagement: boolean;
		};
	};
}

interface CategoryInfo {
	name: string;
	description: string;
	nodes: NodeInfo[];
	count: number;
}

interface DomainInfo {
	name: string;
	description: string;
	categories: CategoryInfo[];
	totalNodes: number;
}

/**
 * Scan for all available nodes
 */
function scanNodes(): DomainInfo[] {
	const nodeBasePath = path.join(process.cwd(), "features/business-logic-modern/node-domain");
	const domains = ["create", "view", "trigger", "test", "cycle", "custom"];
	const domainInfo: DomainInfo[] = [];

	domains.forEach((domain) => {
		const domainPath = path.join(nodeBasePath, domain);
		if (!fs.existsSync(domainPath)) return;

		const domainDescription = getDomainDescription(domain);
		const categories: CategoryInfo[] = [];
		const categoryMap = new Map<string, NodeInfo[]>();

		// Scan for node files
		const files = fs
			.readdirSync(domainPath)
			.filter((file) => file.endsWith(".node.tsx"))
			.map((file) => {
				const kind = file.replace(".node.tsx", "");
				return { kind, filePath: path.join(domainPath, file) };
			});

		// Read node files to extract information
		files.forEach(({ kind, filePath }) => {
			try {
				const content = fs.readFileSync(filePath, "utf8");
				const nodeInfo = extractNodeInfo(content, kind, domain, filePath);

				if (!categoryMap.has(nodeInfo.category)) {
					categoryMap.set(nodeInfo.category, []);
				}
				categoryMap.get(nodeInfo.category)!.push(nodeInfo);
			} catch (error) {
				console.warn(`⚠️  Could not read node file: ${filePath}`);
			}
		});

		// Convert to CategoryInfo objects
		categoryMap.forEach((nodes, categoryName) => {
			const categoryDescription = getCategoryDescription(categoryName);
			categories.push({
				name: categoryName,
				description: categoryDescription,
				nodes: nodes.sort((a, b) => a.displayName.localeCompare(b.displayName)),
				count: nodes.length,
			});
		});

		// Sort categories by name
		categories.sort((a, b) => a.name.localeCompare(b.name));

		const totalNodes = categories.reduce((sum, cat) => sum + cat.count, 0);

		domainInfo.push({
			name: domain,
			description: domainDescription,
			categories,
			totalNodes,
		});
	});

	return domainInfo;
}

/**
 * Extract node information from file content
 */
function extractNodeInfo(
	content: string,
	kind: string,
	domain: string,
	filePath: string
): NodeInfo {
	// Extract display name from spec
	const displayNameMatch = content.match(/displayName:\s*['"`]([^'"`]+)['"`]/);
	const displayName = displayNameMatch ? displayNameMatch[1] : kind;

	// Extract category from spec
	const categoryMatch = content.match(/category:\s*CATEGORIES\.([A-Z_]+)/);
	const category = categoryMatch ? categoryMatch[1].toLowerCase() : "unknown";

	// Extract description from comments
	const descriptionMatch = content.match(/\/\*\*[\s\S]*?\*\//);
	const description = descriptionMatch
		? descriptionMatch[0]
				.replace(/\/\*\*|\*\//g, "")
				.replace(/\*/g, "")
				.trim()
		: `The ${displayName} node provides functionality for ${domain} operations.`;

	// Extract features from comments
	const features: string[] = [];
	if (content.includes("Type-safe")) features.push("Type-safe validation");
	if (content.includes("Schema-driven")) features.push("Schema-driven controls");
	if (content.includes("Enterprise")) features.push("Enterprise validation");
	if (content.includes("Design system")) features.push("Design system integration");
	if (content.includes("Expandable")) features.push("Expandable UI");
	if (content.includes("JSON")) features.push("JSON I/O");

	// Extract theming information
	const theming = extractThemingInfo(content, category);

	return {
		kind,
		domain,
		category,
		displayName,
		filePath,
		description,
		features,
		theming,
	};
}

/**
 * Extract theming information from node content
 */
function extractThemingInfo(content: string, category: string) {
	const categoryLower = category.toLowerCase();

	// Default design tokens based on category
	const designTokens = {
		background: `var(--node-${categoryLower}-bg)`,
		border: `var(--node-${categoryLower}-border)`,
		text: `var(--node-${categoryLower}-text)`,
	};

	// Analyze responsive design patterns
	const responsiveClasses = [
		"sm:",
		"md:",
		"lg:",
		"xl:",
		"2xl:",
		"max-sm:",
		"max-md:",
		"max-lg:",
		"max-xl:",
	];
	const hasResponsiveClasses = responsiveClasses.some((cls) => content.includes(cls));

	const responsive = {
		mobileOptimized: content.includes("sm:") || content.includes("max-sm:"),
		tabletOptimized: content.includes("md:") || content.includes("lg:"),
		desktopOptimized: content.includes("xl:") || content.includes("2xl:") || hasResponsiveClasses,
	};

	// Analyze accessibility features
	const accessibility = {
		keyboardSupport:
			content.includes("onKeyDown") ||
			content.includes("onKeyUp") ||
			content.includes("onKeyPress") ||
			content.includes("tabIndex"),
		screenReaderSupport:
			content.includes("aria-label") || content.includes("role=") || content.includes("aria-"),
		focusManagement:
			content.includes("focus") || content.includes("blur") || content.includes("tabIndex"),
	};

	return {
		category,
		designTokens,
		responsive,
		accessibility,
	};
}

/**
 * Get domain description
 */
function getDomainDescription(domain: string): string {
	const descriptions: Record<string, string> = {
		create: "Nodes that create or generate data, content, or resources",
		view: "Nodes that display, visualize, or present data",
		trigger: "Nodes that respond to events, conditions, or triggers",
		test: "Nodes for testing, validation, and quality assurance",
		cycle: "Nodes that handle iterative operations, loops, and cycles",
		custom: "Custom nodes with specialized functionality",
	};
	return descriptions[domain] || `Nodes for ${domain} operations`;
}

/**
 * Get category description
 */
function getCategoryDescription(category: string): string {
	const descriptions: Record<string, string> = {
		create: "Data creation and generation nodes",
		view: "Data visualization and display nodes",
		trigger: "Event-driven and conditional nodes",
		test: "Testing and validation nodes",
		cycle: "Iterative and loop-based nodes",
		custom: "Custom and specialized nodes",
	};
	return descriptions[category] || `${category} category nodes`;
}

/**
 * Generate markdown overview
 */
function generateMarkdownOverview(domainInfo: DomainInfo[]): string {
	const totalNodes = domainInfo.reduce((sum, domain) => sum + domain.totalNodes, 0);
	const totalCategories = domainInfo.reduce((sum, domain) => sum + domain.categories.length, 0);

	let markdown = `# Nodes Overview

This document provides a comprehensive overview of all available nodes in the Agenitix-2 system.

## 📊 Statistics

- **Total Nodes:** ${totalNodes}
- **Total Domains:** ${domainInfo.length}
- **Total Categories:** ${totalCategories}
- **Last Updated:** ${new Date().toLocaleString()}

## 🎯 Quick Navigation

`;

	// Add quick navigation
	domainInfo.forEach((domain) => {
		markdown += `### ${domain.name.charAt(0).toUpperCase() + domain.name.slice(1)} Domain\n`;
		domain.categories.forEach((category) => {
			markdown += `- [${category.name}](#${domain.name}-${category.name}) (${category.count} nodes)\n`;
		});
		markdown += "\n";
	});

	// Generate detailed sections
	domainInfo.forEach((domain) => {
		markdown += `## ${domain.name.charAt(0).toUpperCase() + domain.name.slice(1)} Domain\n\n`;
		markdown += `${domain.description}\n\n`;

		domain.categories.forEach((category) => {
			markdown += `### ${category.name.charAt(0).toUpperCase() + category.name.slice(1)} Category\n\n`;
			markdown += `${category.description}\n\n`;
			markdown += `**Nodes (${category.count}):**\n\n`;

			category.nodes.forEach((node) => {
				markdown += `#### ${node.displayName}\n\n`;
				markdown += `- **Type:** \`${node.kind}\`\n`;
				markdown += `- **Domain:** ${node.domain}\n`;
				markdown += `- **Category:** ${node.category}\n`;
				if (node.description) {
					markdown += `- **Description:** ${node.description}\n`;
				}
				if (node.features && node.features.length > 0) {
					markdown += `- **Features:** ${node.features.join(", ")}\n`;
				}
				if (node.theming) {
					markdown += `- **Theming:** ${node.theming.category} category\n`;
					markdown += `  - **Design Tokens:** ${node.theming.designTokens.background}, ${node.theming.designTokens.border}, ${node.theming.designTokens.text}\n`;
					markdown += `  - **Responsive:** ${node.theming.responsive.mobileOptimized ? "📱" : ""}${node.theming.responsive.tabletOptimized ? "📱" : ""}${node.theming.responsive.desktopOptimized ? "💻" : ""} ${node.theming.responsive.mobileOptimized || node.theming.responsive.tabletOptimized || node.theming.responsive.desktopOptimized ? "Optimized" : "Not optimized"}\n`;
					markdown += `  - **Accessibility:** ${node.theming.accessibility.keyboardSupport ? "⌨️" : ""}${node.theming.accessibility.screenReaderSupport ? "🔊" : ""}${node.theming.accessibility.focusManagement ? "🎯" : ""} ${node.theming.accessibility.keyboardSupport || node.theming.accessibility.screenReaderSupport || node.theming.accessibility.focusManagement ? "Supported" : "Basic support"}\n`;
				}
				markdown += `- **File:** \`${node.filePath.replace(process.cwd(), "")}\`\n`;
				markdown += `- **Documentation:** [Markdown](./${node.domain}/${node.kind}.md) | [HTML](./${node.domain}/${node.kind}.html)\n\n`;
			});
		});
	});

	// Add usage section
	markdown += `## 🚀 Usage

### Creating New Nodes

\`\`\`bash
# Generate a new node
pnpm new:node

# This will automatically:
# ✅ Create the node file
# ✅ Update all registries  
# ✅ Generate documentation
# ✅ Add to this overview
\`\`\`

### Viewing Documentation

\`\`\`bash
# Open node documentation
open documentation/nodes/

# View specific node docs
open documentation/nodes/create/your-node.html
\`\`\`

## 📁 File Structure

\`\`\`
features/business-logic-modern/node-domain/
├── create/           # Create domain nodes
├── view/            # View domain nodes
├── trigger/         # Trigger domain nodes
├── test/            # Test domain nodes
├── cycle/           # Cycle domain nodes
└── custom/          # Custom domain nodes
\`\`\`

## 🎨 Node Standards

All nodes follow these standards:

- ✅ **Type-safe** - Full TypeScript support with Zod validation
- ✅ **Schema-driven** - Controls auto-generated from data schema
- ✅ **Themed** - Category-specific design system integration
- ✅ **Expandable** - Collapsed and expanded UI states
- ✅ **Validated** - Enterprise-grade error handling
- ✅ **Documented** - Auto-generated comprehensive documentation

---

*This overview is automatically generated and updated when new nodes are created.*
`;

	return markdown;
}

/**
 * Generate HTML overview
 */
function generateHTMLOverview(domainInfo: DomainInfo[]): string {
	const totalNodes = domainInfo.reduce((sum, domain) => sum + domain.totalNodes, 0);
	const totalCategories = domainInfo.reduce((sum, domain) => sum + domain.categories.length, 0);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nodes Overview - Agenitix-2</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      background: #f9fafb;
    }
    
    .container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 2rem;
      margin-bottom: 2rem;
    }
    
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 2.5rem;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    
    .stat-card {
      text-align: center;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e40af;
      display: block;
    }
    
    .stat-label {
      color: #64748b;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .domain-section {
      margin: 3rem 0;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .domain-header {
      background: #1e40af;
      color: white;
      padding: 1.5rem;
    }
    
    .domain-title {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .domain-description {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
    }
    
    .domain-stats {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    
    .category-section {
      border-bottom: 1px solid #e5e7eb;
    }
    
    .category-header {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .category-title {
      margin: 0;
      color: #374151;
      font-size: 1.25rem;
    }
    
    .category-description {
      margin: 0.25rem 0 0 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .nodes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      padding: 1.5rem;
    }
    
    .node-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.2s ease;
    }
    
    .node-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    
    .node-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem 0;
    }
    
    .node-type {
      font-family: monospace;
      color: #059669;
      font-size: 0.875rem;
      background: #ecfdf5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    
    .node-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0.5rem 0;
    }
    
    .node-features {
      margin: 0.5rem 0;
    }
    
    .feature-tag {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      margin: 0.125rem;
    }
    
    .node-links {
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }
    
    .node-links a {
      color: #1e40af;
      text-decoration: none;
      margin-right: 1rem;
    }
    
    .node-links a:hover {
      text-decoration: underline;
    }
    
    .navigation {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    
    .nav-title {
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }
    
    .nav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .nav-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.75rem;
    }
    
    .nav-item-title {
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.25rem 0;
    }
    
    .nav-item-count {
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .usage-section {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    
    .usage-title {
      font-weight: 600;
      color: #0369a1;
      margin: 0 0 1rem 0;
    }
    
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    code {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Nodes Overview</h1>
      <p>Comprehensive overview of all available nodes in the Agenitix-2 system</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${totalNodes}</span>
        <div class="stat-label">Total Nodes</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${domainInfo.length}</span>
        <div class="stat-label">Domains</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${totalCategories}</span>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${new Date().toLocaleDateString()}</span>
        <div class="stat-label">Last Updated</div>
      </div>
    </div>
    
    <div class="navigation">
      <h3 class="nav-title">Quick Navigation</h3>
      <div class="nav-grid">
        ${domainInfo
					.map(
						(domain) => `
          <div class="nav-item">
            <div class="nav-item-title">${domain.name.charAt(0).toUpperCase() + domain.name.slice(1)} Domain</div>
            <div class="nav-item-count">${domain.totalNodes} nodes in ${domain.categories.length} categories</div>
          </div>
        `
					)
					.join("")}
      </div>
    </div>
    
    ${domainInfo
			.map(
				(domain) => `
      <div class="domain-section">
        <div class="domain-header">
          <h2 class="domain-title">${domain.name.charAt(0).toUpperCase() + domain.name.slice(1)} Domain</h2>
          <p class="domain-description">${domain.description}</p>
          <div class="domain-stats">
            <span>${domain.totalNodes} nodes</span>
            <span>${domain.categories.length} categories</span>
          </div>
        </div>
        
        ${domain.categories
					.map(
						(category) => `
          <div class="category-section">
            <div class="category-header">
              <h3 class="category-title">${category.name.charAt(0).toUpperCase() + category.name.slice(1)} Category</h3>
              <p class="category-description">${category.description} (${category.count} nodes)</p>
            </div>
            
            <div class="nodes-grid">
              ${category.nodes
								.map(
									(node) => `
                <div class="node-card">
                  <div class="node-title">${node.displayName}</div>
                  <div class="node-type">${node.kind}</div>
                  ${node.description ? `<div class="node-description">${node.description}</div>` : ""}
                  ${
										node.features && node.features.length > 0
											? `
                    <div class="node-features">
                      ${node.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("")}
                    </div>
                  `
											: ""
									}
                  <div class="node-links">
                    <a href="./${node.domain}/${node.kind}.html">📄 Documentation</a>
                    <a href="./${node.domain}/${node.kind}.md">📝 Markdown</a>
                  </div>
                </div>
              `
								)
								.join("")}
            </div>
          </div>
        `
					)
					.join("")}
      </div>
    `
			)
			.join("")}
    
    <div class="usage-section">
      <h3 class="usage-title">🚀 Usage</h3>
      
      <h4>Creating New Nodes</h4>
      <pre><code># Generate a new node
pnpm new:node

# This will automatically:
# ✅ Create the node file
# ✅ Update all registries  
# ✅ Generate documentation
# ✅ Add to this overview</code></pre>
      
      <h4>Viewing Documentation</h4>
      <pre><code># Open node documentation
open documentation/nodes/

# View specific node docs
open documentation/nodes/create/your-node.html</code></pre>
    </div>
    
    <hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="text-align: center; color: #6b7280; font-size: 0.875rem;">
      This overview is automatically generated and updated when new nodes are created.
    </p>
  </div>
</body>
</html>`;
}

/**
 * Main function
 */
function generateNodesOverview() {
	console.log("🔍 Scanning for nodes...");
	const domainInfo = scanNodes();

	if (domainInfo.length === 0) {
		console.log("❌ No nodes found");
		return;
	}

	console.log(
		`✅ Found ${domainInfo.reduce((sum, domain) => sum + domain.totalNodes, 0)} nodes across ${domainInfo.length} domains`
	);

	// Ensure documentation directory exists
	const docsDir = path.join(process.cwd(), "documentation", "nodes");
	if (!fs.existsSync(docsDir)) {
		fs.mkdirSync(docsDir, { recursive: true });
	}

	// Generate markdown overview
	const markdownContent = generateMarkdownOverview(domainInfo);
	const markdownPath = path.join(docsDir, "OVERVIEW.md");
	fs.writeFileSync(markdownPath, markdownContent);

	// Generate HTML overview
	const htmlContent = generateHTMLOverview(domainInfo);
	const htmlPath = path.join(docsDir, "overview.html");
	fs.writeFileSync(htmlPath, htmlContent);

	console.log("✅ Generated nodes overview");
	console.log(`   📄 Markdown: ${markdownPath}`);
	console.log(`   🌐 HTML: ${htmlPath}`);
}

// CLI support
if (require.main === module) {
	generateNodesOverview();
}

export { generateNodesOverview };
