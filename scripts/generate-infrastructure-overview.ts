/**
 * Infrastructure Overview Generator
 *
 * Automatically generates the infrastructure components overview by scanning
 * the features/business-logic-modern/infrastructure directory and creating
 * documentation for all infrastructure components.
 *
 * Features:
 * - Scans infrastructure directory for all components
 * - Generates comprehensive documentation
 * - Creates overview with links to detailed docs
 * - Updates main infrastructure README
 *
 * Usage: pnpm run generate:infrastructure-overview
 */

import fs from "fs";
import path from "path";

interface InfrastructureComponent {
	name: string;
	path: string;
	description: string;
	features: string[];
	hasDocumentation: boolean;
	hasReadme: boolean;
	componentCount: number;
	fileCount: number;
}

interface InfrastructureStats {
	total: number;
	documented: number;
	components: InfrastructureComponent[];
}

const INFRASTRUCTURE_DIR = path.join(
	process.cwd(),
	"features/business-logic-modern/infrastructure"
);
const DOCUMENTATION_DIR = path.join(process.cwd(), "documentation/infrastructure");
const OUTPUT_FILE = path.join(process.cwd(), "documentation/infrastructure/overview.html");

const COMPONENT_DESCRIPTIONS: { [key: string]: string } = {
	"action-toolbar":
		"Centralized action management with undo/redo functionality and history tracking",
	"node-core": "Core node functionality including data schemas, validation, and utilities",
	"node-inspector": "Primary interface for inspecting and editing nodes with dynamic controls",
	"node-registry": "Node registration, discovery, and metadata management system",
	sidebar:
		"Enhanced node creation and management panel with registry integration and drag-and-drop",
	theming: "Comprehensive design system with design tokens and theme switching",
	versioning: "Version control system for flows and components with migration support",
	telemetry: "Analytics and monitoring infrastructure for tracking user interactions",
	"run-history":
		"Workflow run tracking and execution history management with performance analytics",
	"flow-engine": "Core execution engine for running flows and managing node states",
	credentials: "Secure credential management system for API keys and authentication",
	components: "Shared infrastructure components and utilities",
};

const COMPONENT_FEATURES: { [key: string]: string[] } = {
	"action-toolbar": ["Undo/Redo", "History Tracking", "Branch Management", "Action Routing"],
	"node-core": ["Data Schemas", "Validation", "Core Utilities", "Type Safety"],
	"node-inspector": [
		"Dynamic Controls",
		"Real-time Validation",
		"Error Management",
		"Responsive Design",
	],
	"node-registry": ["Node Registration", "Discovery", "Metadata Management", "Dynamic Loading"],
	sidebar: [
		"Registry Integration",
		"Tabbed Interface",
		"Drag-and-Drop",
		"Custom Node Management",
		"Variant System",
	],
	theming: ["Design Tokens", "Theme Switching", "Component Theming", "CSS Variables"],
	versioning: ["Version Control", "Migration Support", "Backward Compatibility", "Change Tracking"],
	telemetry: ["Analytics", "Monitoring", "Performance Tracking", "Error Reporting"],
	"run-history": [
		"Run Tracking",
		"Status Management",
		"Timing Metrics",
		"Performance Analytics",
		"Integration Ready",
	],
	"flow-engine": ["Flow Execution", "Node States", "Error Handling", "Performance"],
	credentials: ["Secure Storage", "API Keys", "Authentication", "Encryption"],
	components: ["Shared Components", "Utilities", "Hooks", "Services"],
};

function getComponentDescription(componentName: string): string {
	return (
		COMPONENT_DESCRIPTIONS[componentName] ||
		"Infrastructure component providing essential services and functionality."
	);
}

function getComponentFeatures(componentName: string): string[] {
	return (
		COMPONENT_FEATURES[componentName] || [
			"Core Functionality",
			"Integration",
			"Performance",
			"Security",
		]
	);
}

function countFiles(dir: string): number {
	if (!fs.existsSync(dir)) return 0;

	let count = 0;
	const items = fs.readdirSync(dir);

	for (const item of items) {
		const itemPath = path.join(dir, item);
		const stat = fs.statSync(itemPath);

		if (stat.isDirectory()) {
			count += countFiles(itemPath);
		} else if (
			item.endsWith(".ts") ||
			item.endsWith(".tsx") ||
			item.endsWith(".js") ||
			item.endsWith(".jsx")
		) {
			count++;
		}
	}

	return count;
}

function countComponents(dir: string): number {
	if (!fs.existsSync(dir)) return 0;

	let count = 0;
	const items = fs.readdirSync(dir);

	for (const item of items) {
		const itemPath = path.join(dir, item);
		const stat = fs.statSync(itemPath);

		if (stat.isDirectory()) {
			count += countComponents(itemPath);
		} else if (item.endsWith(".tsx") && !item.startsWith(".")) {
			count++;
		}
	}

	return count;
}

function scanInfrastructureComponents(): InfrastructureComponent[] {
	const components: InfrastructureComponent[] = [];

	if (!fs.existsSync(INFRASTRUCTURE_DIR)) {
		console.log("❌ Infrastructure directory not found");
		return components;
	}

	const items = fs.readdirSync(INFRASTRUCTURE_DIR);

	for (const item of items) {
		const itemPath = path.join(INFRASTRUCTURE_DIR, item);
		const stat = fs.statSync(itemPath);

		if (stat.isDirectory()) {
			const componentName = item;
			const docPath = path.join(DOCUMENTATION_DIR, componentName, "README.md");
			const readmePath = path.join(itemPath, "README.md");

			components.push({
				name: componentName,
				path: itemPath,
				description: getComponentDescription(componentName),
				features: getComponentFeatures(componentName),
				hasDocumentation: fs.existsSync(docPath),
				hasReadme: fs.existsSync(readmePath),
				componentCount: countComponents(itemPath),
				fileCount: countFiles(itemPath),
			});
		}
	}

	return components;
}

function generateStats(components: InfrastructureComponent[]): InfrastructureStats {
	return {
		total: components.length,
		documented: components.filter((c) => c.hasDocumentation).length,
		components,
	};
}

function generateComponentCard(component: InfrastructureComponent): string {
	const searchTerms = [component.name, ...component.features].join(" ").toLowerCase();

	return `
      <div class="component-card" data-search="${searchTerms}">
        <div class="component-header">
          <div class="component-title">${component.name.charAt(0).toUpperCase() + component.name.slice(1)}</div>
          <div class="component-stats">
            <span class="stat">${component.componentCount} components</span>
            <span class="stat">${component.fileCount} files</span>
          </div>
        </div>
        <div class="component-description">
          ${component.description}
        </div>
        <div class="component-features">
          ${component.features.map((feature) => `<span class="feature-tag">${feature}</span>`).join("\n          ")}
        </div>
        <div class="component-actions">
          ${component.hasDocumentation ? `<a href="./${component.name}/README.md" class="action-btn">Documentation</a>` : ""}
          ${component.hasReadme ? `<a href="../../features/business-logic-modern/infrastructure/${component.name}/README.md" class="action-btn">Source README</a>` : ""}
          <a href="../../features/business-logic-modern/infrastructure/${component.name}/" class="action-btn primary">Source Code</a>
        </div>
      </div>`;
}

function generateHTML(components: InfrastructureComponent[], stats: InfrastructureStats): string {
	const componentCards = components.map(generateComponentCard).join("\n");

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Infrastructure Components Overview - Agenitix-2</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
      color: white;
      border-radius: 12px;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1e40af;
      display: block;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .search-controls {
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-input {
      flex: 1;
      min-width: 300px;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
    }

    .search-input:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .component-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .component-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .component-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .component-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .component-stats {
      display: flex;
      gap: 0.5rem;
    }

    .stat {
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      color: #374151;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .component-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .component-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .feature-tag {
      padding: 0.25rem 0.5rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .component-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 0.75rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .action-btn.primary {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }

    .action-btn.primary:hover {
      background: #1d4ed8;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #374151;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .search-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input {
        min-width: auto;
      }

      .components-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Infrastructure Components</h1>
      <p>Comprehensive documentation for all infrastructure components in Agenitix-2</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${stats.total}</span>
        <div class="stat-label">Total Components</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${stats.documented}</span>
        <div class="stat-label">Documented</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${stats.components.reduce((sum, c) => sum + c.componentCount, 0)}</span>
        <div class="stat-label">Total Sub-components</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${stats.components.reduce((sum, c) => sum + c.fileCount, 0)}</span>
        <div class="stat-label">Total Files</div>
      </div>
    </div>

    <div class="search-controls">
      <input 
        type="text" 
        class="search-input" 
        placeholder="Search infrastructure components..."
        id="searchInput"
      >
    </div>

    <div class="components-grid" id="componentsGrid">
${componentCards}
    </div>

    <div class="empty-state" id="emptyState" style="display: none;">
      <h3>No components found</h3>
      <p>Try adjusting your search criteria.</p>
    </div>
  </div>

  <script>
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const componentCards = document.querySelectorAll('.component-card');
    const emptyState = document.getElementById('emptyState');
    const componentsGrid = document.getElementById('componentsGrid');

    function filterComponents() {
      const searchTerm = searchInput.value.toLowerCase();
      let visibleCount = 0;

      componentCards.forEach(card => {
        const searchText = card.dataset.search.toLowerCase();
        const matchesSearch = searchText.includes(searchTerm);
        
        if (matchesSearch) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Show/hide empty state
      if (visibleCount === 0) {
        emptyState.style.display = 'block';
        componentsGrid.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        componentsGrid.style.display = 'grid';
      }
    }

    // Event listeners
    searchInput.addEventListener('input', filterComponents);

    // Initialize
    filterComponents();
  </script>
</body>
</html>`;
}

function main() {
	console.log("🔍 Scanning infrastructure components...");

	const components = scanInfrastructureComponents();
	const stats = generateStats(components);

	console.log(`📊 Found ${components.length} infrastructure components:`);
	components.forEach((component) => {
		console.log(
			`  - ${component.name}: ${component.componentCount} components, ${component.fileCount} files`
		);
	});

	console.log("📝 Generating overview HTML...");
	const html = generateHTML(components, stats);

	// Ensure documentation directory exists
	const docDir = path.dirname(OUTPUT_FILE);
	if (!fs.existsSync(docDir)) {
		fs.mkdirSync(docDir, { recursive: true });
	}

	fs.writeFileSync(OUTPUT_FILE, html);

	console.log(`✅ Generated overview at: ${OUTPUT_FILE}`);
	console.log(`📈 Statistics: ${stats.total} total components, ${stats.documented} documented`);
}

if (require.main === module) {
	main();
}

export { main as generateInfrastructureOverview };
