import { z } from "zod";
import type { ControlFieldConfig } from "./NodeSpec";

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
	text: (defaultValue = "") =>
		z.string().default(defaultValue),

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
 * Advanced Zod schema introspection engine
 * Analyzes Zod schemas to automatically generate control field configurations
 */
export class SchemaIntrospector {
	/**
	 * Analyze a Zod schema and extract control field information
	 */
	static analyzeSchema(schema: z.ZodSchema<any>): SchemaFieldInfo[] {
		const fields: SchemaFieldInfo[] = [];

		try {
			if (schema instanceof z.ZodObject) {
				const shape = schema.shape;

				Object.entries(shape).forEach(([key, fieldSchema]) => {
					const fieldInfo = this.analyzeField(key, fieldSchema as z.ZodTypeAny);
					if (fieldInfo) {
						fields.push(fieldInfo);
					}
				});
			}
		} catch (error) {
			console.error("Schema analysis failed:", error);
		}

		return fields;
	}

	/**
	 * Analyze individual field schema
	 */
	private static analyzeField(key: string, schema: z.ZodTypeAny): SchemaFieldInfo | null {
		try {
			// Handle optional fields
			let actualSchema = schema;
			let isOptional = false;

			if (schema instanceof z.ZodOptional) {
				actualSchema = schema._def.innerType;
				isOptional = true;
			}

			// Handle default values
			let defaultValue: unknown = undefined;
			if (schema instanceof z.ZodDefault) {
				defaultValue = schema._def.defaultValue();
				actualSchema = schema._def.innerType;
			}

			// Determine control type and extract validation
			const controlInfo = this.mapZodTypeToControl(actualSchema, key);
			if (!controlInfo) return null;

			return {
				key,
				zodType: actualSchema.constructor.name,
				controlType: controlInfo.type,
				label: this.humanizeLabel(key),
				defaultValue: defaultValue ?? controlInfo.defaultValue,
				required: !isOptional,
				validation: controlInfo.validation,
				description: controlInfo.description,
				placeholder: controlInfo.placeholder,
				ui: controlInfo.ui,
			};
		} catch (error) {
			console.warn(`Failed to analyze field ${key}:`, error);
			return null;
		}
	}

	/**
	 * Map Zod types to control types with validation extraction
	 */
	private static mapZodTypeToControl(
		schema: z.ZodTypeAny,
		key: string
	): {
		type: ControlFieldConfig["type"];
		defaultValue: unknown;
		validation: SchemaFieldInfo["validation"];
		description?: string;
		placeholder?: string;
		ui?: SchemaFieldInfo["ui"];
	} | null {
		// String types
		if (schema instanceof z.ZodString) {
			const checks = (schema as any)._def.checks || [];
			const validation: SchemaFieldInfo["validation"] = {};

			// Extract string validation
			checks.forEach((check: any) => {
				switch (check.kind) {
					case "min":
						validation.min = check.value;
						break;
					case "max":
						validation.max = check.value;
						break;
					case "regex":
						validation.pattern = check.regex.source;
						break;
					case "email":
						return {
							type: "email" as const,
							defaultValue: "",
							validation,
							placeholder: "Enter email address...",
						};
					case "url":
						return {
							type: "url" as const,
							defaultValue: "",
							validation,
							placeholder: "Enter URL...",
						};
				}
			});

			// Determine if it should be textarea based on key name or length
			const isTextarea =
				key.toLowerCase().includes("text") ||
				key.toLowerCase().includes("description") ||
				key.toLowerCase().includes("content") ||
				key.toLowerCase().includes("message");

			return {
				type: isTextarea ? "textarea" : "text",
				defaultValue: "",
				validation,
				placeholder: `Enter ${this.humanizeLabel(key).toLowerCase()}...`,
				ui: isTextarea ? { rows: 3 } : undefined,
			};
		}

		// Number types
		if (schema instanceof z.ZodNumber) {
			const checks = (schema as any)._def.checks || [];
			const validation: SchemaFieldInfo["validation"] = {};

			checks.forEach((check: any) => {
				switch (check.kind) {
					case "min":
						validation.min = check.value;
						break;
					case "max":
						validation.max = check.value;
						break;
				}
			});

			return {
				type: "number",
				defaultValue: 0,
				validation,
				ui: { step: 1 },
			};
		}

		// Boolean types
		if (schema instanceof z.ZodBoolean) {
			return {
				type: "boolean",
				defaultValue: false,
				validation: {},
			};
		}

		// Enum types
		if (schema instanceof z.ZodEnum) {
			const options = (schema as any)._def.values.map((value: string) => ({
				value,
				label: this.humanizeLabel(value),
			}));

			return {
				type: "select",
				defaultValue: options[0]?.value,
				validation: { options },
			};
		}

		// Date types
		if (schema instanceof z.ZodDate) {
			return {
				type: "date",
				defaultValue: new Date(),
				validation: {},
			};
		}

		// Array and object types (JSON)
		if (schema instanceof z.ZodArray || schema instanceof z.ZodObject) {
			return {
				type: "json",
				defaultValue: schema instanceof z.ZodArray ? [] : {},
				validation: {},
				ui: { showPreview: true },
			};
		}

		// Fallback for unknown types
		return {
			type: "text",
			defaultValue: "",
			validation: {},
			description: `Unknown type: ${schema.constructor.name}`,
		};
	}

	/**
	 * Convert camelCase/snake_case to human-readable labels
	 */
	private static humanizeLabel(key: string): string {
		return key
			.replace(/([A-Z])/g, " $1") // Add space before capitals
			.replace(/[_-]/g, " ") // Replace underscores and dashes with spaces
			.replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
			.trim();
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
