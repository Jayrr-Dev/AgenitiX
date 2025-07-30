/**
 * AI Tools Configuration
 * 
 * Centralized configuration for all available AI tools.
 * Keeps the main component clean and organized.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category?: string;
}

export const TOOL_DEFINITIONS = {
  calculator: {
    name: "Calculator",
    description: "Perform mathematical calculations",
    icon: "LuCalculator",
    category: "utility",
  },
  webSearch: {
    name: "Web Search",
    description: "Search the web for information",
    icon: "LuSearch",
    category: "research",
  },
} as const;

export type ToolType = keyof typeof TOOL_DEFINITIONS;

/**
 * Get grid layout class based on number of enabled tools
 */
export const getGridLayout = (count: number): string => {
  switch (count) {
    case 0:
      return "flex items-center justify-center"; // No tools - centered
    case 1:
      return "flex items-center justify-center"; // 1 tool - centered
    case 2:
      return "grid grid-cols-2 gap-1 items-center justify-center"; // 2 tools - 2 columns
    case 3:
      return "grid grid-cols-3 gap-1 items-center justify-center"; // 3 tools - 3 columns
    case 4:
      return "grid grid-cols-2 gap-1 items-center justify-center"; // 4 tools - 2x2 grid
    case 5:
      return "grid grid-cols-3 gap-1 items-center justify-center"; // 5 tools - 3 columns, 2 rows
    case 6:
      return "grid grid-cols-3 gap-1 items-center justify-center"; // 6 tools - 3x2 grid
    case 7:
    case 8:
    case 9:
      return "grid grid-cols-3 gap-1 items-center justify-center"; // 7-9 tools - 3x3 grid
    default:
      return "grid grid-cols-3 gap-1 items-center justify-center"; // Max 9 tools
  }
};

/**
 * Get proportional icon size based on number of enabled tools
 * Icons scale down as more tools are added to fit better in the collapsed state
 */
export const getIconSize = (count: number): number => {
  switch (count) {
    case 0:
      return 20; // No tools - default size
    case 1:
      return 24; // 1 tool - largest size
    case 2:
      return 20; // 2 tools - slightly smaller
    case 3:
      return 18; // 3 tools - medium size
    case 4:
      return 16; // 4 tools - smaller for 2x2 grid
    case 5:
    case 6:
      return 14; // 5-6 tools - small for 3-column layout
    case 7:
    case 8:
    case 9:
      return 12; // 7-9 tools - smallest for 3x3 grid
    default:
      return 12; // Max density - smallest icons
  }
};

/**
 * Get enabled tools from node data
 */
export const getEnabledTools = (nodeData: any): Array<{ key: string; tool: ToolDefinition }> => {
  const enabledTools: Array<{ key: string; tool: ToolDefinition }> = [];
  
  Object.entries(TOOL_DEFINITIONS).forEach(([key, tool]) => {
    if (nodeData[key as keyof typeof TOOL_DEFINITIONS]) {
      enabledTools.push({ key, tool });
    }
  });
  
  return enabledTools;
};

/**
 * Generate tools configuration JSON for AI agent
 */
export const generateToolsConfig = (nodeData: any): string => {
  const enabledTools: Array<{
    type: string;
    name: string;
    config: any;
  }> = [];
  
  Object.entries(TOOL_DEFINITIONS).forEach(([key, tool]) => {
    if (nodeData[key as keyof typeof TOOL_DEFINITIONS]) {
      enabledTools.push({
        type: key,
        name: tool.name,
        config: {}, // Add specific configs per tool if needed
      });
    }
  });

  return JSON.stringify({
    enabledTools,
    totalCount: enabledTools.length,
    timestamp: Date.now(),
  });
};