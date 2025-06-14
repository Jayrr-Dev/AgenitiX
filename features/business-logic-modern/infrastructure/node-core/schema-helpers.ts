import { z } from "zod";

/**
 * Schema Helper Utilities
 * Prevents common validation issues in node creation
 */

/**
 * Safely extracts defaults from a Zod schema
 * This prevents the common issue of parsing empty objects against schemas with required fields
 */
export function extractSchemaDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  try {
    // Create an object with undefined values for all keys
    const shape = schema.shape;
    const emptyObject: Record<string, undefined> = {};

    // For each field in the schema, try to get its default
    Object.keys(shape).forEach((key) => {
      emptyObject[key] = undefined;
    });

    // Parse with the schema - this will apply defaults
    return schema.parse(emptyObject);
  } catch (error) {
    console.warn(
      "Failed to extract schema defaults, using empty object:",
      error
    );
    return {} as z.infer<z.ZodObject<T>>;
  }
}

/**
 * Creates a safe NodeSpec initialData from a schema
 * Ensures that initialData always matches the schema requirements
 */
export function createSafeInitialData<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides: Partial<z.infer<z.ZodObject<T>>> = {}
): z.infer<z.ZodObject<T>> {
  const defaults = extractSchemaDefaults(schema);
  const merged = { ...defaults, ...overrides };

  try {
    // Validate the merged data against the schema
    return schema.parse(merged);
  } catch (error) {
    console.error("Schema validation failed for initial data:", error);
    console.error("Defaults:", defaults);
    console.error("Overrides:", overrides);
    console.error("Merged:", merged);
    throw new Error(`Invalid initial data for schema: ${error}`);
  }
}

/**
 * Common schema patterns with proper defaults
 * Use these instead of raw Zod schemas to prevent validation issues
 */
export const SafeSchemas = {
  /**
   * Text field with safe defaults
   */
  text: (defaultValue = "Default text") =>
    z.string().min(1, "Text cannot be empty").default(defaultValue),

  /**
   * Optional text field
   */
  optionalText: (defaultValue?: string) =>
    defaultValue
      ? z.string().optional().default(defaultValue)
      : z.string().optional(),

  /**
   * Number field with safe defaults
   */
  number: (defaultValue = 0, min = 0, max?: number) => {
    const baseSchema = z.number().min(min);
    const withMax = max !== undefined ? baseSchema.max(max) : baseSchema;
    return withMax.default(defaultValue);
  },

  /**
   * Boolean field with safe defaults
   */
  boolean: (defaultValue = false) => z.boolean().default(defaultValue),

  /**
   * URL field with safe defaults
   */
  url: (defaultValue?: string) =>
    defaultValue
      ? z.string().url("Invalid URL format").optional().default(defaultValue)
      : z.string().url("Invalid URL format").optional(),

  /**
   * Email field with safe defaults
   */
  email: (defaultValue?: string) =>
    defaultValue
      ? z
          .string()
          .email("Invalid email format")
          .optional()
          .default(defaultValue)
      : z.string().email("Invalid email format").optional(),

  /**
   * Enum field with safe defaults
   */
  enum: <T extends [string, ...string[]]>(values: T, defaultValue: T[number]) =>
    z.enum(values).default(defaultValue),
};

/**
 * Validates that a schema and initialData are compatible
 * Use this in development to catch schema/initialData mismatches early
 */
export function validateSchemaCompatibility<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  initialData: any,
  nodeName: string
): boolean {
  try {
    schema.parse(initialData);
    return true;
  } catch (error) {
    console.error(`Schema compatibility check failed for ${nodeName}:`, error);
    console.error("Schema:", schema.shape);
    console.error("Initial data:", initialData);
    return false;
  }
}
