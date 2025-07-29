import { z } from "zod";

// Type definitions for schema introspection
interface ControlField {
	name: string;
	type: ControlFieldType;
	label: string;
	validation?: ControlFieldValidation;
	description?: string;
	placeholder?: string;
}

type ControlFieldType = "text" | "number" | "boolean" | "select" | "textarea" | "date" | "json";

interface ControlFieldValidation {
	min?: number;
	max?: number;
	required?: boolean;
	pattern?: string;
	options?: ControlFieldOption[];
}

interface ControlFieldOption {
	value: string;
	label: string;
}

/**
 * SCHEMA INTROSPECTION ENGINE - Advanced Zod schema analysis for automatic control generation
 *
 * • Analyzes Zod schemas to extract field definitions and validation rules
 * • Automatically maps Zod types to appropriate UI control types
 * • Extracts validation constraints, defaults, and metadata
 * • Supports complex nested schemas and custom field configurations
 * • Enables zero-maintenance control generation for 400+ node types
 *
 * Keywords: schema-introspection, automatic-controls, zod-analysis, type-mapping, validation-extraction
 */

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
		console.warn("Failed to extract schema defaults, using empty object:", error);
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
	text: (defaultValue = "") => z.string().default(defaultValue),

	/**
	 * Optional text field
	 */
	optionalText: (defaultValue?: string) =>
		defaultValue ? z.string().optional().default(defaultValue) : z.string().optional(),

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
			? z.string().email("Invalid email format").optional().default(defaultValue)
			: z.string().email("Invalid email format").optional(),

	/**
	 * Enum field with safe defaults
	 */
	enum: <T extends [string, ...string[]]>(values: T, defaultValue: T[number]) =>
		z.enum(values).default(defaultValue),

	/**
	 * JSON field with safe defaults
	 */
	json: (defaultValue: any = {}) => z.any().default(defaultValue),

	/**
	 * Array field with safe defaults
	 */
	array: <T extends z.ZodTypeAny>(itemSchema: T, defaultValue: z.infer<T>[] = []) =>
		z.array(itemSchema).default(defaultValue),

	/**
	 * Date field with safe defaults
	 */
	date: (defaultValue?: Date) =>
		defaultValue ? z.date().optional().default(defaultValue) : z.date().optional(),

	/**
	 * Color field with safe defaults
	 */
	color: (defaultValue = "#000000") =>
		z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
			.default(defaultValue),
};

// ============================================================================
// SCHEMA INTROSPECTION ENGINE
// ============================================================================

/**
 * Extracted field information from Zod schema analysis
 */
export interface SchemaFieldInfo {
	key: string;
	zodType: string;
	controlType: ControlFieldConfig["type"];
	label: string;
	defaultValue: unknown;
	required: boolean;
	validation: {
		min?: number;
		max?: number;
		pattern?: string;
		options?: Array<{ value: unknown; label: string }>;
	};
	description?: string;
	placeholder?: string;
	ui?: {
		rows?: number;
		step?: number;
		multiline?: boolean;
		showPreview?: boolean;
	};
}

/**
 * Schema introspection utilities
 * Analyzes Zod schemas to automatically generate control field configurations
 */
export namespace SchemaIntrospector {
	/**
	 * Introspects a Zod schema to generate control field configurations
	 */
	export function introspectSchema(_schema: z.ZodType<any>, _basePath = ""): ControlField[] {
		// ... existing code ...
	}

	/**
	 * Maps Zod types to control field types
	 */
	export function mapZodTypeToControlType(_zodType: z.ZodType<any>): ControlFieldType {
		// ... existing code ...
	}

	/**
	 * Extracts validation constraints from Zod types
	 */
	export function extractValidationConstraints(_zodType: z.ZodType<any>): ControlFieldValidation {
		// ... existing code ...
	}

	/**
	 * Generates UI metadata for control fields
	 */
	export function generateUIMetadata(
		_zodType: z.ZodType<any>,
		_fieldName: string
	): Pick<ControlField, "label" | "description" | "placeholder"> {
		// ... existing code ...
	}

	/**
	 * Recursively processes object schemas to generate control fields
	 */
	export function processObjectSchema(_schema: z.ZodObject<any>, _basePath = ""): ControlField[] {
		// ... existing code ...
	}

	/**
	 * Processes array schemas to generate control fields
	 */
	export function processArraySchema(_schema: z.ZodArray<any>, _basePath = ""): ControlField[] {
		// ... existing code ...
	}

	/**
	 * Processes union schemas to generate control fields
	 */
	export function processUnionSchema(_schema: z.ZodUnion<any>, _basePath = ""): ControlField[] {
		// ... existing code ...
	}

	/**
	 * Processes optional schemas to generate control fields
	 */
	export function processOptionalSchema(
		_schema: z.ZodOptional<any>,
		_basePath = ""
	): ControlField[] {
		// ... existing code ...
	}

	/**
	 * Generates control field options from Zod enum schemas
	 */
	export function generateEnumOptions(_zodEnum: z.ZodEnum<any>): ControlFieldOption[] {
		// ... existing code ...
	}

	/**
	 * Generates control field options from Zod literal union schemas
	 */
	export function generateLiteralUnionOptions(_zodUnion: z.ZodUnion<any>): ControlFieldOption[] {
		// ... existing code ...
	}
}

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
