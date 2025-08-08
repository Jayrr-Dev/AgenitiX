/**
 * Logic domain type definitions
 * Shared types for logic gate nodes
 */

import { SafeSchemas } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { z } from "zod";

/**
 * Base schema for all logic gate nodes
 * All logic gates share the same basic structure
 */
export const BaseLogicDataSchema = z
	.object({
		output: z.boolean().nullable().default(null),
		isEnabled: SafeSchemas.boolean(true),
		isActive: SafeSchemas.boolean(true),
		isExpanded: SafeSchemas.boolean(false),
		expandedSize: SafeSchemas.text("PRIMITIVE"),
		collapsedSize: SafeSchemas.text("PRIMITIVE"),
	})
	.passthrough();

export type BaseLogicData = z.infer<typeof BaseLogicDataSchema>;

/**
 * Logic gate types
 */
export type LogicGateType = "AND" | "OR" | "NOT" | "XOR" | "XNOR";

/**
 * Logic gate operation function type
 */
export type LogicOperation = (inputs: boolean[]) => boolean | null;

/**
 * Logic gate operation for NOT (single input)
 */
export type NotOperation = (input: boolean | null) => boolean | null;
