/**
 * Route: scripts/generate-theming-overview.ts
 * THEMING OVERVIEW GENERATOR - Creates interactive overview for theming documentation
 *
 * • Scans theming documentation structure
 * • Generates statistics and categorization
 * • Creates interactive HTML overview with search/filter
 * • Links to individual documentation files
 * • Provides quick access to token preview and tools
 *
 * Keywords: theming-overview, documentation-generation, interactive-preview, design-tokens
 */

import { existsSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

interface ThemingSection {
	name: string;
	description: string;
	files: string[];
	category: "core" | "components" | "tools" | "documentation";
	features: string[];
}

interface ThemingStats {
	totalFiles: number;
	totalSections: number;
	categories: Record<string, number>;
	lastUpdated: string;
}

function scanThemingStructure(): ThemingSection[] {
	const sections: ThemingSection[] = [
		{
			name: "Design Tokens",
			description: "Core design system tokens including spacing, typography, colors, and effects",
			files: ["_generated_tokens.css", "core-tokens.md"],
			category: "core",
			features: [
				"Auto-generated",
				"CSS Custom Properties",
				"Theme Switching",
				"Component Isolation",
			],
		},
		{
			name: "Global Styles",
			description: "Foundation styles and theme definitions for the entire application",
			files: ["_globals.css"],
			category: "core",
			features: ["Theme Definition", "Light/Dark Support", "Base Styles", "Animations"],
		},
		{
			name: "Node Theming",
			description:
				"Component-specific theming for different node types (create, view, trigger, test)",
			files: ["_nodes.css"],
			category: "components",
			features: ["Node-Specific Colors", "Hover States", "Border Styling", "Text Colors"],
		},
		{
			name: "Infrastructure Theming",
			description: "Theming for infrastructure components (inspector, toolbar, sidebar, canvas)",
			files: ["_infra.css"],
			category: "components",
			features: ["Component Isolation", "Semantic Theming", "Card-Based Design", "Border Styling"],
		},
		{
			name: "Token Preview",
			description: "Interactive HTML preview for exploring all design tokens",
			files: ["tokens-preview.html"],
			category: "tools",
			features: ["Interactive Explorer", "Search & Filter", "Category Tabs", "Visual Testing"],
		},
		{
			name: "Documentation",
			description:
				"Comprehensive documentation covering architecture, guidelines, and best practices",
			files: ["README.md"],
			category: "documentation",
			features: [
				"Architecture Guide",
				"Development Guidelines",
				"Best Practices",
				"Tools Reference",
			],
		},
	];

	return sections;
}

function generateStats(sections: ThemingSection[]): ThemingStats {
	const categories: Record<string, number> = {};

	sections.forEach((section) => {
		categories[section.category] = (categories[section.category] || 0) + 1;
	});

	return {
		totalFiles: sections.reduce((sum, section) => sum + section.files.length, 0),
		totalSections: sections.length,
		categories,
		lastUpdated: new Date().toISOString().split("T")[0],
	};
}

function generateSectionCard(section: ThemingSection): string {
	const categoryColors = {
		core: "bg-blue-50 border-blue-200 text-blue-800",
		components: "bg-green-50 border-green-200 text-green-800",
		tools: "bg-purple-50 border-purple-200 text-purple-800",
		documentation: "bg-orange-50 border-orange-200 text-orange-800",
	};

	const featuresList = section.features
		.map(
			(feature) =>
				`<span class="inline-block bg-white px-2 py-1 rounded text-xs font-medium mr-2 mb-2">${feature}</span>`
		)
		.join("");

	return `
    <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">${section.name}</h3>
          <p class="text-gray-600 text-sm mb-3">${section.description}</p>
        </div>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[section.category]}">
          ${section.category}
        </span>
      </div>
      
      <div class="mb-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Files:</h4>
        <div class="flex flex-wrap gap-2">
          ${section.files
						.map(
							(file) =>
								`<span class="inline-block bg-gray-100 px-2 py-1 rounded text-xs font-mono">${file}</span>`
						)
						.join("")}
        </div>
      </div>
      
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">Features:</h4>
        <div class="flex flex-wrap">
          ${featuresList}
        </div>
      </div>
    </div>
  `;
}

function generateHTML(sections: ThemingSection[], stats: ThemingStats): string {
	const sectionsHTML = sections.map(generateSectionCard).join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Theming System Overview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <!-- Header -->
  <header class="gradient-bg text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Theming System Overview</h1>
        <p class="text-xl opacity-90">Comprehensive design tokens, component theming, and development guidelines</p>
      </div>
    </div>
  </header>

  <!-- Stats -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg p-6 text-center border border-gray-200">
        <div class="text-3xl font-bold text-blue-600">${stats.totalSections}</div>
        <div class="text-sm text-gray-600">Theming Sections</div>
      </div>
      <div class="bg-white rounded-lg p-6 text-center border border-gray-200">
        <div class="text-3xl font-bold text-green-600">${stats.totalFiles}</div>
        <div class="text-sm text-gray-600">Total Files</div>
      </div>
      <div class="bg-white rounded-lg p-6 text-center border border-gray-200">
        <div class="text-3xl font-bold text-purple-600">${Object.keys(stats.categories).length}</div>
        <div class="text-sm text-gray-600">Categories</div>
      </div>
      <div class="bg-white rounded-lg p-6 text-center border border-gray-200">
        <div class="text-3xl font-bold text-orange-600">${stats.lastUpdated}</div>
        <div class="text-sm text-gray-600">Last Updated</div>
      </div>
    </div>
  </section>

  <!-- Search and Filter -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">Search Sections</label>
          <input type="text" id="search" placeholder="Search by name, description, or features..." 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label for="category-filter" class="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
          <select id="category-filter" 
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            <option value="core">Core</option>
            <option value="components">Components</option>
            <option value="tools">Tools</option>
            <option value="documentation">Documentation</option>
          </select>
        </div>
      </div>
    </div>
  </section>

  <!-- Sections Grid -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="sections-grid">
      ${sectionsHTML}
    </div>
  </section>

  <!-- Quick Links -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a href="README.md" class="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-blue-900">Documentation</h3>
            <p class="text-xs text-blue-700">Complete theming guide</p>
          </div>
        </a>
        
        <a href="tokens-preview.html" class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <div class="flex-shrink-0 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-green-900">Token Preview</h3>
            <p class="text-xs text-green-700">Interactive token explorer</p>
          </div>
        </a>
        
        <a href="../infrastructure/README.md" class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <div class="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-purple-900">Infrastructure</h3>
            <p class="text-xs text-purple-700">Component documentation</p>
          </div>
        </a>
      </div>
    </div>
  </section>

  <script>
    // Search and filter functionality
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('category-filter');
    const sectionsGrid = document.getElementById('sections-grid');
    const originalSections = Array.from(sectionsGrid.children);

    function filterSections() {
      const searchTerm = searchInput.value.toLowerCase();
      const selectedCategory = categoryFilter.value;

      originalSections.forEach(section => {
        const text = section.textContent.toLowerCase();
        const category = section.querySelector('span').textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || text.includes(searchTerm);
        const matchesCategory = selectedCategory === '' || category === selectedCategory;
        
        section.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
      });
    }

    searchInput.addEventListener('input', filterSections);
    categoryFilter.addEventListener('change', filterSections);
  </script>
</body>
</html>`;
}

async function main() {
	console.log("🎨 Generating theming overview...");

	try {
		const sections = scanThemingStructure();
		console.log(`Found ${sections.length} sections`);

		const stats = generateStats(sections);
		console.log(`Generated stats: ${JSON.stringify(stats)}`);

		const html = generateHTML(sections, stats);
		console.log(`Generated HTML (${html.length} characters)`);

		// Ensure theming directory exists
		const themingDir = join(process.cwd(), "documentation", "theming");
		console.log(`Theming directory: ${themingDir}`);
		console.log(`Directory exists: ${existsSync(themingDir)}`);

		if (!existsSync(themingDir)) {
			throw new Error("Theming directory does not exist");
		}

		const outputPath = join(themingDir, "overview.html");
		writeFileSync(outputPath, html);

		console.log("✅ Theming overview generated successfully!");
		console.log(`📁 Output: ${outputPath}`);
		console.log(`📊 Stats: ${stats.totalSections} sections, ${stats.totalFiles} files`);
	} catch (error) {
		console.error("❌ Error generating theming overview:", error);
		process.exit(1);
	}
}

export { main as generateThemingOverview };
