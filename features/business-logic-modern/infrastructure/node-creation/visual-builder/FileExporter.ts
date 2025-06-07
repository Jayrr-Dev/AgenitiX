import { VisualNodeCodeGenerator } from "./CodeGenerator";

// Export configuration
interface ExportConfig {
  outputPath: string;
  fileNaming: "nodeType" | "displayName" | "custom";
  customFileName?: string;
  includeTimestamp: boolean;
  createDirectories: boolean;
  overwriteExisting: boolean;
  addToRegistry: boolean;
  registryPath?: string;
  generatePackageJson: boolean;
  generateReadme: boolean;
}

// Default export configuration
const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  outputPath: "./nodes",
  fileNaming: "nodeType",
  includeTimestamp: false,
  createDirectories: true,
  overwriteExisting: false,
  addToRegistry: true,
  registryPath: "./nodes/registry.ts",
  generatePackageJson: false,
  generateReadme: true,
};

// Export result
interface ExportResult {
  success: boolean;
  filePath?: string;
  registryUpdated: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    fileSize: number;
    timestamp: string;
    nodeType: string;
    displayName: string;
  };
}

// Visual node configuration
interface VisualNodeConfig {
  id: string;
  nodeType: string;
  displayName: string;
  category: "create" | "transform" | "output" | "utility" | "testing";
  description: string;
  icon?: string;
  color?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  handles: VisualHandle[];
  collapsible: boolean;
  resizable: boolean;
  rotatable: boolean;
  tags: string[];
  author: string;
  version: string;
  deprecated: boolean;
  experimental: boolean;
  security?: {
    requiresAuth: boolean;
    permissions: string[];
    dataAccessLevel: "read" | "write" | "admin";
  };
  performance?: {
    timeout: number;
    memoryLimit: number;
    priority: "low" | "normal" | "high";
    cacheable: boolean;
    backgroundProcessing: boolean;
  };
  defaultData: Record<string, any>;
}

interface VisualHandle {
  id: string;
  type: "source" | "target";
  position: string;
  dataType: string;
  label: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  validation?: string;
  style?: {
    color?: string;
    shape?: "circle" | "square" | "diamond";
    size?: "small" | "medium" | "large";
  };
  x: number;
  y: number;
}

// File exporter class
export class NodeFileExporter {
  private config: ExportConfig;
  private codeGenerator: VisualNodeCodeGenerator;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = { ...DEFAULT_EXPORT_CONFIG, ...config };
    this.codeGenerator = new VisualNodeCodeGenerator();
  }

  // Export node to file system
  async exportNode(
    visualConfig: VisualNodeConfig,
    templateId?: string,
    customConfig?: Partial<ExportConfig>
  ): Promise<ExportResult> {
    const exportConfig = { ...this.config, ...customConfig };
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Generate code
      const codeResult = this.codeGenerator.generateCode(
        visualConfig,
        templateId
      );

      if (!codeResult.success || !codeResult.code) {
        return {
          success: false,
          registryUpdated: false,
          errors: [...errors, ...codeResult.errors],
          warnings: [...warnings, ...codeResult.warnings],
          metadata: {
            fileSize: 0,
            timestamp: new Date().toISOString(),
            nodeType: visualConfig.nodeType,
            displayName: visualConfig.displayName,
          },
        };
      }

      // Determine file path
      const fileName = this.generateFileName(visualConfig, exportConfig);
      const filePath = this.buildFilePath(fileName, exportConfig);

      // Write file
      await this.writeFile(filePath, codeResult.code);
      const fileSize = new TextEncoder().encode(codeResult.code).length;

      return {
        success: true,
        filePath,
        registryUpdated: false,
        errors,
        warnings,
        metadata: {
          fileSize,
          timestamp: new Date().toISOString(),
          nodeType: visualConfig.nodeType,
          displayName: visualConfig.displayName,
        },
      };
    } catch (error) {
      return {
        success: false,
        registryUpdated: false,
        errors: [
          ...errors,
          error instanceof Error ? error.message : "Unknown export error",
        ],
        warnings,
        metadata: {
          fileSize: 0,
          timestamp: new Date().toISOString(),
          nodeType: visualConfig.nodeType,
          displayName: visualConfig.displayName,
        },
      };
    }
  }

  // Generate file name based on configuration
  private generateFileName(
    config: VisualNodeConfig,
    exportConfig: ExportConfig
  ): string {
    let baseName: string;

    switch (exportConfig.fileNaming) {
      case "displayName":
        baseName = this.sanitizeFileName(config.displayName);
        break;
      case "custom":
        baseName = exportConfig.customFileName || config.nodeType;
        break;
      case "nodeType":
      default:
        baseName = config.nodeType;
        break;
    }

    const timestamp = exportConfig.includeTimestamp
      ? `_${new Date().toISOString().replace(/[:.]/g, "-")}`
      : "";

    return `${baseName}${timestamp}.node.tsx`;
  }

  // Build full file path
  private buildFilePath(fileName: string, config: ExportConfig): string {
    return `${config.outputPath}/${fileName}`;
  }

  // Sanitize file name for file system
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s-_]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }

  // Write file to disk (mock implementation)
  private async writeFile(filePath: string, content: string): Promise<void> {
    console.log(`Writing file: ${filePath}`);
    console.log(`Content length: ${content.length} characters`);

    // For demo purposes, we can use localStorage in browser environment
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`node-export-${filePath}`, content);
    }
  }

  // Utility methods
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase());
  }
}

// Utility functions for browser-based downloads
export class BrowserExporter {
  static downloadCode(code: string, filename: string): void {
    const blob = new Blob([code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  static copyToClipboard(code: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(code);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  }
}

export default NodeFileExporter;
