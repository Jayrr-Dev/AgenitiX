/**
 * Shared types for AI Tools
 */

export interface ToolDefinition {
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: string;
  configSchema?: any; // Optional Zod schema for tool-specific config
}

export interface ToolImplementation {
  definition: ToolDefinition;
  convexHandler: (args: any) => Promise<string>;
}