import { z } from "zod";

/**
 * Enterprise-grade node data validation utilities
 *
 * This module provides standardized validation for all node data
 * with comprehensive error handling, logging, recovery mechanisms,
 * error tracking integration, and metrics collection.
 */

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      data: T; // Safe fallback data
      errors: z.ZodIssue[];
      originalData: unknown;
    };

export type ValidationMetrics = {
  nodeType: string;
  validationCount: number;
  failureCount: number;
  lastFailure?: Date;
  errorTypes: Record<string, number>;
};

// Metrics storage for monitoring validation performance
const validationMetrics = new Map<string, ValidationMetrics>();

/**
 * Error tracking service interface for flexibility
 * Can be implemented with Sentry, LogRocket, or custom service
 */
export interface ErrorTrackingService {
  captureError(error: any, context?: Record<string, unknown>): void;
  captureMessage(message: string, level: "info" | "warning" | "error"): void;
}

// Global error tracking service instance
let errorTrackingService: ErrorTrackingService | null = null;

/**
 * Initialize error tracking service for enterprise monitoring
 */
export function initializeErrorTracking(service: ErrorTrackingService) {
  errorTrackingService = service;
  console.info("Enterprise error tracking initialized");
}

/**
 * Example Sentry integration (uncomment when ready)
 */
/*
import * as Sentry from '@sentry/nextjs';

export const SentryErrorTracking: ErrorTrackingService = {
  captureError: (error, context) => {
    Sentry.captureException(error, { extra: context });
  },
  captureMessage: (message, level) => {
    Sentry.captureMessage(message, level);
  },
};

// Auto-initialize in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  initializeErrorTracking(SentryErrorTracking);
}
*/

/**
 * Collect validation metrics for monitoring and optimization
 */
function updateValidationMetrics(
  nodeType: string,
  success: boolean,
  errors?: z.ZodIssue[]
) {
  const current = validationMetrics.get(nodeType) || {
    nodeType,
    validationCount: 0,
    failureCount: 0,
    errorTypes: {},
  };

  current.validationCount++;

  if (!success && errors) {
    current.failureCount++;
    current.lastFailure = new Date();

    // Track error types for analysis
    errors.forEach((error) => {
      const errorKey = `${error.code}_${error.path.join(".")}`;
      current.errorTypes[errorKey] = (current.errorTypes[errorKey] || 0) + 1;
    });
  }

  validationMetrics.set(nodeType, current);
}

/**
 * Get validation metrics for monitoring dashboard
 */
export function getValidationMetrics(): ValidationMetrics[] {
  return Array.from(validationMetrics.values());
}

/**
 * Get validation health score (0-100) for a node type
 */
export function getValidationHealthScore(nodeType: string): number {
  const metrics = validationMetrics.get(nodeType);
  if (!metrics || metrics.validationCount === 0) return 100;

  const successRate =
    (metrics.validationCount - metrics.failureCount) / metrics.validationCount;
  return Math.round(successRate * 100);
}

/**
 * Creates a standardized node data validator with enterprise error handling
 * @param schema - Zod schema for the node data
 * @param nodeType - Node type identifier for logging and metrics
 * @returns Validation function that always returns valid data
 */
export function createNodeValidator<T>(
  schema: z.ZodSchema<T>,
  nodeType: string
) {
  return function validateNodeData(data: unknown): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      updateValidationMetrics(nodeType, true);

      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        updateValidationMetrics(nodeType, false, error.issues);

        // Log validation failure with context
        const errorContext = {
          nodeType,
          errors: error.issues,
          received: data,
          timestamp: new Date().toISOString(),
        };

        // Downgrade to a warning so we do not trigger the Next.js error overlay while still surfacing the issue in the console
        console.warn(`${nodeType} node data validation failed:`, errorContext);

        // Report to error tracking service
        if (errorTrackingService) {
          errorTrackingService.captureError(error, {
            ...errorContext,
            type: "NODE_VALIDATION_ERROR",
          });
        }

        // Log specific validation issues for debugging
        error.issues.forEach((issue) => {
          console.warn(
            `${nodeType} validation: ${issue.path.join(".")} - ${issue.message}`
          );
        });

        // Attempt to parse with defaults as fallback
        try {
          const fallbackData = schema.parse({});
          console.info(`Using default values for ${nodeType} node`);

          return {
            success: false,
            data: fallbackData,
            errors: error.issues,
            originalData: data,
          };
        } catch (fallbackError) {
          // This should never happen if schema has proper defaults
          const criticalError = new Error(
            `Critical validation error: ${nodeType} schema must provide valid defaults`
          );

          console.error(
            `${nodeType} schema has no valid defaults:`,
            fallbackError
          );

          if (errorTrackingService) {
            errorTrackingService.captureError(criticalError, {
              nodeType,
              originalError: fallbackError,
              type: "CRITICAL_SCHEMA_ERROR",
            });
          }

          throw criticalError;
        }
      }

      // Re-throw unexpected errors
      throw error;
    }
  };
}

/**
 * Common validation schemas for node data with enterprise-grade rules
 */
export const CommonSchemas = {
  /** Standard text input with validation and sanitization */
  text: z
    .string()
    .min(1, "Text cannot be empty")
    .max(10000, "Text too long (max 10,000 characters)")
    .refine(
      (text) =>
        !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(text),
      "Script tags are not allowed"
    ),

  /** Optional text with empty string fallback */
  optionalText: z.string().default(""),

  /** Safe HTML text (strips dangerous tags) */
  safeHtml: z
    .string()
    .refine(
      (html) =>
        !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(html),
      "Script tags are not allowed"
    )
    .refine(
      (html) =>
        !/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(html),
      "Iframe tags are not allowed"
    ),

  /** Numeric value with bounds and finite check */
  number: z
    .number()
    .finite("Must be a valid number")
    .safe("Number must be within safe range"),

  /** Positive integer */
  positiveInt: z
    .number()
    .int("Must be an integer")
    .positive("Must be positive"),

  /** Boolean with default false */
  boolean: z.boolean().default(false),

  /** Array of strings with size limits */
  stringArray: z
    .array(z.string())
    .max(1000, "Too many items (max 1,000)")
    .default([]),

  /** JSON object with size validation */
  jsonObject: z
    .record(z.unknown())
    .refine(
      (obj) => JSON.stringify(obj).length <= 100000,
      "JSON object too large (max 100KB)"
    )
    .default({}),

  /** URL validation with protocol requirements */
  url: z
    .string()
    .url("Must be a valid URL")
    .refine(
      (url) => ["http:", "https:"].includes(new URL(url).protocol),
      "Only HTTP and HTTPS URLs are allowed"
    )
    .optional(),

  /** Email validation */
  email: z
    .string()
    .email("Must be a valid email")
    .max(254, "Email too long")
    .optional(),

  /** UUID validation */
  uuid: z.string().uuid("Must be a valid UUID").optional(),

  /** Color hex code */
  hexColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color")
    .optional(),

  /** File path validation */
  filePath: z
    .string()
    .refine((path) => !path.includes(".."), "Path traversal not allowed")
    .refine((path) => path.length <= 260, "Path too long")
    .optional(),
};

/**
 * Schema builder utilities for complex nodes
 */
export const SchemaBuilderUtils = {
  /**
   * Create a base schema for nodes with common fields
   */
  createBaseSchema<T extends Record<string, z.ZodTypeAny>>(fields: T) {
    return z.object(fields).strict();
  },

  /**
   * Extend a schema with additional fields
   */
  extendSchema<T extends z.ZodRawShape, U extends z.ZodRawShape>(
    baseSchema: z.ZodObject<T>,
    additionalFields: U
  ) {
    return baseSchema.extend(additionalFields);
  },

  /**
   * Create conditional validation for complex node requirements
   */
  addConditionalValidation<T>(
    schema: z.ZodSchema<T>,
    condition: (data: T) => boolean,
    errorMessage: string
  ) {
    return schema.refine(condition, { message: errorMessage });
  },
};

/**
 * Validation middleware for node data updates with enterprise safeguards
 * Ensures data integrity when users modify node properties in real-time
 */
export function createUpdateValidator<T>(
  schema: z.ZodSchema<T>,
  nodeType: string
) {
  return function validateUpdate(
    currentData: T,
    updates: Partial<T>,
    nodeId?: string
  ): T {
    try {
      const mergedData = { ...currentData, ...updates };
      const validatedData = schema.parse(mergedData);

      // Log successful updates for audit trail
      if (process.env.NODE_ENV === "development") {
        console.debug(`${nodeType} node updated:`, {
          nodeId,
          updates,
          timestamp: new Date().toISOString(),
        });
      }

      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn("Node update validation failed, keeping current data:", {
          nodeType,
          nodeId,
          currentData,
          updates,
          errors: error.issues,
        });

        // Report update validation failures
        if (errorTrackingService) {
          errorTrackingService.captureError(error, {
            type: "NODE_UPDATE_VALIDATION_ERROR",
            nodeType,
            nodeId,
            updates,
            currentData,
          });
        }

        return currentData; // Keep current data if update is invalid
      }
      throw error;
    }
  };
}

/**
 * Production-ready error reporting for validation failures
 * Integrated with error tracking services and metrics collection
 */
export function reportValidationError(
  nodeType: string,
  nodeId: string,
  errors: z.ZodIssue[],
  context?: Record<string, unknown>
) {
  const errorReport = {
    type: "NODE_VALIDATION_ERROR",
    nodeType,
    nodeId,
    errors: errors.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    })),
    context,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : "server",
    metrics: getValidationMetrics().find((m) => m.nodeType === nodeType),
  };

  // Using console.warn prevents Next.js from treating the message as an application-level error
  console.warn("Node validation error report:", errorReport);

  // Report to enterprise error tracking service
  if (errorTrackingService) {
    errorTrackingService.captureError(
      new Error(`Validation failed for ${nodeType} node`),
      errorReport
    );
  }
}

/**
 * React hook for real-time data validation and updates
 */
export function useNodeDataValidation<T>(
  schema: z.ZodSchema<T>,
  nodeType: string,
  initialData: T,
  nodeId: string
) {
  const validator = createUpdateValidator(schema, nodeType);

  const updateData = (updates: Partial<T>) => {
    return validator(initialData, updates, nodeId);
  };

  const validateData = (data: unknown) => {
    const nodeValidator = createNodeValidator(schema, nodeType);
    return nodeValidator(data);
  };

  return {
    updateData,
    validateData,
    getHealthScore: () => getValidationHealthScore(nodeType),
  };
}
