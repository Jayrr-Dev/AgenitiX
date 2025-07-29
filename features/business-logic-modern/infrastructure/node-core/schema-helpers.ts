import { z } from "zod";
import type { ControlFieldConfig } from "./NodeSpec";

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
	 * Analyzes a Zod schema to generate field information for control generation
	 * This is the main function called by NodeInspectorService
	 */
	export function analyzeSchema(schema: z.ZodType<any>, basePath = ""): SchemaFieldInfo[] {
		if (schema instanceof z.ZodObject) {
			return processZodObject(schema, basePath);
		}
		
		// For non-object schemas, return empty array
		return [];
	}

	/**
	 * Introspects a Zod schema to generate control field configurations
	 */
	export function introspectSchema(_schema: z.ZodType<any>, _basePath = ""): ControlField[] {
		// This function can delegate to the newer analyzeSchema function
		// and convert SchemaFieldInfo to ControlField format
		return [];
	}

	/**
	 * Maps Zod types to control field types
	 */
	export function mapZodTypeToControlType(_zodType: z.ZodType<any>): ControlFieldType {
		// Fallback implementation - this function is now replaced by the internal helper
		return "text";
	}

	/**
	 * Extracts validation constraints from Zod types
	 */
	export function extractValidationConstraints(_zodType: z.ZodType<any>): ControlFieldValidation {
		// Fallback implementation
		return {};
	}

	/**
	 * Generates UI metadata for control fields
	 */
	export function generateUIMetadata(
		_zodType: z.ZodType<any>,
		_fieldName: string
	): Pick<ControlField, "label" | "description" | "placeholder"> {
		// Fallback implementation
		return {
			label: _fieldName,
			description: undefined,
			placeholder: undefined
		};
	}

	/**
	 * Recursively processes object schemas to generate control fields
	 */
	export function processObjectSchema(_schema: z.ZodObject<any>, _basePath = ""): ControlField[] {
		// Fallback implementation
		return [];
	}

	/**
	 * Processes array schemas to generate control fields
	 */
	export function processArraySchema(_schema: z.ZodArray<any>, _basePath = ""): ControlField[] {
		// Fallback implementation
		return [];
	}

	// ============================================================================
	// HELPER FUNCTIONS FOR SCHEMA ANALYSIS
	// ============================================================================

	/**
	 * Processes a ZodObject schema to extract field information
	 */
	function processZodObject(schema: z.ZodObject<any>, basePath = ""): SchemaFieldInfo[] {
		const fields: SchemaFieldInfo[] = [];
		const shape = schema.shape;

		for (const [key, zodType] of Object.entries(shape)) {
			const fieldInfo = analyzeZodField(key, zodType as z.ZodType<any>, basePath);
			if (fieldInfo) {
				fields.push(fieldInfo);
			}
		}

		return fields;
	}

	/**
	 * Analyzes a single Zod field to extract field information
	 */
	function analyzeZodField(key: string, zodType: z.ZodType<any>, basePath = ""): SchemaFieldInfo | null {
		const fullKey = basePath ? `${basePath}.${key}` : key;

		// Get the base type by unwrapping optionals, defaults, etc.
		const baseType = getBaseZodType(zodType);
		
		// Map to control type
		const controlType = mapZodToControlType(baseType);
		
		// Extract validation info
		const validation = extractZodValidation(zodType);
		
		// Check if field is required
		const required = !isZodOptional(zodType);
		
		// Extract default value
		const defaultValue = extractZodDefault(zodType);

		return {
			key: fullKey,
			zodType: baseType.constructor.name,
			controlType,
			label: generateFieldLabel(key),
			defaultValue,
			required,
			validation,
			description: extractZodDescription(zodType),
			placeholder: generateFieldPlaceholder(key, controlType),
			ui: generateFieldUI(baseType, key)
		};
	}

	/**
	 * Gets the base Zod type by unwrapping optionals, defaults, etc.
	 */
	function getBaseZodType(zodType: z.ZodType<any>): z.ZodType<any> {
		if (zodType instanceof z.ZodOptional) {
			return getBaseZodType(zodType.unwrap());
		}
		if (zodType instanceof z.ZodDefault) {
			return getBaseZodType(zodType.removeDefault());
		}
		if (zodType instanceof z.ZodNullable) {
			return getBaseZodType(zodType.unwrap());
		}
		return zodType;
	}

	/**
	 * Maps Zod types to control field types
	 */
	function mapZodToControlType(zodType: z.ZodType<any>): ControlFieldConfig["type"] {
		if (zodType instanceof z.ZodString) {
			return "text";
		}
		if (zodType instanceof z.ZodNumber) {
			return "number";
		}
		if (zodType instanceof z.ZodBoolean) {
			return "boolean";
		}
		if (zodType instanceof z.ZodEnum || zodType instanceof z.ZodUnion) {
			return "select";
		}
		if (zodType instanceof z.ZodDate) {
			return "date";
		}
		if (zodType instanceof z.ZodObject || zodType instanceof z.ZodArray) {
			return "json";
		}
		
		// Default fallback
		return "text";
	}

	/**
	 * Extracts validation constraints from Zod type
	 */
	function extractZodValidation(zodType: z.ZodType<any>): SchemaFieldInfo["validation"] {
		const validation: SchemaFieldInfo["validation"] = {};
		
		// Handle string validations
		if (zodType instanceof z.ZodString) {
			if (zodType.minLength !== null) validation.min = zodType.minLength;
			if (zodType.maxLength !== null) validation.max = zodType.maxLength;
		}
		
		// Handle number validations
		if (zodType instanceof z.ZodNumber) {
			if (zodType.minValue !== null) validation.min = zodType.minValue;
			if (zodType.maxValue !== null) validation.max = zodType.maxValue;
		}

		// Handle enum/union options
		if (zodType instanceof z.ZodEnum) {
			validation.options = zodType.options.map((value: any) => ({
				value,
				label: String(value)
			}));
		}

		return validation;
	}

	/**
	 * Checks if a Zod type is optional
	 */
	function isZodOptional(zodType: z.ZodType<any>): boolean {
		return zodType instanceof z.ZodOptional || zodType instanceof z.ZodDefault;
	}

	/**
	 * Extracts default value from Zod type
	 */
	function extractZodDefault(zodType: z.ZodType<any>): unknown {
		if (zodType instanceof z.ZodDefault) {
			return zodType._def.defaultValue();
		}
		return undefined;
	}

	/**
	 * Extracts description from Zod type
	 */
	function extractZodDescription(zodType: z.ZodType<any>): string | undefined {
		return zodType.description;
	}

	/**
	 * Generates a human-readable label from field key
	 */
	function generateFieldLabel(key: string): string {
		return key
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, str => str.toUpperCase())
			.trim();
	}

	/**
	 * Generates placeholder text for field
	 */
	function generateFieldPlaceholder(key: string, controlType: ControlFieldConfig["type"]): string {
		const label = generateFieldLabel(key);
		
		switch (controlType) {
			case "text":
			case "textarea":
				return `Enter ${label.toLowerCase()}`;
			case "number":
				return `Enter ${label.toLowerCase()} value`;
			case "email":
				return "Enter email address";
			case "url":
				return "Enter URL";
			case "date":
				return "Select date";
			default:
				return `Enter ${label.toLowerCase()}`;
		}
	}

	/**
	 * Generates UI configuration for field
	 */
	function generateFieldUI(zodType: z.ZodType<any>, key: string): SchemaFieldInfo["ui"] {
		const ui: SchemaFieldInfo["ui"] = {};

		// Configure textarea for long text fields
		if (zodType instanceof z.ZodString && (key.includes('description') || key.includes('content'))) {
			ui.rows = 3;
			ui.multiline = true;
		}

		// Configure number step
		if (zodType instanceof z.ZodNumber) {
			ui.step = 1;
		}

		return ui;
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
