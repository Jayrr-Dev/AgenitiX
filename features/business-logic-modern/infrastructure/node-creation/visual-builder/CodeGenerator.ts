// Code generation configuration
interface CodeGenConfig {
  indentSize: number;
  useSpaces: boolean;
  includeComments: boolean;
  includeTypeAnnotations: boolean;
  outputFormat: "typescript" | "javascript";
  exportStyle: "default" | "named";
  includeImports: boolean;
  templateStyle: "standard" | "compact" | "verbose";
}

// Default configuration
const DEFAULT_CODEGEN_CONFIG: CodeGenConfig = {
  indentSize: 2,
  useSpaces: true,
  includeComments: true,
  includeTypeAnnotations: true,
  outputFormat: "typescript",
  exportStyle: "default",
  includeImports: true,
  templateStyle: "standard",
};

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

// Code generation result
interface CodeGenResult {
  success: boolean;
  code?: string;
  errors: string[];
  warnings: string[];
  metadata: {
    linesGenerated: number;
    estimatedComplexity: "low" | "medium" | "high";
    features: string[];
    dependencies: string[];
  };
}

// Template patterns for common node configurations
interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  patterns: {
    imports?: string[];
    interfaces?: string[];
    defaultData?: Record<string, any>;
    processLogic?: string;
    validation?: string;
    security?: Record<string, any>;
    performance?: Record<string, any>;
  };
  tags: string[];
}

// Pre-built templates for common node types
const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: "api-fetcher",
    name: "API Data Fetcher",
    description: "Fetches data from REST APIs",
    category: "create",
    patterns: {
      defaultData: {
        url: "",
        method: "GET",
        headers: {},
        timeout: 5000,
      },
      processLogic: `
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
        });

        const result = await response.json();
        updateNodeData({ result, status: response.status });
        return result;
      `,
    },
    tags: ["api", "http", "data", "fetch"],
  },

  {
    id: "data-transformer",
    name: "Data Transformer",
    description: "Transforms data using custom logic",
    category: "transform",
    patterns: {
      defaultData: {
        transformFunction: "(data) => data",
        enableValidation: true,
        preserveOriginal: false,
      },
      processLogic: `
        const transformFn = new Function('data', 'return ' + data.transformFunction);
        const transformed = transformFn(inputData);

        const result = data.preserveOriginal
          ? { original: inputData, transformed }
          : transformed;

        updateNodeData({ result });
        return result;
      `,
    },
    tags: ["transform", "data", "function", "processing"],
  },
];

// Main code generator class
export class VisualNodeCodeGenerator {
  private config: CodeGenConfig;
  private templates: Map<string, NodeTemplate>;

  constructor(config: Partial<CodeGenConfig> = {}) {
    this.config = { ...DEFAULT_CODEGEN_CONFIG, ...config };
    this.templates = new Map(NODE_TEMPLATES.map((t) => [t.id, t]));
  }

  // Generate TypeScript code from visual configuration
  generateCode(
    visualConfig: VisualNodeConfig,
    templateId?: string
  ): CodeGenResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const features: string[] = [];
    const dependencies: string[] = [];

    try {
      // Validate configuration
      this.validateConfig(visualConfig, errors, warnings);

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          warnings,
          metadata: {
            linesGenerated: 0,
            estimatedComplexity: "low",
            features: [],
            dependencies: [],
          },
        };
      }

      // Apply template if specified
      const template = templateId
        ? this.templates.get(templateId) || null
        : null;
      if (templateId && !template) {
        warnings.push(
          `Template '${templateId}' not found, using default generation`
        );
      }

      // Generate code sections
      const imports = this.generateImports(
        visualConfig,
        template,
        dependencies
      );
      const interfaces = this.generateInterfaces(visualConfig, template);
      const componentCode = this.generateComponent(visualConfig, template);
      const nodeDefinition = this.generateNodeDefinition(
        visualConfig,
        template,
        features
      );

      // Combine all sections
      const codeSections = [
        imports,
        interfaces,
        componentCode,
        nodeDefinition,
      ].filter(Boolean);
      const code = codeSections.join("\n\n");
      const linesGenerated = code.split("\n").length;

      // Estimate complexity
      const complexity = this.estimateComplexity(visualConfig, features);

      return {
        success: true,
        code,
        errors,
        warnings,
        metadata: {
          linesGenerated,
          estimatedComplexity: complexity,
          features,
          dependencies,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings,
        metadata: {
          linesGenerated: 0,
          estimatedComplexity: "low",
          features: [],
          dependencies: [],
        },
      };
    }
  }

  // Generate import statements
  private generateImports(
    config: VisualNodeConfig,
    template: NodeTemplate | null,
    dependencies: string[]
  ): string {
    if (!this.config.includeImports) return "";

    const imports = new Set<string>();

    // Core imports
    imports.add("import React from 'react';");
    imports.add("import { defineNode } from '@/node-system';");

    // Template-specific imports
    if (template?.patterns.imports) {
      template.patterns.imports.forEach((imp) => {
        imports.add(`import ${imp};`);
        dependencies.push(imp);
      });
    }

    // Type imports
    if (this.config.includeTypeAnnotations) {
      imports.add("import type { NodeContext } from '@/node-system/types';");
    }

    return Array.from(imports).join("\n");
  }

  // Generate TypeScript interfaces
  private generateInterfaces(
    config: VisualNodeConfig,
    template: NodeTemplate | null
  ): string {
    if (!this.config.includeTypeAnnotations) return "";

    const indent = this.getIndent();
    const interfaceName = `${this.toPascalCase(config.nodeType)}Data`;
    const lines = [`interface ${interfaceName} {`];

    // Add default data properties
    Object.entries(config.defaultData).forEach(([key, value]) => {
      const type = this.inferType(value);
      const optional = value === null || value === undefined ? "?" : "";
      lines.push(`${indent}${key}${optional}: ${type};`);
    });

    // Add result property for output nodes
    if (config.handles.some((h) => h.type === "source")) {
      lines.push(`${indent}result?: any;`);
    }

    lines.push("}");
    return lines.join("\n");
  }

  // Generate React component
  private generateComponent(
    config: VisualNodeConfig,
    template: NodeTemplate | null
  ): string {
    const componentName = `${this.toPascalCase(config.nodeType)}Component`;
    const dataType = `${this.toPascalCase(config.nodeType)}Data`;
    const indent = this.getIndent();

    const lines = [
      `const ${componentName}: React.FC<{`,
      `${indent}data: ${dataType};`,
      `${indent}updateData: (updates: Partial<${dataType}>) => void;`,
      `${indent}context: NodeContext;`,
      `}> = ({ data, updateData, context }) => {`,
      `${indent}return (`,
      `${indent}${indent}<div className="${config.nodeType}-node">`,
      `${indent}${indent}${indent}<h3>${config.displayName}</h3>`,
      `${indent}${indent}${indent}<p>${config.description}</p>`,
    ];

    // Generate form controls based on default data
    Object.entries(config.defaultData).forEach(([key, value]) => {
      const controlCode = this.generateFormControl(
        key,
        value,
        indent + indent + indent
      );
      lines.push(controlCode);
    });

    lines.push(`${indent}${indent}</div>`);
    lines.push(`${indent});`);
    lines.push("};");

    return lines.join("\n");
  }

  // Generate form control based on data type
  private generateFormControl(key: string, value: any, indent: string): string {
    const type = typeof value;
    const label = this.toTitleCase(key);

    switch (type) {
      case "string":
        return `${indent}<input type="text" placeholder="${label}" value={data.${key}} onChange={(e) => updateData({ ${key}: e.target.value })} />`;
      case "number":
        return `${indent}<input type="number" placeholder="${label}" value={data.${key}} onChange={(e) => updateData({ ${key}: Number(e.target.value) })} />`;
      case "boolean":
        return `${indent}<input type="checkbox" checked={data.${key}} onChange={(e) => updateData({ ${key}: e.target.checked })} />`;
      default:
        return `${indent}// TODO: Implement control for ${key} (${type})`;
    }
  }

  // Generate main node definition
  private generateNodeDefinition(
    config: VisualNodeConfig,
    template: NodeTemplate | null,
    features: string[]
  ): string {
    const indent = this.getIndent();
    const componentName = `${this.toPascalCase(config.nodeType)}Component`;
    const dataType = `${this.toPascalCase(config.nodeType)}Data`;

    const lines = [
      `export default defineNode<${dataType}>({`,
      `${indent}metadata: {`,
      `${indent}${indent}nodeType: "${config.nodeType}",`,
      `${indent}${indent}displayName: "${config.displayName}",`,
      `${indent}${indent}category: "${config.category}",`,
      `${indent}${indent}description: "${config.description}",`,
      `${indent}${indent}version: "${config.version}",`,
      `${indent}${indent}author: "${config.author}",`,
      `${indent}},`,
      `${indent}component: ${componentName},`,
    ];

    // Handles
    if (config.handles.length > 0) {
      lines.push(`${indent}handles: [`);
      config.handles.forEach((handle, index) => {
        lines.push(`${indent}${indent}{`);
        lines.push(`${indent}${indent}${indent}id: "${handle.id}",`);
        lines.push(`${indent}${indent}${indent}type: "${handle.type}",`);
        lines.push(
          `${indent}${indent}${indent}position: "${handle.position}",`
        );
        lines.push(
          `${indent}${indent}${indent}dataType: "${handle.dataType}",`
        );
        lines.push(
          `${indent}${indent}}${index < config.handles.length - 1 ? "," : ""}`
        );
      });
      lines.push(`${indent}],`);
    }

    // Default data
    lines.push(
      `${indent}defaultData: ${JSON.stringify(config.defaultData, null, 2).replace(/\n/g, "\n" + indent)},`
    );

    // Process logic
    lines.push(
      `${indent}processLogic: async ({ data, updateNodeData, context }) => {`
    );

    if (template?.patterns.processLogic) {
      const processLogic = template.patterns.processLogic
        .split("\n")
        .map((line) => (line.trim() ? indent + indent + line : ""))
        .join("\n");
      lines.push(processLogic);
    } else {
      lines.push(
        `${indent}${indent}console.log('Processing ${config.nodeType}...', data);`
      );
      lines.push(`${indent}${indent}// Add your processing logic here`);
    }

    lines.push(`${indent}},`);
    lines.push("});");

    return lines.join("\n");
  }

  // Validation helpers
  private validateConfig(
    config: VisualNodeConfig,
    errors: string[],
    warnings: string[]
  ): void {
    if (!config.nodeType) {
      errors.push("Node type is required");
    }

    if (!config.displayName) {
      errors.push("Display name is required");
    }

    if (!config.category) {
      errors.push("Category is required");
    }

    if (config.nodeType && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(config.nodeType)) {
      errors.push("Node type must be a valid identifier");
    }

    if (config.handles.length === 0) {
      warnings.push(
        "Node has no handles - it may not integrate with other nodes"
      );
    }
  }

  // Estimate code complexity
  private estimateComplexity(
    config: VisualNodeConfig,
    features: string[]
  ): "low" | "medium" | "high" {
    let score = 0;

    score += config.handles.length;
    score += Object.keys(config.defaultData).length;
    score += features.length;

    if (score <= 5) return "low";
    if (score <= 10) return "medium";
    return "high";
  }

  // Utility methods
  private getIndent(): string {
    const char = this.config.useSpaces ? " " : "\t";
    return char.repeat(this.config.indentSize);
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase());
  }

  private toTitleCase(str: string): string {
    return str
      .replace(/(?:^|[\s_-])+(.)/g, (_, char) => char.toUpperCase())
      .replace(/([A-Z])/g, " $1")
      .trim();
  }

  private inferType(value: any): string {
    if (value === null) return "any";
    if (Array.isArray(value)) return "any[]";
    if (typeof value === "object") return "Record<string, any>";
    return typeof value;
  }
}

export default VisualNodeCodeGenerator;
