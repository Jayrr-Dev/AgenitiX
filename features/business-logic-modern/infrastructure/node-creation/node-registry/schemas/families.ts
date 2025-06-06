/**
 * NODE FAMILY SCHEMAS - Discriminated union schemas for different node types
 *
 * • Extends BaseNodeSchema with family-specific data structures
 * • Type-safe default data for each node family
 * • Supports simple text nodes and complex data nodes
 * • Discriminated union enables compile-time type checking
 *
 * Keywords: node-families, discriminated-union, type-safety, complex-nodes
 */

import { z } from "zod";
import { BaseNodeSchema } from "./base";

// ============================================================================
// SIMPLE NODE FAMILIES
// ============================================================================

/**
 * Simple text-based nodes (create, display text)
 */
export const SimpleTextNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("createText"),
  category: z.literal("create"),
  defaultData: z.object({
    text: z.string().default(""),
    heldText: z.string().default(""),
    isActive: z.boolean().default(false),
  }),
});

export const ViewOutputNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("viewOutput"),
  category: z.literal("view"),
  defaultData: z.object({
    inputText: z.string().default(""),
    displayText: z.string().default(""),
    isActive: z.boolean().default(false),
  }),
});

export const TriggerToggleNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("triggerOnToggle"),
  category: z.literal("trigger"),
  defaultData: z.object({
    isActive: z.boolean().default(false),
    triggerCount: z.number().default(0),
    lastTriggered: z.string().optional(), // ISO date string
  }),
});

export const TestErrorNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("testError"),
  category: z.literal("test"),
  defaultData: z.object({
    shouldError: z.boolean().default(false),
    errorMessage: z.string().default("Test error"),
    isActive: z.boolean().default(false),
    errorCount: z.number().default(0),
  }),
});

// ============================================================================
// COMPLEX NODE FAMILIES
// ============================================================================

/**
 * Data table node with columns, rows, and pagination
 */
export const DataTableNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("dataTable"),
  category: z.literal("data"),
  defaultData: z.object({
    columns: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          type: z.enum(["string", "number", "boolean", "date"]),
          width: z.number().positive().optional(),
          sortable: z.boolean().default(true),
          filterable: z.boolean().default(true),
          visible: z.boolean().default(true),
        })
      )
      .default([
        { id: "name", label: "Name", type: "string", width: 150 },
        { id: "value", label: "Value", type: "number", width: 100 },
      ]),
    rows: z.array(z.record(z.unknown())).default([]),
    pagination: z.object({
      page: z.number().positive().default(1),
      pageSize: z.number().positive().default(10),
      totalRows: z.number().nonnegative().default(0),
    }),
    filters: z.record(z.unknown()).default({}),
    sorting: z
      .object({
        column: z.string().optional(),
        direction: z.enum(["asc", "desc"]).default("asc"),
      })
      .optional(),
    selection: z.object({
      mode: z.enum(["none", "single", "multiple"]).default("none"),
      selected: z.array(z.string()).default([]), // row IDs
    }),
  }),
});

/**
 * Image processing node with transforms and filters
 */
export const ImageTransformNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("imageTransform"),
  category: z.literal("media"),
  defaultData: z.object({
    src: z.string().url().optional().or(z.literal("")),
    alt: z.string().default(""),
    transform: z
      .enum([
        "none",
        "grayscale",
        "blur",
        "brightness",
        "contrast",
        "invert",
        "sepia",
        "saturate",
      ])
      .default("none"),
    intensity: z.number().min(0).max(2).default(1),
    dimensions: z.object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      aspectRatio: z
        .enum(["original", "1:1", "16:9", "4:3", "3:2"])
        .default("original"),
    }),
    filters: z
      .array(
        z.object({
          type: z.string(),
          value: z.number(),
          enabled: z.boolean().default(true),
        })
      )
      .default([]),
    output: z.object({
      format: z.enum(["png", "jpg", "webp", "svg"]).default("png"),
      quality: z.number().min(0).max(100).default(90),
    }),
  }),
});

/**
 * API endpoint node for HTTP requests
 */
export const ApiNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("apiRequest"),
  category: z.literal("data"),
  defaultData: z.object({
    url: z.string().url().optional().or(z.literal("")),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
    headers: z.record(z.string()).default({}),
    body: z.string().default(""),
    timeout: z.number().positive().default(5000),
    retries: z.number().nonnegative().default(0),
    auth: z.object({
      type: z.enum(["none", "bearer", "basic", "apikey"]).default("none"),
      token: z.string().default(""),
      username: z.string().default(""),
      password: z.string().default(""),
      apiKey: z.string().default(""),
    }),
    response: z.object({
      status: z.number().optional(),
      data: z.unknown().optional(),
      error: z.string().optional(),
      lastRequested: z.string().optional(), // ISO date
    }),
  }),
});

/**
 * Chart/visualization node
 */
export const ChartNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("chart"),
  category: z.literal("view"),
  defaultData: z.object({
    chartType: z
      .enum(["line", "bar", "pie", "scatter", "area", "histogram"])
      .default("line"),
    data: z
      .array(
        z.object({
          x: z.union([z.string(), z.number()]),
          y: z.number(),
          category: z.string().optional(),
        })
      )
      .default([]),
    config: z.object({
      title: z.string().default(""),
      xLabel: z.string().default("X Axis"),
      yLabel: z.string().default("Y Axis"),
      showGrid: z.boolean().default(true),
      showLegend: z.boolean().default(true),
      colors: z
        .array(z.string())
        .default(["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"]),
    }),
    interaction: z.object({
      zoom: z.boolean().default(false),
      pan: z.boolean().default(false),
      hover: z.boolean().default(true),
      click: z.boolean().default(false),
    }),
  }),
});

/**
 * Form input node with validation
 */
export const FormInputNodeSchema = BaseNodeSchema.extend({
  nodeType: z.literal("formInput"),
  category: z.literal("control"),
  defaultData: z.object({
    inputType: z
      .enum([
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "search",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "date",
        "time",
        "file",
      ])
      .default("text"),
    label: z.string().default(""),
    placeholder: z.string().default(""),
    value: z.union([z.string(), z.number(), z.boolean()]).default(""),
    required: z.boolean().default(false),
    disabled: z.boolean().default(false),
    validation: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(), // regex pattern
      min: z.number().optional(), // for numbers
      max: z.number().optional(), // for numbers
      custom: z.string().optional(), // custom validation function path
    }),
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.union([z.string(), z.number()]),
          disabled: z.boolean().default(false),
        })
      )
      .default([]), // for select, radio, checkbox
    error: z.string().optional(),
    touched: z.boolean().default(false),
  }),
});

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

/**
 * Complete node schema with discriminated union
 * This enables type-safe handling of all node families
 */
export const NodeRegistrationSchema = z.discriminatedUnion("nodeType", [
  // Simple nodes
  SimpleTextNodeSchema,
  ViewOutputNodeSchema,
  TriggerToggleNodeSchema,
  TestErrorNodeSchema,

  // Complex nodes
  DataTableNodeSchema,
  ImageTransformNodeSchema,
  ApiNodeSchema,
  ChartNodeSchema,
  FormInputNodeSchema,
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SimpleTextNode = z.infer<typeof SimpleTextNodeSchema>;
export type ViewOutputNode = z.infer<typeof ViewOutputNodeSchema>;
export type TriggerToggleNode = z.infer<typeof TriggerToggleNodeSchema>;
export type TestErrorNode = z.infer<typeof TestErrorNodeSchema>;

export type DataTableNode = z.infer<typeof DataTableNodeSchema>;
export type ImageTransformNode = z.infer<typeof ImageTransformNodeSchema>;
export type ApiNode = z.infer<typeof ApiNodeSchema>;
export type ChartNode = z.infer<typeof ChartNodeSchema>;
export type FormInputNode = z.infer<typeof FormInputNodeSchema>;

export type NodeRegistration = z.infer<typeof NodeRegistrationSchema>;

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

/**
 * Get schema for specific node type
 */
export function getNodeSchema(nodeType: string): z.ZodSchema | null {
  const schemas = {
    createText: SimpleTextNodeSchema,
    viewOutput: ViewOutputNodeSchema,
    triggerOnToggle: TriggerToggleNodeSchema,
    testError: TestErrorNodeSchema,
    dataTable: DataTableNodeSchema,
    imageTransform: ImageTransformNodeSchema,
    apiRequest: ApiNodeSchema,
    chart: ChartNodeSchema,
    formInput: FormInputNodeSchema,
  };

  return schemas[nodeType as keyof typeof schemas] || null;
}

/**
 * Validate node registration data
 */
export function validateNodeRegistration(data: unknown): {
  success: boolean;
  data?: NodeRegistration;
  error?: string;
} {
  try {
    const validated = NodeRegistrationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Get default data for node type
 */
export function getDefaultData(
  nodeType: string
): Record<string, unknown> | null {
  const schema = getNodeSchema(nodeType);
  if (!schema) return null;

  try {
    const parsed = schema.parse({ nodeType, defaultData: {} });
    return parsed.defaultData;
  } catch {
    return null;
  }
}
