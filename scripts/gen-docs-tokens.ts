import fs, { writeFileSync } from "fs";
import { join } from "path";
import tokens from "../features/business-logic-modern/infrastructure/theming/tokens.json";

const flatten = (
	obj: Record<string, any>,
	prefix: string[] = [],
	out: Record<string, string> = {}
) => {
	for (const [k, v] of Object.entries(obj)) {
		if (typeof v === "object" && v !== null) {
			flatten(v, [...prefix, k], out);
		} else {
			out[[...prefix, k].join(".")] = String(v);
		}
	}
	return out;
};

// Helper function to detect if a value is a color
const isColorValue = (value: string): boolean => {
	return (
		value.startsWith("#") ||
		value.startsWith("hsl") ||
		value.startsWith("rgb") ||
		value.startsWith("hsla") ||
		value.startsWith("rgba") ||
		(value.includes("var(--") &&
			(value.includes("color") || value.includes("bg") || value.includes("border")))
	);
};

// Helper function to extract color from CSS value
const extractColor = (value: string): string => {
	// Handle CSS custom properties
	if (value.includes("var(--")) {
		// For now, return a placeholder - in a real implementation you'd resolve the CSS variable
		return "#6b7280"; // gray-500 as fallback
	}

	// Handle HSL values
	if (value.startsWith("hsl")) {
		return value;
	}

	// Handle hex colors
	if (value.startsWith("#")) {
		return value;
	}

	// Handle rgb values
	if (value.startsWith("rgb")) {
		return value;
	}

	return "";
};

// Helper function to categorize tokens
const categorizeTokens = (flatTokens: Record<string, string>) => {
	const categories: Record<string, { tokens: Record<string, string>; count: number }> = {
		spacing: { tokens: {}, count: 0 },
		typography: { tokens: {}, count: 0 },
		colors: { tokens: {}, count: 0 },
		layout: { tokens: {}, count: 0 },
		effects: { tokens: {}, count: 0 },
		dimensions: { tokens: {}, count: 0 },
		palette: { tokens: {}, count: 0 },
		elevation: { tokens: {}, count: 0 },
		status: { tokens: {}, count: 0 },
		"node-global": { tokens: {}, count: 0 },
		"node-create": { tokens: {}, count: 0 },
		"node-view": { tokens: {}, count: 0 },
		"node-trigger": { tokens: {}, count: 0 },
		"node-test": { tokens: {}, count: 0 },
		"node-cycle": { tokens: {}, count: 0 },
		"node-email": { tokens: {}, count: 0 },
		"node-flow": { tokens: {}, count: 0 },
		"node-time": { tokens: {}, count: 0 },
		"node-ai": { tokens: {}, count: 0 },
	
		"node-store": { tokens: {}, count: 0 },
		"infra-inspector": { tokens: {}, count: 0 },
		"infra-sidebar": { tokens: {}, count: 0 },
		"infra-toolbar": { tokens: {}, count: 0 },
		"infra-canvas": { tokens: {}, count: 0 },
		"infra-panel": { tokens: {}, count: 0 },
		"infra-minimap": { tokens: {}, count: 0 },
		"infra-history": { tokens: {}, count: 0 },
		"infra-controls": { tokens: {}, count: 0 },
		handle: { tokens: {}, count: 0 },
		expandCollapseButton: { tokens: {}, count: 0 },
		label: { tokens: {}, count: 0 },
		coreNode: { tokens: {}, count: 0 },
		other: { tokens: {}, count: 0 },
	};

	for (const [key, value] of Object.entries(flatTokens)) {
		let category = "other";

		if (key.startsWith("spacing.")) category = "spacing";
		else if (key.startsWith("typography.")) category = "typography";
		else if (key.startsWith("colors.")) category = "colors";
		else if (key.startsWith("layout.")) category = "layout";
		else if (key.startsWith("effects.")) category = "effects";
		else if (key.startsWith("dimensions.")) category = "dimensions";
		else if (key.startsWith("palette.")) category = "palette";
		else if (key.startsWith("elevation.")) category = "elevation";
		else if (key.startsWith("status.")) category = "status";
		else if (key.startsWith("node.global.")) category = "node-global";
		else if (key.startsWith("node.create.")) category = "node-create";
		else if (key.startsWith("node.view.")) category = "node-view";
		else if (key.startsWith("node.trigger.")) category = "node-trigger";
		else if (key.startsWith("node.test.")) category = "node-test";
		else if (key.startsWith("node.cycle.")) category = "node-cycle";
		else if (key.startsWith("node.email.")) category = "node-email";
		else if (key.startsWith("node.flow.")) category = "node-flow";
		else if (key.startsWith("node.time.")) category = "node-time";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.email.")) category = "node-email";
		else if (key.startsWith("node.email.")) category = "node-email";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.email.")) category = "node-email";
		else if (key.startsWith("node.ai.")) category = "node-ai";
		else if (key.startsWith("node.email.")) category = "node-email";

		else if (key.startsWith("node.store.")) category = "node-store";
		else if (key.startsWith("infra.inspector.")) category = "infra-inspector";
		else if (key.startsWith("infra.sidebar.")) category = "infra-sidebar";
		else if (key.startsWith("infra.toolbar.")) category = "infra-toolbar";
		else if (key.startsWith("infra.canvas.")) category = "infra-canvas";
		else if (key.startsWith("infra.panel.")) category = "infra-panel";
		else if (key.startsWith("infra.minimap.")) category = "infra-minimap";
		else if (key.startsWith("infra.history.")) category = "infra-history";
		else if (key.startsWith("infra.controls.")) category = "infra-controls";
		else if (key.startsWith("handle.")) category = "handle";
		else if (key.startsWith("expandCollapseButton.")) category = "expandCollapseButton";
		else if (key.startsWith("label.")) category = "label";
		else if (key.startsWith("coreNode.")) category = "coreNode";

		categories[category].tokens[key] = value;
		categories[category].count++;
	}

	return categories;
};

const flat = flatten(tokens);
const categorizedTokens = categorizeTokens(flat);

// Build markdown table
let md = "# Core Tokens\n\n| Token | Value |\n|-------|-------|\n";
for (const [k, v] of Object.entries(flat)) {
	md += `| ${k} | ${v} |\n`;
}

// Build HTML preview with tabbed interface
let html = `<!DOCTYPE html>
<html>
<head>
  <title>Design Tokens Preview</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      margin: 0;
      background: #f8fafc;
      color: #1f2937;
    }
    
    .container {
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
    }
    
    .header p {
      margin: 0.5rem 0 0 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 2rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .stat-card {
      text-align: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
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
    
    .tabs-container {
      margin: 2rem;
    }
    
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
      padding: 0.5rem;
      background: #f1f5f9;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .tab {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .tab:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    .tab.active {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }
    
    .tab-count {
      background: rgba(255, 255, 255, 0.2);
      color: inherit;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .tab-content {
      display: none;
      animation: fadeIn 0.3s ease;
    }
    
    .tab-content.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .token-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .token-group {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      background: #f9fafb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .token-group h3 {
      margin-top: 0;
      color: #374151;
      font-size: 1.25rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .color-swatch {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.75rem 0;
      padding: 0.75rem;
      border-radius: 8px;
      background: white;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;
    }
    
    .color-swatch:hover {
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
    
    .swatch {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid #d1d5db;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    
    .swatch-text {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: inherit;
      width: 100%;
      height: 100%;
    }
    
    .token-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e7eb;
    }
    
    .token-table th, .token-table td {
      text-align: left;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .token-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .token-table tr:hover {
      background: #f9fafb;
    }
    
    .token-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .token-name {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      color: #374151;
      flex: 1;
    }
    
    .token-value {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      color: #059669;
      background: #ecfdf5;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #d1fae5;
    }
    
    .color-preview {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 2px solid #d1d5db;
      flex-shrink: 0;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
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
    
    .category-icon {
      font-size: 1.25rem;
    }
    
    /* Search and Sort Controls */
    .search-sort-controls {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    
    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .search-container {
      position: relative;
      flex: 1;
      min-width: 100px;
      margin-right: 4rem;
    }
    
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      transition: all 0.2s ease;
    }
    
    .search-input:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .sort-container {
      min-width: 200px;
    }
    
    .sort-select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .sort-select:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }
    
    .filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .filter-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    .filter-btn.active {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }
    
    .results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }
    
    .results-count {
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .clear-filters {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .clear-filters:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    /* Responsive design for controls */
    @media (max-width: 768px) {
      .controls-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-container,
      .sort-container {
        min-width: auto;
      }
      
      .filter-container {
        justify-content: center;
      }
      
      .results-info {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 Design Tokens Preview</h1>
      <p>Auto-generated from <code>tokens.json</code> • Last updated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${Object.keys(flat).length}</span>
        <div class="stat-label">Total Tokens</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.entries(flat).filter(([k, v]) => isColorValue(v)).length}</span>
        <div class="stat-label">Color Tokens</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.keys(tokens.node || {}).length}</span>
        <div class="stat-label">Node Categories</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">${Object.keys(tokens.infra || {}).length}</span>
        <div class="stat-label">Infrastructure Components</div>
      </div>
    </div>
    
    <div class="tabs-container">
      <div class="tabs" id="tabs">
        <div class="tab active" data-tab="overview">
          📊 Overview
          <span class="tab-count">${Object.keys(flat).length}</span>
        </div>
        <div class="tab" data-tab="spacing">
          📏 Spacing
          <span class="tab-count">${categorizedTokens.spacing.count}</span>
        </div>
        <div class="tab" data-tab="typography">
          🔤 Typography
          <span class="tab-count">${categorizedTokens.typography.count}</span>
        </div>
        <div class="tab" data-tab="colors">
          🎨 Colors
          <span class="tab-count">${categorizedTokens.colors.count}</span>
        </div>
        <div class="tab" data-tab="layout">
          📐 Layout
          <span class="tab-count">${categorizedTokens.layout.count}</span>
        </div>
        <div class="tab" data-tab="effects">
          ✨ Effects
          <span class="tab-count">${categorizedTokens.effects.count}</span>
        </div>
        <div class="tab" data-tab="dimensions">
          📐 Dimensions
          <span class="tab-count">${categorizedTokens.dimensions.count}</span>
        </div>
        <div class="tab" data-tab="palette">
          🎨 Palette
          <span class="tab-count">${categorizedTokens.palette.count}</span>
        </div>
        <div class="tab" data-tab="elevation">
          📈 Elevation
          <span class="tab-count">${categorizedTokens.elevation.count}</span>
        </div>
        <div class="tab" data-tab="status">
          🏷️ Status
          <span class="tab-count">${categorizedTokens.status.count}</span>
        </div>
        <div class="tab" data-tab="node-global">
          🎯 Node Global
          <span class="tab-count">${categorizedTokens["node-global"].count}</span>
        </div>
        <div class="tab" data-tab="node-create">
          ➕ Node Create
          <span class="tab-count">${categorizedTokens["node-create"].count}</span>
        </div>
        <div class="tab" data-tab="node-view">
          👁️ Node View
          <span class="tab-count">${categorizedTokens["node-view"].count}</span>
        </div>
        <div class="tab" data-tab="node-trigger">
          ⚡ Node Trigger
          <span class="tab-count">${categorizedTokens["node-trigger"].count}</span>
        </div>
        <div class="tab" data-tab="node-test">
          🧪 Node Test
          <span class="tab-count">${categorizedTokens["node-test"].count}</span>
        </div>
        <div class="tab" data-tab="node-cycle">
          🔄 Node Cycle
          <span class="tab-count">${categorizedTokens["node-cycle"].count}</span>
        </div>
        <div class="tab" data-tab="infra-inspector">
          🔍 Inspector
          <span class="tab-count">${categorizedTokens["infra-inspector"].count}</span>
        </div>
        <div class="tab" data-tab="infra-sidebar">
          📋 Sidebar
          <span class="tab-count">${categorizedTokens["infra-sidebar"].count}</span>
        </div>
        <div class="tab" data-tab="infra-toolbar">
          🛠️ Toolbar
          <span class="tab-count">${categorizedTokens["infra-toolbar"].count}</span>
        </div>
        <div class="tab" data-tab="infra-canvas">
          🎨 Canvas
          <span class="tab-count">${categorizedTokens["infra-canvas"].count}</span>
        </div>
        <div class="tab" data-tab="handle">
          🔗 Handles
          <span class="tab-count">${categorizedTokens.handle.count}</span>
        </div>
        <div class="tab" data-tab="other">
          📝 Other
          <span class="tab-count">${categorizedTokens.other.count}</span>
        </div>
      </div>
      
      <!-- Overview Tab -->
      <div class="tab-content active" id="overview">
        <div class="token-grid">
          <div class="token-group">
            <h3>🎯 Node Categories</h3>`;

// Add node category swatches
const nodeColors = Object.entries(tokens.node || {});
for (const [category, colors] of nodeColors) {
	const bg = (colors as any).bg;
	const text = (colors as any).text;
	if (bg && text) {
		html += `
            <div class="color-swatch">
              <div class="swatch" style="background: hsl(${bg});">
                <div class="swatch-text" style="color: hsl(${text});">Aa</div>
              </div>
              <div>
                <div><strong>${category}</strong></div>
                <div style="font-size: 0.75rem; color: #6b7280;">bg: ${bg} • text: ${text}</div>
              </div>
            </div>`;
	}
}

html += `
          </div>
          
          <div class="token-group">
            <h3>🏗️ Infrastructure Components</h3>`;

// Add infrastructure swatches
const infraColors = Object.entries(tokens.infra || {});
for (const [component, colors] of infraColors) {
	const bg = (colors as any).bg;
	const text = (colors as any).text;
	if (bg && text) {
		html += `
            <div class="color-swatch">
              <div class="swatch" style="background: hsl(${bg});">
                <div class="swatch-text" style="color: hsl(${text});">Aa</div>
              </div>
              <div>
                <div><strong>${component}</strong></div>
                <div style="font-size: 0.75rem; color: #6b7280;">bg: ${bg} • text: ${text}</div>
              </div>
            </div>`;
	}
}

html += `
          </div>
        </div>
        
        <h2>📋 All Tokens</h2>
        <table class="token-table">
          <thead>
            <tr><th>Token</th><th>Value</th></tr>
          </thead>
          <tbody>`;

for (const [k, v] of Object.entries(flat)) {
	const isColor = isColorValue(v);
	const colorValue = isColor ? extractColor(v) : "";

	html += `<tr>
        <td>
          <div class="token-row">
            <span class="token-name">${k}</span>
          </div>
        </td>
        <td>
          <div class="token-row">
            <span class="token-value">${v}</span>
            ${isColor ? `<div class="color-preview" style="background: ${colorValue};"></div>` : ""}
          </div>
        </td>
      </tr>`;
}

html += `
          </tbody>
        </table>
      </div>`;

// Generate tab content for each category
const categoryIcons: Record<string, string> = {
	spacing: "📏",
	typography: "🔤",
	colors: "🎨",
	layout: "📐",
	effects: "✨",
	dimensions: "📐",
	palette: "🎨",
	elevation: "📈",
	status: "🏷️",
	"node-global": "🎯",
	"node-create": "➕",
	"node-view": "👁️",
	"node-trigger": "⚡",
	"node-test": "🧪",
	"node-cycle": "🔄",
	"infra-inspector": "🔍",
	"infra-sidebar": "📋",
	"infra-toolbar": "🛠️",
	"infra-canvas": "🎨",
	"infra-panel": "📄",
	"infra-minimap": "🗺️",
	"infra-history": "📜",
	"infra-controls": "🎛️",
	handle: "🔗",
	expandCollapseButton: "🔽",
	label: "🏷️",
	coreNode: "⚙️",
	other: "📝",
};

for (const [category, data] of Object.entries(categorizedTokens)) {
	if (data.count === 0) continue;

	const icon = categoryIcons[category] || "📝";
	const displayName = category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

	html += `
      <!-- ${displayName} Tab -->
      <div class="tab-content" id="${category}">
        <h2>${icon} ${displayName} Tokens (${data.count})</h2>
        <table class="token-table">
          <thead>
            <tr><th>Token</th><th>Value</th></tr>
          </thead>
          <tbody>`;

	for (const [k, v] of Object.entries(data.tokens)) {
		const isColor = isColorValue(v);
		const colorValue = isColor ? extractColor(v) : "";

		html += `<tr>
          <td>
            <div class="token-row">
              <span class="token-name">${k}</span>
            </div>
          </td>
          <td>
            <div class="token-row">
              <span class="token-value">${v}</span>
              ${isColor ? `<div class="color-preview" style="background: ${colorValue};"></div>` : ""}
            </div>
          </td>
        </tr>`;
	}

	html += `
          </tbody>
        </table>
      </div>`;
}

html += `
    </div>
    
    <script>
      // Tab functionality
      const tabs = document.querySelectorAll('.tab');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetTab = tab.getAttribute('data-tab');
          
          // Remove active class from all tabs and contents
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          tab.classList.add('active');
          const targetContent = document.getElementById(targetTab);
          if (targetContent) {
            targetContent.classList.add('active');
          }
        });
      });
      
      // Search and sort functionality
      function initializeSearchAndSort(tabId) {
        const tabContent = document.getElementById(tabId);
        if (!tabContent) return;
        
        const table = tabContent.querySelector('.token-table');
        if (!table) return;
        
        // Create search and sort controls
        const controls = document.createElement('div');
        controls.className = 'search-sort-controls';
        controls.innerHTML = \`
          <div class="controls-row">
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search tokens..." />
              <div class="search-icon">🔍</div>
            </div>
            <div class="sort-container">
              <select class="sort-select">
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="value-asc">Value A-Z</option>
                <option value="value-desc">Value Z-A</option>
                <option value="type-color">Color tokens first</option>
                <option value="type-noncolor">Non-color tokens first</option>
              </select>
            </div>
            <div class="filter-container">
              <button class="filter-btn active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="light">Light</button>
              <button class="filter-btn" data-filter="dark">Dark</button>
              <button class="filter-btn" data-filter="border">Border</button>
              <button class="filter-btn" data-filter="bg">Background</button>
              <button class="filter-btn" data-filter="text">Text</button>
              <button class="filter-btn" data-filter="shadow">Shadow</button>
              <button class="filter-btn" data-filter="spacing">Spacing</button>
            </div>
          </div>
          <div class="results-info">
            <span class="results-count">Showing all tokens</span>
            <button class="clear-filters">Clear filters</button>
          </div>
        \`;
        
        // Insert controls before the table
        table.parentNode.insertBefore(controls, table);
        
        // Get elements
        const searchInput = controls.querySelector('.search-input');
        const sortSelect = controls.querySelector('.sort-select');
        const filterBtns = controls.querySelectorAll('.filter-btn');
        const resultsCount = controls.querySelector('.results-count');
        const clearFilters = controls.querySelector('.clear-filters');
        const tbody = table.querySelector('tbody');
        const originalRows = Array.from(tbody.querySelectorAll('tr'));
        
        // Store original rows for reset
        const originalRowsData = originalRows.map(row => ({
          element: row,
          name: row.querySelector('.token-name').textContent.toLowerCase(),
          value: row.querySelector('.token-value').textContent.toLowerCase(),
          isColor: row.querySelector('.color-preview') !== null
        }));
        
        // Search function
        function performSearch() {
          const searchTerm = searchInput.value.toLowerCase();
          const sortValue = sortSelect.value;
          const activeFilter = controls.querySelector('.filter-btn.active').dataset.filter;
          
          let filteredRows = originalRowsData.filter(row => {
            // Search filter
            const matchesSearch = searchTerm === '' || 
              row.name.includes(searchTerm) || 
              row.value.includes(searchTerm);
            
            // Category filter
            let matchesFilter = true;
            if (activeFilter !== 'all') {
              switch (activeFilter) {
                case 'light':
                  matchesFilter = !row.name.includes('dark') && !row.value.includes('dark');
                  break;
                case 'dark':
                  matchesFilter = row.name.includes('dark') || row.value.includes('dark');
                  break;
                case 'border':
                  matchesFilter = row.name.includes('border') || row.value.includes('border');
                  break;
                case 'bg':
                  matchesFilter = row.name.includes('bg') || row.value.includes('background');
                  break;
                case 'text':
                  matchesFilter = row.name.includes('text') || row.value.includes('text');
                  break;
                case 'shadow':
                  matchesFilter = row.name.includes('shadow') || row.value.includes('shadow');
                  break;
                case 'spacing':
                  matchesFilter = row.name.includes('spacing') || row.value.includes('spacing');
                  break;
              }
            }
            
            return matchesSearch && matchesFilter;
          });
          
          // Sort filtered rows
          filteredRows.sort((a, b) => {
            switch (sortValue) {
              case 'name-asc':
                return a.name.localeCompare(b.name);
              case 'name-desc':
                return b.name.localeCompare(a.name);
              case 'value-asc':
                return a.value.localeCompare(b.value);
              case 'value-desc':
                return b.value.localeCompare(a.value);
              case 'type-color':
                return a.isColor === b.isColor ? 0 : a.isColor ? -1 : 1;
              case 'type-noncolor':
                return a.isColor === b.isColor ? 0 : a.isColor ? 1 : -1;
              default:
                return 0;
            }
          });
          
          // Update table
          tbody.innerHTML = '';
          filteredRows.forEach(row => {
            tbody.appendChild(row.element.cloneNode(true));
          });
          
          // Update results count
          resultsCount.textContent = \`Showing \${filteredRows.length} of \${originalRowsData.length} tokens\`;
        }
        
        // Event listeners
        searchInput.addEventListener('input', performSearch);
        sortSelect.addEventListener('change', performSearch);
        
        filterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            performSearch();
          });
        });
        
        clearFilters.addEventListener('click', () => {
          searchInput.value = '';
          sortSelect.value = 'name-asc';
          filterBtns.forEach(b => b.classList.remove('active'));
          filterBtns[0].classList.add('active');
          performSearch();
        });
      }
      
      // Initialize search and sort for each tab
      const tabIds = ['overview', 'spacing', 'typography', 'colors', 'layout', 'effects', 'dimensions', 'palette', 'elevation', 'status', 'node-global', 'node-create', 'node-view', 'node-trigger', 'node-test', 'node-cycle', 'infra-inspector', 'infra-sidebar', 'infra-toolbar', 'infra-canvas', 'infra-panel', 'infra-minimap', 'infra-history', 'infra-controls', 'handle', 'expandCollapseButton', 'label', 'coreNode', 'other'];
      
      tabIds.forEach(tabId => {
        initializeSearchAndSort(tabId);
      });
    </script>
  </body>
  </html>`;

// Ensure documentation directory exists
const outDir = join(process.cwd(), "documentation");
if (!fs.existsSync(outDir)) {
	fs.mkdirSync(outDir, { recursive: true });
}

// Ensure theming directory exists
const themingDir = join(outDir, "theming");
if (!fs.existsSync(themingDir)) {
	fs.mkdirSync(themingDir, { recursive: true });
}

// Write both files
const mdOut = join(outDir, "core-tokens.md");
const htmlOut = join(outDir, "theming", "tokens-preview.html");

writeFileSync(mdOut, md);
writeFileSync(htmlOut, html);

console.log("✔ Generated", mdOut);
console.log("✔ Generated", htmlOut, "- open in browser for visual preview");
