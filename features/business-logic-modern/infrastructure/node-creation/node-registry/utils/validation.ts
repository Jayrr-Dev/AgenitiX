/**
 * REGISTRY VALIDATION SYSTEM
 *
 * Comprehensive validation for YAML configurations, generated registries,
 * and runtime registry integrity
 */

import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const NodeMetadataValidationSchema = z.object({
  nodeType: z
    .string()
    .min(1, "Node type cannot be empty")
    .max(50, "Node type too long")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Node type must be alphanumeric"),

  category: z.string().min(1, "Category is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().min(1, "Icon is required"),
  folder: z.enum(["main", "advanced"], "Folder must be 'main' or 'advanced'"),
  order: z.number().min(0, "Order must be non-negative"),

  // Legacy dimensions
  iconWidth: z.number().positive("Icon width must be positive"),
  iconHeight: z.number().positive("Icon height must be positive"),
  expandedWidth: z.number().positive("Expanded width must be positive"),
  expandedHeight: z.number().positive("Expanded height must be positive"),

  // UI Configuration
  hasToggle: z.boolean(),
  isEnabled: z.boolean(),
  isExperimental: z.boolean(),

  // Handles validation
  handles: z
    .array(
      z.object({
        id: z.string().min(1, "Handle ID required"),
        type: z.enum(
          ["source", "target"],
          "Handle type must be source or target"
        ),
        dataType: z.string().min(1, "Handle data type required"),
        position: z.string().min(1, "Handle position required"),
        label: z.string().optional(),
        isConnectable: z.boolean().optional(),
      })
    )
    .min(1, "At least one handle is required"),

  // Component paths
  component: z
    .string()
    .min(1, "Component path is required")
    .regex(/^\.\/.*$/, "Component path must be relative"),
  inspectorComponent: z
    .string()
    .regex(/^\.\/.*$/, "Inspector component path must be relative")
    .optional(),
});

export const CategoryValidationSchema = z.object({
  displayName: z.string().min(1, "Category display name required"),
  description: z
    .string()
    .min(10, "Category description must be at least 10 characters"),
  icon: z.string().min(1, "Category icon required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be valid hex"),
  order: z.number().min(0, "Order must be non-negative"),
  folder: z.enum(["main", "advanced"], "Folder must be 'main' or 'advanced'"),
  isEnabled: z.boolean(),
  isCollapsible: z.boolean().optional(),
  isCollapsedByDefault: z.boolean().optional(),
});

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  severity: "error" | "warning";
}

export interface ValidationWarning extends ValidationError {
  severity: "warning";
  suggestion?: string;
}

export interface ValidationStats {
  totalNodes: number;
  totalCategories: number;
  validNodes: number;
  validCategories: number;
  totalErrors: number;
  totalWarnings: number;
  validationTime: number;
}

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate individual node metadata
 */
export function validateNodeMetadata(nodeData: any): ValidationResult {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    // Schema validation
    NodeMetadataValidationSchema.parse(nodeData);

    // Business logic validation
    validateNodeBusinessRules(nodeData, errors, warnings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors.push({
          code: "SCHEMA_VALIDATION",
          message: err.message,
          field: err.path.join("."),
          value: err.input,
          severity: "error",
        });
      });
    } else {
      errors.push({
        code: "UNKNOWN_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown validation error",
        severity: "error",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalNodes: 1,
      totalCategories: 0,
      validNodes: errors.length === 0 ? 1 : 0,
      validCategories: 0,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      validationTime: Date.now() - startTime,
    },
  };
}

/**
 * Validate category metadata
 */
export function validateCategoryMetadata(categoryData: any): ValidationResult {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  try {
    CategoryValidationSchema.parse(categoryData);

    // Business logic validation for categories
    validateCategoryBusinessRules(categoryData, errors, warnings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        errors.push({
          code: "SCHEMA_VALIDATION",
          message: err.message,
          field: err.path.join("."),
          value: err.input,
          severity: "error",
        });
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalNodes: 0,
      totalCategories: 1,
      validNodes: 0,
      validCategories: errors.length === 0 ? 1 : 0,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      validationTime: Date.now() - startTime,
    },
  };
}

/**
 * Validate complete registry
 */
export function validateCompleteRegistry(
  nodes: any[],
  categories: Record<string, any>
): ValidationResult {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  let validNodes = 0;
  let validCategories = 0;

  // Validate each node
  nodes.forEach((nodeData, index) => {
    const result = validateNodeMetadata(nodeData);
    if (result.isValid) {
      validNodes++;
    }

    // Add context to errors
    result.errors.forEach((error) => {
      errors.push({
        ...error,
        field: `nodes[${index}].${error.field}`,
      });
    });

    warnings.push(...result.warnings);
  });

  // Validate each category
  Object.entries(categories).forEach(([key, categoryData]) => {
    const result = validateCategoryMetadata(categoryData);
    if (result.isValid) {
      validCategories++;
    }

    // Add context to errors
    result.errors.forEach((error) => {
      errors.push({
        ...error,
        field: `categories.${key}.${error.field}`,
      });
    });

    warnings.push(...result.warnings);
  });

  // Cross-validation
  validateCrossReferences(nodes, categories, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalNodes: nodes.length,
      totalCategories: Object.keys(categories).length,
      validNodes,
      validCategories,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      validationTime: Date.now() - startTime,
    },
  };
}

// ============================================================================
// BUSINESS RULES VALIDATION
// ============================================================================

function validateNodeBusinessRules(
  nodeData: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check for reserved node types
  const reservedTypes = ["node", "edge", "group", "selection"];
  if (reservedTypes.includes(nodeData.nodeType)) {
    errors.push({
      code: "RESERVED_NODE_TYPE",
      message: `Node type '${nodeData.nodeType}' is reserved`,
      field: "nodeType",
      value: nodeData.nodeType,
      severity: "error",
    });
  }

  // Check handle ID uniqueness
  const handleIds = new Set();
  nodeData.handles?.forEach((handle: any, index: number) => {
    if (handleIds.has(handle.id)) {
      errors.push({
        code: "DUPLICATE_HANDLE_ID",
        message: `Duplicate handle ID: ${handle.id}`,
        field: `handles[${index}].id`,
        value: handle.id,
        severity: "error",
      });
    }
    handleIds.add(handle.id);
  });

  // Warn about experimental nodes in production
  if (nodeData.isExperimental && process.env.NODE_ENV === "production") {
    warnings.push({
      code: "EXPERIMENTAL_IN_PRODUCTION",
      message: "Experimental node in production build",
      field: "isExperimental",
      value: nodeData.isExperimental,
      severity: "warning",
      suggestion: "Consider setting isExperimental to false for production",
    });
  }

  // Check reasonable dimensions
  if (nodeData.iconWidth > 200 || nodeData.iconHeight > 200) {
    warnings.push({
      code: "LARGE_ICON_DIMENSIONS",
      message: "Icon dimensions are unusually large",
      severity: "warning",
      suggestion: "Consider smaller icon dimensions for better UI performance",
    });
  }
}

function validateCategoryBusinessRules(
  categoryData: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Validate color contrast
  const color = categoryData.color;
  if (color && isLowContrast(color)) {
    warnings.push({
      code: "LOW_CONTRAST_COLOR",
      message: "Category color may have poor contrast",
      field: "color",
      value: color,
      severity: "warning",
      suggestion: "Consider using a higher contrast color",
    });
  }
}

function validateCrossReferences(
  nodes: any[],
  categories: Record<string, any>,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Check that all node categories exist
  nodes.forEach((nodeData, index) => {
    if (!categories[nodeData.category]) {
      errors.push({
        code: "MISSING_CATEGORY",
        message: `Node references non-existent category: ${nodeData.category}`,
        field: `nodes[${index}].category`,
        value: nodeData.category,
        severity: "error",
      });
    }
  });

  // Check for unused categories
  const usedCategories = new Set(nodes.map((node) => node.category));
  Object.keys(categories).forEach((categoryKey) => {
    if (!usedCategories.has(categoryKey)) {
      warnings.push({
        code: "UNUSED_CATEGORY",
        message: `Category '${categoryKey}' is not used by any nodes`,
        field: `categories.${categoryKey}`,
        severity: "warning",
        suggestion: "Consider removing unused categories",
      });
    }
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a color has low contrast (simplified)
 */
function isLowContrast(hexColor: string): boolean {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Consider low contrast if too light or too dark
  return luminance < 0.2 || luminance > 0.8;
}

/**
 * Format validation results for console output
 */
export function formatValidationResults(result: ValidationResult): string {
  const { isValid, errors, warnings, stats } = result;

  let output = `\n📊 Validation Results:\n`;
  output += `   Status: ${isValid ? "✅ Valid" : "❌ Invalid"}\n`;
  output += `   Nodes: ${stats.validNodes}/${stats.totalNodes} valid\n`;
  output += `   Categories: ${stats.validCategories}/${stats.totalCategories} valid\n`;
  output += `   Errors: ${stats.totalErrors}\n`;
  output += `   Warnings: ${stats.totalWarnings}\n`;
  output += `   Time: ${stats.validationTime}ms\n`;

  if (errors.length > 0) {
    output += `\n❌ Errors:\n`;
    errors.forEach((error) => {
      output += `   ${error.code}: ${error.message}`;
      if (error.field) output += ` (${error.field})`;
      output += `\n`;
    });
  }

  if (warnings.length > 0) {
    output += `\n⚠️  Warnings:\n`;
    warnings.forEach((warning) => {
      output += `   ${warning.code}: ${warning.message}`;
      if (warning.field) output += ` (${warning.field})`;
      if (warning.suggestion) output += ` - ${warning.suggestion}`;
      output += `\n`;
    });
  }

  return output;
}

export default {
  validateNodeMetadata,
  validateCategoryMetadata,
  validateCompleteRegistry,
  formatValidationResults,
};
