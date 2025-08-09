/**
 * StoreLocal NODE – SECURE localStorage management with store/delete/get modes
 *
 * • Provides visual interface for storing and deleting data in browser localStorage
 * • Supports complex objects with proper serialization and type safety
 * • ONLY executes when triggered by boolean input (no auto-execution)
 * • Features pulse-triggered operations and mode switching (Store/Delete/Get)
 * • Includes comprehensive error handling and visual feedback
 * • Uses findEdgeByHandle utility for robust React Flow edge handling
 * • Code follows current React + TypeScript best practices with full Zod validation
 * • SECURITY: Protected keys blacklist, input sanitization, rate limiting, audit logging
 * • ABUSE PROTECTION: Size limits, key validation, data expiration, security warnings
 *
 * Keywords: localStorage, store-delete-get-modes, boolean-trigger-only, type-safe, security-hardened
 */

import type { NodeProps } from "@xyflow/react";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { Loading } from "@/components/Loading";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { Button } from "@/components/ui/button";
import { CounterBoxContainer } from "@/components/ui/counter-box";

import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";

import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import { useDesignSystemToken } from "@/features/business-logic-modern/infrastructure/theming/components/componentThemeStore";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useNodeToast } from "@/hooks/useNodeToast";
import { useStore } from "@xyflow/react";

// -----------------------------------------------------------------------------
// 1️⃣  TOP-LEVEL CONSTANTS & STYLING
// -----------------------------------------------------------------------------

// Design system constants for better maintainability - Unified styling for all modes
const MODE_CONFIG = {
  STORE: {
    label: "Store",
    variant: "primary" as const,
    shadcnVariant: "default" as const,
    colors: {
      // Button styling
      button:
        "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700",
      modeLabel: "text-blue-100",
      // Grid styling
      container: "bg-blue-50 dark:bg-blue-900/10",
      title: "text-blue-700 dark:text-blue-300",
      tableBorder: "border-blue-200 dark:border-blue-700",
      tableHeader:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
      headerText: "text-blue-700 dark:text-blue-300",
      keyText: "text-blue-700 dark:text-blue-300",
      valueText: "text-blue-700 dark:text-blue-300",
      rowBorder: "border-blue-200 dark:border-blue-700",
      // Counter styling
      counterContainer: "text-blue-700 dark:text-blue-300 font-semibold",
      counterBg: "bg-blue-200 dark:bg-blue-900/30",
      counterLabel: "text-blue-600 dark:text-blue-200 font-medium",
    },
  },
  DELETE: {
    label: "Delete",
    variant: "secondary" as const,
    shadcnVariant: "destructive" as const,
    colors: {
      // Button styling
      button:
        "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700",
      modeLabel: "text-red-100",
      // Grid styling
      container: "bg-red-50 dark:bg-red-900/10",
      title: "text-red-700 dark:text-red-300",
      tableBorder: "border-red-200 dark:border-red-700",
      tableHeader:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
      headerText: "text-red-700 dark:text-red-300",
      keyText: "text-red-700 dark:text-red-300",
      valueText: "text-red-700 dark:text-red-300",
      rowBorder: "border-red-200 dark:border-red-700",
      // Counter styling
      counterContainer: "text-red-700 dark:text-red-300 font-semibold",
      counterBg: "bg-red-200 dark:bg-red-900/30",
      counterLabel: "text-red-600 dark:text-red-200 font-medium",
    },
  },
  GET: {
    label: "Get",
    variant: "secondary" as const,
    shadcnVariant: "secondary" as const,
    colors: {
      // Button styling
      button:
        "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700",
      modeLabel: "text-green-100",
      // Grid styling
      container: "bg-green-50 dark:bg-green-900/10",
      title: "text-green-700 dark:text-green-300",
      tableBorder: "border-green-200 dark:border-green-700",
      tableHeader:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
      headerText: "text-green-700 dark:text-green-300",
      keyText: "text-green-700 dark:text-green-300",
      valueText: "text-green-700 dark:text-green-300",
      rowBorder: "border-green-200 dark:border-green-700",
      // Counter styling
      counterContainer: "text-green-700 dark:text-green-300 font-semibold",
      counterBg: "bg-green-200 dark:bg-green-900/30",
      counterLabel: "text-green-600 dark:text-green-200 font-medium",
    },
  },
} as const;

const STATUS_CONFIG = {
  PROCESSING: {
    icon: "⏳",
    color: "text-yellow-600",
    text: "Processing...",
  },
  NONE: {
    icon: "⚪",
    color: "text-gray-500",
    text: "Ready",
  },
  SUCCESS: {
    icon: "✅",
    color: "text-green-600",
  },
  ERROR: {
    icon: "❌",
    color: "text-red-600",
  },
} as const;

const UI_CONSTANTS = {
  MAX_PREVIEW_ITEMS: 5,
  DISABLED_OPACITY: "opacity-50",
  DISABLED_CURSOR: "cursor-not-allowed",
} as const;

const CONTENT_CLASSES = {
  expanded: "w-full h-full flex flex-col overflow-hidden",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center overflow-y-auto",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 🔒 SECURITY CONFIGURATION
// -----------------------------------------------------------------------------

// Protected keys that cannot be accessed, basically sensitive authentication data
const PROTECTED_KEYS = [
  "agenitix_auth_token",
  "session_token",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "password",
  "jwt",
  "bearer",
  "auth",
  "clerk",
  "supabase",
  "firebase",
  "__session",
] as const;

// Security limits to prevent abuse
const SECURITY_LIMITS = {
  MAX_KEY_LENGTH: 256,
  MAX_VALUE_SIZE: 1024 * 100, // 100KB per value
  MAX_TOTAL_KEYS: 50, // Maximum keys per operation
  MAX_OPERATIONS_PER_MINUTE: 30,
  KEY_EXPIRY_HOURS: 24, // Auto-expire data after 24 hours
} as const;

// XSS and injection patterns to block, basically malicious script patterns
const MALICIOUS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /function\s*\(/i,
  /\${.*}/,
  /<%.*%>/,
  /{{.*}}/,
] as const;

// Rate limiting storage per node instance
const nodeRateLimits = new Map<string, { count: number; resetTime: number }>();

// Audit log for security monitoring
interface SecurityAuditEntry {
  timestamp: number;
  nodeId: string;
  operation: "store" | "delete" | "get";
  keys: string[];
  success: boolean;
  securityIssue?: string;
  blockedReason?: string;
}

const securityAuditLog: SecurityAuditEntry[] = [];

// Security validation functions
const SecurityValidation = {
  isProtectedKey: (key: string): boolean => {
    const keyLower = key.toLowerCase();
    return PROTECTED_KEYS.some((protectedKey) =>
      keyLower.includes(protectedKey.toLowerCase())
    );
  },

  containsMaliciousPattern: (value: string): boolean => {
    if (typeof value !== "string") return false;
    return MALICIOUS_PATTERNS.some((pattern) => pattern.test(value));
  },

  validateKeyFormat: (key: string): { valid: boolean; reason?: string } => {
    if (!key || typeof key !== "string") {
      return { valid: false, reason: "Key must be a non-empty string" };
    }
    if (key.length > SECURITY_LIMITS.MAX_KEY_LENGTH) {
      return {
        valid: false,
        reason: `Key length exceeds ${SECURITY_LIMITS.MAX_KEY_LENGTH} characters`,
      };
    }
    if (key.trim() !== key) {
      return {
        valid: false,
        reason: "Key cannot have leading/trailing whitespace",
      };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      return {
        valid: false,
        reason:
          "Key contains invalid characters (only alphanumeric, underscore, dot, dash allowed)",
      };
    }
    return { valid: true };
  },

  validateValueSize: (value: unknown): { valid: boolean; reason?: string } => {
    const serialized = JSON.stringify(value);
    if (serialized.length > SECURITY_LIMITS.MAX_VALUE_SIZE) {
      return {
        valid: false,
        reason: `Value size exceeds ${SECURITY_LIMITS.MAX_VALUE_SIZE} bytes`,
      };
    }
    return { valid: true };
  },

  checkRateLimit: (nodeId: string): { allowed: boolean; reason?: string } => {
    const now = Date.now();
    const resetTime = now + 60000; // 1 minute

    const current = nodeRateLimits.get(nodeId);
    if (!current || now > current.resetTime) {
      nodeRateLimits.set(nodeId, { count: 1, resetTime });
      return { allowed: true };
    }

    if (current.count >= SECURITY_LIMITS.MAX_OPERATIONS_PER_MINUTE) {
      return {
        allowed: false,
        reason: `Rate limit exceeded (${SECURITY_LIMITS.MAX_OPERATIONS_PER_MINUTE}/min)`,
      };
    }

    current.count++;
    return { allowed: true };
  },

  addToAuditLog: (entry: SecurityAuditEntry): void => {
    securityAuditLog.push(entry);
    // Keep only last 1000 entries to prevent memory bloat
    if (securityAuditLog.length > 1000) {
      securityAuditLog.splice(0, securityAuditLog.length - 1000);
    }

    // Log security issues to console for monitoring
    if (entry.securityIssue || entry.blockedReason) {
      console.warn("🔒 LocalStorage Security Alert:", {
        nodeId: entry.nodeId,
        operation: entry.operation,
        keys: entry.keys,
        issue: entry.securityIssue || entry.blockedReason,
        timestamp: new Date(entry.timestamp).toISOString(),
      });
    }
  },

  // Add expiry metadata to stored values
  addExpiryMetadata: (
    value: unknown
  ): { data: unknown; __agenitix_expiry: number } => {
    return {
      data: value,
      __agenitix_expiry:
        Date.now() + SECURITY_LIMITS.KEY_EXPIRY_HOURS * 60 * 60 * 1000,
    };
  },

  // Check if stored value has expired
  isExpired: (storedValue: unknown): boolean => {
    if (
      typeof storedValue === "object" &&
      storedValue !== null &&
      "__agenitix_expiry" in storedValue
    ) {
      const expiry = (storedValue as any).__agenitix_expiry;
      return typeof expiry === "number" && Date.now() > expiry;
    }
    return false;
  },

  // Extract data from stored value, removing expiry metadata
  extractData: (storedValue: unknown): unknown => {
    if (
      typeof storedValue === "object" &&
      storedValue !== null &&
      "data" in storedValue &&
      "__agenitix_expiry" in storedValue
    ) {
      return (storedValue as any).data;
    }
    return storedValue;
  },
};

// Security warning types
type SecurityWarningType =
  | "protected_key"
  | "malicious_content"
  | "rate_limit"
  | "size_limit"
  | "expired_data";

interface SecurityWarning {
  type: SecurityWarningType;
  message: string;
  keys?: string[];
  suggestion?: string;
}

// Global security utilities for monitoring and emergency cleanup
const SecurityUtils = {
  // Get recent security audit log (last 50 entries)
  getRecentAuditLog: (): SecurityAuditEntry[] => {
    return securityAuditLog.slice(-50).reverse();
  },

  // Emergency cleanup - removes all localStorage data for this node except protected keys
  emergencyCleanup: (
    nodeId: string
  ): { removed: number; protectedKeys: string[] } => {
    const keys = Object.keys(localStorage);
    let removed = 0;
    const protectedKeys: string[] = [];

    keys.forEach((key) => {
      if (SecurityValidation.isProtectedKey(key)) {
        protectedKeys.push(key);
      } else {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Only remove items stored by this system (have metadata)
            if (
              typeof parsed === "object" &&
              parsed !== null &&
              "__agenitix_expiry" in parsed
            ) {
              localStorage.removeItem(key);
              removed++;
            }
          }
        } catch {
          // Skip non-JSON values
        }
      }
    });

    SecurityValidation.addToAuditLog({
      timestamp: Date.now(),
      nodeId,
      operation: "store", // Using store as emergency cleanup type
      keys: [`EMERGENCY_CLEANUP_${removed}_items`],
      success: true,
      securityIssue: "Emergency cleanup performed",
    });

    return { removed, protectedKeys };
  },

  // Get security status summary
  getSecurityStatus: (): {
    totalAuditEntries: number;
    recentSecurityIssues: number;
    protectedKeysInStorage: number;
    rateLimitedNodes: number;
  } => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentSecurityIssues = securityAuditLog.filter(
      (entry) =>
        entry.timestamp > oneHourAgo &&
        (entry.securityIssue || entry.blockedReason)
    ).length;

    const protectedKeysInStorage = Object.keys(localStorage).filter((key) =>
      SecurityValidation.isProtectedKey(key)
    ).length;

    const rateLimitedNodes = Array.from(nodeRateLimits.entries()).filter(
      ([, limit]) =>
        now < limit.resetTime &&
        limit.count >= SECURITY_LIMITS.MAX_OPERATIONS_PER_MINUTE
    ).length;

    return {
      totalAuditEntries: securityAuditLog.length,
      recentSecurityIssues,
      protectedKeysInStorage,
      rateLimitedNodes,
    };
  },
};

// Make security utilities available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).AgenitixSecurityUtils = SecurityUtils;
  console.log("🔒 Security utils available at window.AgenitixSecurityUtils");
}

// -----------------------------------------------------------------------------
// 2️⃣  Enhanced data schema & validation
// -----------------------------------------------------------------------------

export const StoreLocalDataSchema = z
  .object({
    // Core functionality
    mode: z.enum(["store", "delete", "get"]).default("store"),
    inputData: z.record(z.unknown()).nullable().default(null),
    triggerInput: z.boolean().default(false),
    lastTriggerState: z.boolean().default(false),

    // Internal store for retrieved data (formatted JSON string for inspector)
    store: z.string().default(""),

    // Status and feedback
    isProcessing: z.boolean().default(false),
    lastOperation: z.enum(["none", "store", "delete", "get"]).default("none"),
    lastOperationSuccess: z.boolean().default(false),
    lastOperationTime: z.number().optional(),
    operationMessage: z.string().default(""),

    // UI state (existing)
    isEnabled: SafeSchemas.boolean(true),
    isActive: SafeSchemas.boolean(false),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("FV2"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),

    // output
    output: z.record(z.unknown()).nullable().default(null),
  })
  .passthrough();

export type StoreLocalData = z.infer<typeof StoreLocalDataSchema>;

const validateNodeData = createNodeValidator(
  StoreLocalDataSchema,
  "StoreLocal"
);

// -----------------------------------------------------------------------------
// 2️⃣  LocalStorage Operations Utility
// -----------------------------------------------------------------------------

interface LocalStorageOperationResult {
  success: boolean;
  message: string;
  keysProcessed: string[];
  errors: Array<{ key: string; error: string }>;
}

interface LocalStorageDeleteResult {
  success: boolean;
  message: string;
  keysDeleted: string[];
  keysNotFound: string[];
  warnings: SecurityWarning[];
}

interface LocalStorageGetResult {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
  keysFound: string[];
  keysNotFound: string[];
  warnings: SecurityWarning[];
  expiredKeys: string[];
}

const createLocalStorageOperations = (nodeId: string) => {
  const isAvailable = (): boolean => {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, "test");
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };

  // Security-enhanced store operation with comprehensive validation
  const store = (
    data: Record<string, unknown>
  ): LocalStorageOperationResult & { warnings: SecurityWarning[] } => {
    const result: LocalStorageOperationResult & {
      warnings: SecurityWarning[];
    } = {
      success: true,
      message: "",
      keysProcessed: [],
      errors: [],
      warnings: [],
    };

    // Rate limiting check
    const rateLimitCheck = SecurityValidation.checkRateLimit(nodeId);
    if (!rateLimitCheck.allowed) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "store",
        keys: Object.keys(data),
        success: false,
        blockedReason: rateLimitCheck.reason,
      });
      result.success = false;
      result.message = rateLimitCheck.reason || "Rate limit exceeded";
      return result;
    }

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!data || Object.keys(data).length === 0) {
      result.success = false;
      result.message = "No data provided to store";
      return result;
    }

    // Check maximum keys limit
    const keys = Object.keys(data);
    if (keys.length > SECURITY_LIMITS.MAX_TOTAL_KEYS) {
      result.success = false;
      result.message = `Too many keys (${keys.length}). Maximum allowed: ${SECURITY_LIMITS.MAX_TOTAL_KEYS}`;
      return result;
    }

    for (const [key, value] of Object.entries(data)) {
      try {
        // Security validation for each key-value pair

        // 1. Check if key is protected
        if (SecurityValidation.isProtectedKey(key)) {
          const warning: SecurityWarning = {
            type: "protected_key",
            message: `Blocked access to protected key: ${key}`,
            keys: [key],
            suggestion:
              "Use non-sensitive key names for localStorage operations",
          };
          result.warnings.push(warning);
          result.errors.push({
            key,
            error: "Access to protected/sensitive keys is forbidden",
          });
          SecurityValidation.addToAuditLog({
            timestamp: Date.now(),
            nodeId,
            operation: "store",
            keys: [key],
            success: false,
            securityIssue: "Protected key access attempt",
          });
          continue;
        }

        // 2. Validate key format
        const keyValidation = SecurityValidation.validateKeyFormat(key);
        if (!keyValidation.valid) {
          result.errors.push({
            key,
            error: keyValidation.reason || "Invalid key format",
          });
          continue;
        }

        // 3. Check for malicious content in value
        const valueStr =
          typeof value === "string" ? value : JSON.stringify(value);
        if (SecurityValidation.containsMaliciousPattern(valueStr)) {
          const warning: SecurityWarning = {
            type: "malicious_content",
            message: `Blocked potentially malicious content in value for key: ${key}`,
            keys: [key],
            suggestion:
              "Remove script tags, JavaScript protocols, or template literals from your data",
          };
          result.warnings.push(warning);
          result.errors.push({
            key,
            error: "Value contains potentially malicious content",
          });
          SecurityValidation.addToAuditLog({
            timestamp: Date.now(),
            nodeId,
            operation: "store",
            keys: [key],
            success: false,
            securityIssue: "Malicious content detected",
          });
          continue;
        }

        // 4. Validate value size
        const sizeValidation = SecurityValidation.validateValueSize(value);
        if (!sizeValidation.valid) {
          const warning: SecurityWarning = {
            type: "size_limit",
            message: `Value too large for key: ${key}`,
            keys: [key],
            suggestion: `Reduce data size to under ${SECURITY_LIMITS.MAX_VALUE_SIZE} bytes`,
          };
          result.warnings.push(warning);
          result.errors.push({
            key,
            error: sizeValidation.reason || "Value too large",
          });
          continue;
        }

        // 5. Serialize with security enhancements
        let serializedValue: string;

        if (typeof value === "string") {
          serializedValue = JSON.stringify(value);
        } else if (typeof value === "number" || typeof value === "boolean") {
          serializedValue = String(value);
        } else if (value === null || value === undefined) {
          serializedValue = String(value);
        } else {
          serializedValue = JSON.stringify(value);
        }

        // 6. Add expiry metadata and store
        const valueWithMetadata = SecurityValidation.addExpiryMetadata({
          originalValue: value,
          storedAt: Date.now(),
          nodeId,
        });

        localStorage.setItem(key, JSON.stringify(valueWithMetadata));
        result.keysProcessed.push(key);
      } catch (error) {
        result.errors.push({
          key,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.success = false;
      }
    }

    // Update success status based on results
    result.success = result.errors.length === 0;

    // Generate comprehensive result message
    let message = result.success
      ? `Successfully stored ${result.keysProcessed.length} items`
      : `Stored ${result.keysProcessed.length} items with ${result.errors.length} errors`;

    if (result.warnings.length > 0) {
      message += `. Security warnings: ${result.warnings.length}`;
    }

    result.message = message;

    // Log successful operations
    if (result.keysProcessed.length > 0) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "store",
        keys: result.keysProcessed,
        success: result.success,
      });
    }

    return result;
  };

  // Security-enhanced delete operation with protected key validation
  const deleteKeys = (keys: string[]): LocalStorageDeleteResult => {
    const result: LocalStorageDeleteResult = {
      success: true,
      message: "",
      keysDeleted: [],
      keysNotFound: [],
      warnings: [],
    };

    // Rate limiting check
    const rateLimitCheck = SecurityValidation.checkRateLimit(nodeId);
    if (!rateLimitCheck.allowed) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "delete",
        keys,
        success: false,
        blockedReason: rateLimitCheck.reason,
      });
      result.success = false;
      result.message = rateLimitCheck.reason || "Rate limit exceeded";
      return result;
    }

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!keys || keys.length === 0) {
      result.success = false;
      result.message = "No keys provided to delete";
      return result;
    }

    // Check maximum keys limit
    if (keys.length > SECURITY_LIMITS.MAX_TOTAL_KEYS) {
      result.success = false;
      result.message = `Too many keys (${keys.length}). Maximum allowed: ${SECURITY_LIMITS.MAX_TOTAL_KEYS}`;
      return result;
    }

    for (const key of keys) {
      try {
        // Security validation for each key

        // 1. Check if key is protected
        if (SecurityValidation.isProtectedKey(key)) {
          const warning: SecurityWarning = {
            type: "protected_key",
            message: `Blocked deletion of protected key: ${key}`,
            keys: [key],
            suggestion: "Protected keys cannot be deleted for security reasons",
          };
          result.warnings.push(warning);
          SecurityValidation.addToAuditLog({
            timestamp: Date.now(),
            nodeId,
            operation: "delete",
            keys: [key],
            success: false,
            securityIssue: "Protected key deletion attempt",
          });
          continue;
        }

        // 2. Validate key format
        const keyValidation = SecurityValidation.validateKeyFormat(key);
        if (!keyValidation.valid) {
          result.keysNotFound.push(key); // Treat invalid keys as not found
          continue;
        }

        // 3. Attempt deletion
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          result.keysDeleted.push(key);
        } else {
          result.keysNotFound.push(key);
        }
      } catch (error) {
        result.success = false;
        result.message = `Error deleting key "${key}": ${error}`;
        break;
      }
    }

    if (result.success) {
      result.message = `Deleted ${result.keysDeleted.length} items`;
      if (result.keysNotFound.length > 0) {
        result.message += `, ${result.keysNotFound.length} keys not found`;
      }
      if (result.warnings.length > 0) {
        result.message += `. Security warnings: ${result.warnings.length}`;
      }
    }

    // Log successful operations
    if (result.keysDeleted.length > 0) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "delete",
        keys: result.keysDeleted,
        success: result.success,
      });
    }

    return result;
  };

  // Security-enhanced get operation with expiry checks and validation
  const getKeys = (keys: string[]): LocalStorageGetResult => {
    const result: LocalStorageGetResult = {
      success: true,
      message: "",
      data: {},
      keysFound: [],
      keysNotFound: [],
      warnings: [],
      expiredKeys: [],
    };

    // Rate limiting check
    const rateLimitCheck = SecurityValidation.checkRateLimit(nodeId);
    if (!rateLimitCheck.allowed) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "get",
        keys,
        success: false,
        blockedReason: rateLimitCheck.reason,
      });
      result.success = false;
      result.message = rateLimitCheck.reason || "Rate limit exceeded";
      return result;
    }

    if (!isAvailable()) {
      result.success = false;
      result.message = "localStorage is not available";
      return result;
    }

    if (!keys || keys.length === 0) {
      result.success = false;
      result.message = "No keys provided to get";
      return result;
    }

    // Check maximum keys limit
    if (keys.length > SECURITY_LIMITS.MAX_TOTAL_KEYS) {
      result.success = false;
      result.message = `Too many keys (${keys.length}). Maximum allowed: ${SECURITY_LIMITS.MAX_TOTAL_KEYS}`;
      return result;
    }

    for (const key of keys) {
      try {
        // Security validation for each key

        // 1. Check if key is protected
        if (SecurityValidation.isProtectedKey(key)) {
          const warning: SecurityWarning = {
            type: "protected_key",
            message: `Blocked access to protected key: ${key}`,
            keys: [key],
            suggestion:
              "Protected keys cannot be accessed for security reasons",
          };
          result.warnings.push(warning);
          SecurityValidation.addToAuditLog({
            timestamp: Date.now(),
            nodeId,
            operation: "get",
            keys: [key],
            success: false,
            securityIssue: "Protected key access attempt",
          });
          continue;
        }

        // 2. Validate key format
        const keyValidation = SecurityValidation.validateKeyFormat(key);
        if (!keyValidation.valid) {
          result.keysNotFound.push(key); // Treat invalid keys as not found
          continue;
        }

        // 3. Attempt retrieval
        const value = localStorage.getItem(key);
        if (value !== null) {
          // Try to parse the stored value
          try {
            // First try to parse as JSON
            const parsedValue = JSON.parse(value);

            // Check if data has expired
            if (SecurityValidation.isExpired(parsedValue)) {
              const warning: SecurityWarning = {
                type: "expired_data",
                message: `Data for key '${key}' has expired`,
                keys: [key],
                suggestion:
                  "Data is automatically removed after 24 hours for security",
              };
              result.warnings.push(warning);
              result.expiredKeys.push(key);

              // Auto-cleanup expired data
              localStorage.removeItem(key);
              result.keysNotFound.push(key);
              continue;
            }

            // Extract actual data from metadata wrapper
            const extractedData = SecurityValidation.extractData(parsedValue);
            result.data[key] = extractedData;
          } catch {
            // If JSON parsing fails, store as string (legacy data)
            result.data[key] = value;
          }
          result.keysFound.push(key);
        } else {
          result.keysNotFound.push(key);
        }
      } catch (error) {
        result.success = false;
        result.message = `Error getting key "${key}": ${error}`;
        break;
      }
    }

    if (result.success) {
      result.message = `Retrieved ${result.keysFound.length} items`;
      if (result.keysNotFound.length > 0) {
        result.message += `, ${result.keysNotFound.length} keys not found`;
      }
      if (result.expiredKeys.length > 0) {
        result.message += `, ${result.expiredKeys.length} expired and removed`;
      }
      if (result.warnings.length > 0) {
        result.message += `. Security warnings: ${result.warnings.length}`;
      }
    }

    // Log successful operations
    if (result.keysFound.length > 0) {
      SecurityValidation.addToAuditLog({
        timestamp: Date.now(),
        nodeId,
        operation: "get",
        keys: result.keysFound,
        success: result.success,
      });
    }

    return result;
  };

  return {
    store,
    delete: deleteKeys,
    get: getKeys,
    isAvailable,
  };
};

// -----------------------------------------------------------------------------
// 2️⃣  UI Components
// -----------------------------------------------------------------------------

interface ModeSelectorProps {
  mode: "store" | "delete" | "get";
  onModeChange: (mode: "store" | "delete" | "get") => void;
  disabled?: boolean;
  isProcessing?: boolean;
  className?: string;
  isCollapsed?: boolean;
}

interface CollapsedCounterProps {
  mode: "store" | "delete" | "get";
  inputData: Record<string, unknown> | null;
}

const CollapsedCounter: React.FC<CollapsedCounterProps> = ({
  mode,
  inputData,
}) => {
  const getCountInfo = () => {
    if (!inputData || Object.keys(inputData).length === 0) {
      return { keyCount: 0, valueCount: 0, showValue: true };
    }

    const keyCount = Object.keys(inputData).length;

    switch (mode) {
      case "store":
        return {
          keyCount,
          valueCount: keyCount,
          showValue: true,
        };
      case "delete": {
        // For delete mode, count existing keys in localStorage
        let existingKeyCount = 0;
        try {
          for (const key of Object.keys(inputData)) {
            if (localStorage.getItem(key) !== null) {
              existingKeyCount++;
            }
          }
        } catch {
          existingKeyCount = 0;
        }
        return {
          keyCount: existingKeyCount,
          valueCount: existingKeyCount,
          showValue: true,
        };
      }
      case "get": {
        // For get mode, count both keys and values that exist in localStorage
        let existingCount = 0;
        try {
          for (const key of Object.keys(inputData)) {
            const value = localStorage.getItem(key);
            if (value !== null) {
              existingCount++;
            }
          }
        } catch {
          existingCount = 0;
        }
        return {
          keyCount: existingCount,
          valueCount: existingCount,
          showValue: true,
        };
      }
      default:
        return { keyCount: 0, valueCount: 0, showValue: false };
    }
  };

  const { keyCount, valueCount, showValue } = getCountInfo();

  // Always show the counter, even when values are 0

  const getModeConfig = () => {
    switch (mode) {
      case "store":
        return MODE_CONFIG.STORE;
      case "delete":
        return MODE_CONFIG.DELETE;
      case "get":
        return MODE_CONFIG.GET;
      default:
        return MODE_CONFIG.STORE;
    }
  };

  const config = getModeConfig();

  return (
    <div className={`text-xs font-mono ${config.colors.counterContainer}`}>
      <div className="grid grid-cols-2 gap-1 text-center">
        <div className={`${config.colors.counterBg} rounded px-1 py-0.5`}>
          <div className={`text-[10px] ${config.colors.counterLabel}`}>Key</div>
          <div className="font-semibold">{keyCount}</div>
        </div>
        {showValue && (
          <div className={`${config.colors.counterBg} rounded px-1 py-0.5`}>
            <div className={`text-[10px] ${config.colors.counterLabel}`}>
              Value
            </div>
            <div className="font-semibold">{valueCount}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false,
  isProcessing = false,
  className,
  isCollapsed = false,
}) => {
  // Define the modes in order
  const modes: Array<"store" | "delete" | "get"> = ["store", "delete", "get"];
  const currentIndex = modes.indexOf(mode);

  // Handle mode cycling with up/down arrows
  const handleModeChange = useCallback(
    (direction: "up" | "down") => {
      if (disabled || isProcessing) return;

      let newIndex: number;
      if (direction === "up") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : modes.length - 1;
      } else {
        newIndex = currentIndex < modes.length - 1 ? currentIndex + 1 : 0;
      }

      const newMode = modes[newIndex];
      if (newMode) {
        onModeChange(newMode);
      }
    },
    [currentIndex, modes, disabled, isProcessing, onModeChange]
  );

  // Show loading spinner when processing
  if (isProcessing) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
      >
        <Loading showText={false} size="w-5 h-5" className="p-0" />
      </div>
    );
  }

  const config = MODE_CONFIG[mode.toUpperCase() as keyof typeof MODE_CONFIG];

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Mode Card with overlapping arrows */}
      <div className="relative w-full">
        <Button
          onClick={() => handleModeChange("down")}
          disabled={disabled}
          variant={config.shadcnVariant}
          size="sm"
          className={`
            relative w-full h-full justify-center rounded-lg py-2 px-8
            border border-border/20 shadow-sm hover:shadow-md
            transition-all duration-200 ease-in-out
            ${config.colors.button}
            hover:scale-[1.02] active:scale-[0.98]
            focus:ring-2 focus:ring-offset-1 focus:ring-primary/30
            ${disabled ? `${UI_CONSTANTS.DISABLED_OPACITY} ${UI_CONSTANTS.DISABLED_CURSOR}` : ""}
          `}
        >
          {/* Mode Label */}
          <span
            className={`absolute text-[7px] top-1 left-2 font-mono font-medium tracking-wider ${config.colors.modeLabel} opacity-80`}
          >
            MODE
          </span>

          {/* Main Mode Text */}
          <span className="text-sm font-semibold tracking-wide">
            {config.label}
          </span>

          {/* Mode indicator dots */}
          <div className="absolute bottom-1 right-2 flex gap-0.5">
            {modes.map((_, index) => (
              <div
                key={index}
                className={`
                  w-1 h-1 rounded-full transition-all duration-200
                  ${
                    index === currentIndex
                      ? "bg-current opacity-60"
                      : "bg-current opacity-20"
                  }
                `}
              />
            ))}
          </div>
        </Button>

        {/* Left Arrow - Overlapping */}
        <Button
          onClick={() => handleModeChange("up")}
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            w-6 h-6 p-0 border-0 bg-transparent hover:bg-transparent
            transition-all duration-150 ease-in-out
            hover:scale-110 active:scale-95
            ${disabled ? `${UI_CONSTANTS.DISABLED_OPACITY} ${UI_CONSTANTS.DISABLED_CURSOR}` : ""}
          `}
        >
          <svg
            className="w-3 h-3 text-foreground/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="sr-only">Previous mode</span>
        </Button>

        {/* Right Arrow - Overlapping */}
        <Button
          onClick={() => handleModeChange("down")}
          disabled={disabled}
          variant="ghost"
          size="sm"
          className={`
            absolute right-0 top-1/2 -translate-y-1/2 z-10
            w-6 h-6 p-0 border-0 bg-transparent hover:bg-transparent
            transition-all duration-150 ease-in-out
            hover:scale-110 active:scale-95
            ${disabled ? `${UI_CONSTANTS.DISABLED_OPACITY} ${UI_CONSTANTS.DISABLED_CURSOR}` : ""}
          `}
        >
          <svg
            className="w-3 h-3 text-foreground/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="sr-only">Next mode</span>
        </Button>
      </div>
    </div>
  );
};

interface DataPreviewProps {
  data: Record<string, unknown> | null;
  mode: "store" | "delete" | "get";
  maxItems?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  mode,
  maxItems = UI_CONSTANTS.MAX_PREVIEW_ITEMS,
}) => {
  // Helper function to get current localStorage value
  const getCurrentLocalStorageValue = (key: string): string => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return "null";

      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "object"
          ? JSON.stringify(parsed).slice(0, 30) + "..."
          : String(parsed);
      } catch {
        // If not JSON, return as string
        return value.length > 30 ? value.slice(0, 30) + "..." : value;
      }
    } catch {
      return "error";
    }
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">No data to {mode}</div>
    );
  }

  // Filter out protected keys and mask sensitive data for display
  const filteredData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (SecurityValidation.isProtectedKey(key)) {
        // Mask protected keys in the UI
        return [`🔒 ${key.slice(0, 8)}***`, "*** PROTECTED ***"];
      }
      return [key, value];
    })
  );

  const entries =
    maxItems === Number.POSITIVE_INFINITY
      ? Object.entries(filteredData)
      : Object.entries(filteredData).slice(0, maxItems);
  const hasMore =
    maxItems !== Number.POSITIVE_INFINITY &&
    Object.keys(filteredData).length > maxItems;

  // Count protected keys for security warning
  const protectedKeysCount = Object.keys(data).filter((key) =>
    SecurityValidation.isProtectedKey(key)
  ).length;

  const getPreviewTitle = () => {
    switch (mode) {
      case "store":
        return "Will store";
      case "delete":
        return "Will delete";
      case "get":
        return "Output values";
      default:
        return "Data";
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case "store":
        return MODE_CONFIG.STORE;
      case "delete":
        return MODE_CONFIG.DELETE;
      case "get":
        return MODE_CONFIG.GET;
      default:
        return MODE_CONFIG.STORE;
    }
  };

  const config = getModeConfig();

  return (
    <div className={`text-xs space-y-2 w-full ${config.colors.container}`}>
      {/* Table-like grid layout - full width */}
      <div
        className={`border rounded-md overflow-hidden w-full ${config.colors.tableBorder}`}
      >
        {/* Header row */}
        <div
          className={`grid grid-cols-2 border-b w-full ${config.colors.tableHeader}`}
        >
          <div
            className={`px-2 py-1 font-semibold border-r ${config.colors.headerText} ${config.colors.rowBorder} min-w-0`}
          >
            Key
          </div>
          <div
            className={`px-2 py-1 font-semibold ${config.colors.headerText} min-w-0`}
          >
            Value
          </div>
        </div>

        {/* Data rows */}
        {entries.map(([key, value], index) => (
          <div
            key={key}
            className={`grid grid-cols-2 w-full ${
              index !== entries.length - 1
                ? `border-b ${config.colors.rowBorder}`
                : ""
            }`}
          >
            <div
              className={`px-2 py-1 font-mono border-r text-[8px] truncate font-semibold ${config.colors.keyText} ${config.colors.rowBorder} min-w-0`}
            >
              {key}
            </div>
            <div
              className={`px-2 py-1 text-[8px] truncate font-medium ${config.colors.valueText} min-w-0`}
            >
              {mode === "store" &&
                (typeof value === "object"
                  ? `${JSON.stringify(value).slice(0, 30)}...`
                  : String(value).slice(0, 30))}
              {(mode === "get" || mode === "delete") &&
                getCurrentLocalStorageValue(key)}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-gray-500 italic text-center">
          ...and {Object.keys(data).length - maxItems} more
        </div>
      )}
    </div>
  );
};

interface RetrievedDataDisplayProps {
  data: Record<string, unknown> | null;
  maxItems?: number;
}

const RetrievedDataDisplay: React.FC<RetrievedDataDisplayProps> = ({
  data,
  maxItems = UI_CONSTANTS.MAX_PREVIEW_ITEMS,
}) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">No data retrieved</div>
    );
  }

  const entries =
    maxItems === Number.POSITIVE_INFINITY
      ? Object.entries(data)
      : Object.entries(data).slice(0, maxItems);
  const hasMore =
    maxItems !== Number.POSITIVE_INFINITY &&
    Object.keys(data).length > maxItems;

  return (
    <div className="text-xs space-y-1">
      <div className="font-medium text-green-700">Retrieved values:</div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2 space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="font-mono text-green-600 font-semibold">
              {key}:
            </span>
            <span className="text-gray-700 dark:text-gray-300 break-all">
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </span>
          </div>
        ))}
        {hasMore && (
          <div className="text-gray-500 italic">
            ...and {Object.keys(data).length - maxItems} more
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// 3️⃣  Constants
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  STORE: {
    primary: "text-[--node--s-t-o-r-e-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: StoreLocalData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FV2;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "storeLocal",
    displayName: "StoreLocal",
    label: "StoreLocal",
    category: CATEGORIES.STORE,
    size: { expanded, collapsed },
    handles: [
      {
        id: "data-input",
        code: "j",
        position: "top",
        type: "target",
        dataType: "JSON",
        tooltip:
          "Data to store in localStorage. Can be any JSON-serializable object.",
      },
      {
        id: "trigger-input",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
        tooltip:
          "Trigger the operation when this input becomes true. Prevents auto-execution.",
      },
      {
        id: "output",
        code: "j",
        position: "right",
        type: "source",
        dataType: "JSON",
        tooltip:
          "output the result of the operation. Contains stored data, status, or retrieved data.",
      },
    ],
    inspector: { key: "StoreLocalInspector" },
    version: 1,
    runtime: { execute: "storeLocal_execute_v1" },
    initialData: createSafeInitialData(StoreLocalDataSchema, {
      mode: "store",
      inputData: null,
      triggerInput: false,
      lastTriggerState: false,
      store: "",
      isProcessing: false,
      lastOperation: "none",
      lastOperationSuccess: false,
      operationMessage: "",
      output: null,
    }),
    dataSchema: StoreLocalDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputData",
        "triggerInput",
        "lastTriggerState",
        "store",
        "isProcessing",
        "lastOperation",
        "lastOperationSuccess",
        "lastOperationTime",
        "operationMessage",
        "output",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "mode", type: "select", label: "Mode" },
        {
          key: "store",
          type: "textarea",
          label: "Retrieved Data",
          placeholder: "Retrieved localStorage data will appear here...",
          ui: { rows: 6 },
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuDatabase",
    author: "Agenitix Team",
    description:
      "Enhanced localStorage management with store/delete/get modes. Only executes when triggered by boolean input.",
    feature: "storage",
    tags: ["store", "localStorage", "delete", "get", "pulse", "trigger"],
    featureFlag: {
      flag: "store_local_enhanced",
      fallback: true,
      disabledMessage: "Enhanced StoreLocal node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FV2",
  collapsedSize: "C2",
} as StoreLocalData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const StoreLocalNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const { showSuccess, showError, showWarning, showInfo } = useNodeToast(id);

    // Use design system tokens for spacing and other values
    const containerPadding = useDesignSystemToken("spacing.md", "p-3");
    const borderRadius = useDesignSystemToken(
      "effects.rounded.md",
      "rounded-md"
    );
    const textSize = useDesignSystemToken("typography.sizes.sm", "text-sm");

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const {
      isExpanded,
      isEnabled,
      isActive,
      mode,
      inputData,
      triggerInput,
      lastTriggerState,
      store,
      isProcessing,
      lastOperation,
      lastOperationSuccess,
      lastOperationTime,
      operationMessage,
      output,
    } = nodeData as StoreLocalData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // Compute collapsed counter values (keys/values) based on mode
    const collapsedCounts = useMemo(() => {
      const safeInput: Record<string, unknown> | null = inputData && typeof inputData === "object" ? inputData : null;
      if (!safeInput || Object.keys(safeInput).length === 0) {
        return { keyCount: 0, valueCount: 0 };
      }

      const keys = Object.keys(safeInput);

      if (mode === "store") {
        return { keyCount: keys.length, valueCount: keys.length };
      }

      if (mode === "delete") {
        let existingKeyCount = 0;
        try {
          for (const key of keys) {
            if (localStorage.getItem(key) !== null) existingKeyCount++;
          }
        } catch {
          existingKeyCount = 0;
        }
        return { keyCount: existingKeyCount, valueCount: existingKeyCount };
      }

      // mode === "get"
      let existingCount = 0;
      try {
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value !== null) existingCount++;
        }
      } catch {
        existingCount = 0;
      }
      return { keyCount: existingCount, valueCount: existingCount };
    }, [inputData, mode]);

    // Security-enhanced localStorage operations utility
    const localStorageOps = useMemo(
      () => createLocalStorageOperations(id),
      [id]
    );

    // Track connection initialization to prevent auto-triggering
    const connectionInitTimeRef = useRef<number | null>(null);
    const hasEverHadTriggerConnectionRef = useRef<boolean>(false);
    const CONNECTION_DEBOUNCE_MS = 500; // 500ms debounce to prevent auto-trigger on connection

    // Keep last emitted output to avoid redundant writes
    const lastGeneralOutputRef = useRef<any>(null);

    // Check localStorage availability and setup security monitoring on mount
    useEffect(() => {
      if (!localStorageOps.isAvailable()) {
        showError(
          "localStorage unavailable",
          "Browser localStorage is not available or disabled"
        );
      }
    }, [localStorageOps, showError]);

    // Periodic cleanup of expired data (runs every 5 minutes)
    useEffect(() => {
      const cleanupExpiredData = () => {
        const keys = Object.keys(localStorage);
        let cleanedCount = 0;

        keys.forEach((key) => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              if (SecurityValidation.isExpired(parsed)) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch {
            // Skip non-JSON values (legacy data)
          }
        });

        if (cleanedCount > 0) {
          console.log(
            `🧹 Auto-cleanup: Removed ${cleanedCount} expired localStorage items`
          );
          SecurityValidation.addToAuditLog({
            timestamp: Date.now(),
            nodeId: id,
            operation: "get", // Using get as cleanup type
            keys: [`AUTO_CLEANUP_${cleanedCount}_expired_items`],
            success: true,
          });
        }
      };

      // Run cleanup immediately and then every 5 minutes
      cleanupExpiredData();
      const cleanupInterval = setInterval(cleanupExpiredData, 5 * 60 * 1000);

      return () => clearInterval(cleanupInterval);
    }, [id]);

    // Emergency cleanup function accessible via double-click when expanded
    const handleEmergencyCleanup = useCallback(() => {
      if (!isExpanded) return;

      const confirmed = window.confirm(
        "🔒 EMERGENCY CLEANUP\n\n" +
          "This will remove ALL localStorage data created by Agenitix nodes.\n" +
          "Protected authentication data will be preserved.\n\n" +
          "Are you sure you want to continue?"
      );

      if (confirmed) {
        const result = SecurityUtils.emergencyCleanup(id);
        showSuccess(
          "🧹 Emergency Cleanup Complete",
          `Removed ${result.removed} items. Protected ${result.protectedKeys.length} sensitive keys.`
        );
      }
    }, [isExpanded, id, showSuccess]);

    // -------------------------------------------------------------------------
    // 4.3  Feature flag evaluation (after all hooks)
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.4  Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Set mode directly (for carousel selection) */
    const setMode = useCallback(
      (newMode: "store" | "delete" | "get") => {
        updateNodeData({ mode: newMode });
      },
      [updateNodeData]
    );

    /**
     * Compute the latest data coming from connected input handles.
     *
     * Uses unified handle-based input reading system for proper object handling.
     * Priority: handle-based output > legacy fallbacks for compatibility.
     */
    const computeInputs = useCallback(() => {
      // Get data input using unified handle-based system
      const dataInputEdge = findEdgeByHandle(edges, id, "data-input");
      let dataInput = null;

      if (dataInputEdge) {
        const src = nodes.find((n) => n.id === dataInputEdge.source);
        if (src) {
          const sourceData = src.data;
          let inputValue: any;

          // 1. Handle-based output (unified system) - prioritize object data
          if (sourceData?.output && typeof sourceData.output === "object") {
            // Try to get value from handle-based output
            const handleId = dataInputEdge.sourceHandle
              ? dataInputEdge.sourceHandle
                  .split("__")[0]
                  .split("-")[0]
                  .toLowerCase()
              : "output";
            const output = sourceData.output as Record<string, any>;
            if (output[handleId] !== undefined) {
              inputValue = output[handleId];
            } else {
              // Fallback: get first available output value
              const firstOutput = Object.values(output)[0];
              if (firstOutput !== undefined) {
                inputValue = firstOutput;
              }
            }
          }

          // 2. Legacy value fallbacks for compatibility
          if (inputValue === undefined) {
            inputValue = sourceData?.store ?? sourceData?.data ?? sourceData;
          }

          // 3. Parse JSON strings into objects for proper handling
          if (typeof inputValue === "string") {
            try {
              dataInput = JSON.parse(inputValue);
            } catch {
              // If JSON parsing fails, treat as null
              dataInput = null;
            }
          } else if (typeof inputValue === "object" && inputValue !== null) {
            dataInput = inputValue;
          } else {
            dataInput = null;
          }
        }
      }

      // Get trigger input using unified handle-based system
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      let triggerValue = false;

      if (triggerInputEdge) {
        const src = nodes.find((n) => n.id === triggerInputEdge.source);
        if (src) {
          const sourceData = src.data;
          let triggerInputValue: any;

          // 1. Handle-based output (unified system)
          if (sourceData?.output && typeof sourceData.output === "object") {
            const handleId = triggerInputEdge.sourceHandle
              ? triggerInputEdge.sourceHandle
                  .split("__")[0]
                  .split("-")[0]
                  .toLowerCase()
              : "output";
            const output = sourceData.output as Record<string, any>;
            if (output[handleId] !== undefined) {
              triggerInputValue = output[handleId];
            } else {
              const firstOutput = Object.values(output)[0];
              if (firstOutput !== undefined) {
                triggerInputValue = firstOutput;
              }
            }
          }

          // 2. Legacy fallbacks for compatibility
          if (triggerInputValue === undefined) {
            triggerInputValue =
              sourceData?.store ?? sourceData?.data ?? sourceData;
          }

          triggerValue = Boolean(triggerInputValue);
        }
      }

      return { dataInput, triggerValue };
    }, [edges, nodes, id]);

    /** Execute localStorage operation based on mode */
    const executeOperation = useCallback(() => {
      if (!inputData || isProcessing) {
        return;
      }

      updateNodeData({ isProcessing: true });

      try {
        if (mode === "store") {
          const result = localStorageOps.store(inputData);

          // Handle security warnings via toast only
          if (result.warnings && result.warnings.length > 0) {
            // Show specific warning based on type
            const protectedKeyWarning = result.warnings.find(
              (w) => w.type === "protected_key"
            );
            const maliciousWarning = result.warnings.find(
              (w) => w.type === "malicious_content"
            );
            const rateLimitWarning = result.warnings.find(
              (w) => w.type === "rate_limit"
            );
            const sizeLimitWarning = result.warnings.find(
              (w) => w.type === "size_limit"
            );

            if (protectedKeyWarning) {
              showError(
                "🔒 Protected Key Blocked",
                `Cannot access protected keys: ${protectedKeyWarning.keys?.join(", ")}`
              );
            } else if (maliciousWarning) {
              showError(
                "🚫 Malicious Content Detected",
                `Blocked potentially harmful content in keys: ${maliciousWarning.keys?.join(", ")}`
              );
            } else if (rateLimitWarning) {
              showError(
                "⏱️ Rate Limit Exceeded",
                "Too many operations. Please wait before trying again."
              );
            } else if (sizeLimitWarning) {
              showError(
                "📏 Size Limit Exceeded",
                `Data too large for keys: ${sizeLimitWarning.keys?.join(", ")}`
              );
            } else {
              showError("⚠️ Security Warning", result.warnings[0].message);
            }
          }

          updateNodeData({
            isProcessing: false,
            lastOperation: "store",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            store: "", // Clear store for store operations
            output: null, // Clear output for store operations
          });

          // Only show success if no security warnings
          if (
            result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            showSuccess(
              "Store success",
              `Stored ${result.keysProcessed.length} items`
            );
          } else if (
            !result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            // Only show error if not a security warning (already shown above)
            showError("Store failed", result.message);
          }
        } else if (mode === "delete") {
          const keys = Object.keys(inputData);
          const result = localStorageOps.delete(keys);

          // Handle security warnings via toast only
          if (result.warnings && result.warnings.length > 0) {
            // Show specific warning based on type
            const protectedKeyWarning = result.warnings.find(
              (w) => w.type === "protected_key"
            );
            const rateLimitWarning = result.warnings.find(
              (w) => w.type === "rate_limit"
            );

            if (protectedKeyWarning) {
              showError(
                "🔒 Protected Key Blocked",
                `Cannot delete protected keys: ${protectedKeyWarning.keys?.join(", ")}`
              );
            } else if (rateLimitWarning) {
              showError(
                "⏱️ Rate Limit Exceeded",
                "Too many operations. Please wait before trying again."
              );
            } else {
              showError("⚠️ Security Warning", result.warnings[0].message);
            }
          }

          updateNodeData({
            isProcessing: false,
            lastOperation: "delete",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            store: "", // Clear store for delete operations
            output: null, // Clear output for delete operations
          });

          // Only show success if no security warnings
          if (
            result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            showSuccess(
              "Delete success",
              `Deleted ${result.keysDeleted.length} items`
            );
          } else if (
            !result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            // Only show error if not a security warning (already shown above)
            showError("Delete failed", result.message);
          }
        } else if (mode === "get") {
          const keys = Object.keys(inputData);
          const result = localStorageOps.get(keys);

          // Handle security warnings via toast only
          if (result.warnings && result.warnings.length > 0) {
            // Show specific warning based on type
            const protectedKeyWarning = result.warnings.find(
              (w) => w.type === "protected_key"
            );
            const expiredWarning = result.warnings.find(
              (w) => w.type === "expired_data"
            );
            const rateLimitWarning = result.warnings.find(
              (w) => w.type === "rate_limit"
            );

            if (protectedKeyWarning) {
              showError(
                "🔒 Protected Key Blocked",
                `Cannot access protected keys: ${protectedKeyWarning.keys?.join(", ")}`
              );
            } else if (expiredWarning) {
              showError(
                "⏰ Data Expired",
                `Expired data removed for keys: ${expiredWarning.keys?.join(", ")}`
              );
            } else if (rateLimitWarning) {
              showError(
                "⏱️ Rate Limit Exceeded",
                "Too many operations. Please wait before trying again."
              );
            } else {
              showError("⚠️ Security Warning", result.warnings[0].message);
            }
          }

          const retrievedData = result.success ? result.data : null;
          // Format store data as JSON string for inspector display
          const storeDisplay = retrievedData
            ? JSON.stringify(retrievedData, null, 2)
            : "";
          updateNodeData({
            isProcessing: false,
            lastOperation: "get",
            lastOperationSuccess: result.success,
            lastOperationTime: Date.now(),
            operationMessage: result.message,
            store: storeDisplay, // Store formatted JSON string for inspector
            output: retrievedData, // Output raw data for connections
          });

          // Only show success if no security warnings
          if (
            result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            let successMessage = `Retrieved ${result.keysFound.length} items`;
            if (result.expiredKeys && result.expiredKeys.length > 0) {
              successMessage += ` (${result.expiredKeys.length} expired items removed)`;
            }
            showSuccess("Get success", successMessage);
          } else if (
            !result.success &&
            (!result.warnings || result.warnings.length === 0)
          ) {
            // Only show error if not a security warning (already shown above)
            showError("Get failed", result.message);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        updateNodeData({
          isProcessing: false,
          lastOperation: mode,
          lastOperationSuccess: false,
          lastOperationTime: Date.now(),
          operationMessage: errorMessage,
          store: "",
          output: null,
        });
        showError(`${mode} failed`, errorMessage);
      }
    }, [
      inputData,
      isProcessing,
      mode,
      localStorageOps,
      updateNodeData,
      showSuccess,
      showError,
    ]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const { dataInput, triggerValue } = computeInputs();

      // Check if trigger connection exists
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      const hasTriggerConnection = Boolean(triggerInputEdge);
      const hadTriggerConnection = hasEverHadTriggerConnectionRef.current;

      // Detect NEW trigger connection (didn't have one before, now we do)
      if (hasTriggerConnection && !hadTriggerConnection) {
        hasEverHadTriggerConnectionRef.current = true;
        connectionInitTimeRef.current = Date.now();
        console.log(
          `StoreLocal ${id}: NEW trigger connection detected, debounce timer set`
        );
      }

      // Detect trigger disconnection
      if (!hasTriggerConnection && hadTriggerConnection) {
        console.log(`StoreLocal ${id}: Trigger disconnected`);
      }

      const updates: Partial<StoreLocalData> = {};

      // Only update inputData if it actually changed - no operations should trigger from this
      if (JSON.stringify(dataInput) !== JSON.stringify(inputData)) {
        updates.inputData = dataInput;
      }

      // Only update triggerInput if it actually changed
      if (triggerValue !== triggerInput) {
        updates.triggerInput = triggerValue;
        console.log(
          `StoreLocal ${id}: Trigger change detected: ${triggerInput} -> ${triggerValue}`
        );

        // Handle trigger state changes, but connection detection is handled above
        if (triggerInput && !triggerValue) {
          // Reset connection timer when trigger goes false, allowing future true->false->true cycles
          connectionInitTimeRef.current = null;
          console.log(
            `StoreLocal ${id}: Trigger went false, debounce timer reset`
          );
          // Don't update lastTriggerState here - let the normal pulse effect handle it
        }
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length > 0) {
        updateNodeData(updates);
      }
    }, [computeInputs, inputData, triggerInput, edges, id, updateNodeData]);

    /* 🔄 Detect pulse (rising edge) and trigger operations - BOOLEAN TRIGGER ONLY */
    useEffect(() => {
      // Check if we have a trigger connection - only execute if we do
      const triggerInputEdge = findEdgeByHandle(edges, id, "trigger-input");
      const hasTriggerConnection = Boolean(triggerInputEdge);

      // Only trigger on rising edge (false -> true transition) AND only if trigger is connected
      const isPulse = triggerInput && !lastTriggerState && hasTriggerConnection;
      console.log(
        `StoreLocal ${id}: Pulse check - triggerInput: ${triggerInput}, lastTriggerState: ${lastTriggerState}, hasTriggerConnection: ${hasTriggerConnection}, isPulse: ${isPulse}`
      );

      if (isPulse && isEnabled && inputData) {
        // Check if this is too soon after a connection was made
        const now = Date.now();
        const timeSinceConnection = connectionInitTimeRef.current
          ? now - connectionInitTimeRef.current
          : Number.POSITIVE_INFINITY;

        // Only execute if enough time has passed since connection (debounce)
        if (timeSinceConnection > CONNECTION_DEBOUNCE_MS) {
          console.log(
            `StoreLocal ${id}: Pulse EXECUTING operation. Time since connection: ${timeSinceConnection}ms`
          );
          executeOperation();
        } else {
          // Log for debugging
          console.log(
            `StoreLocal ${id}: Pulse BLOCKED by debounce. Time since connection: ${timeSinceConnection}ms, required: ${CONNECTION_DEBOUNCE_MS}ms`
          );
        }
      }

      // Always update last trigger state to track changes (this was missing proper sync)
      if (triggerInput !== lastTriggerState) {
        updateNodeData({ lastTriggerState: triggerInput });
      }
    }, [
      triggerInput,
      lastTriggerState,
      isEnabled,
      inputData,
      executeOperation,
      updateNodeData,
      id,
      edges,
    ]);

    /* 🔄 Update active state based on input data - VISUAL ONLY, no operations */
    useEffect(() => {
      const hasValidData = inputData && Object.keys(inputData).length > 0;

      // This effect only updates visual state, it should NOT trigger operations
      if (isEnabled) {
        if (isActive !== hasValidData) {
          updateNodeData({ isActive: Boolean(hasValidData) });
        }
      } else if (isActive) {
        updateNodeData({ isActive: false });
      }
    }, [inputData, isEnabled, isActive, updateNodeData]);

    // -------------------------------------------------------------------------
    // 4.5b  REMOVED Auto-execute functionality
    // -------------------------------------------------------------------------
    // Auto-execute has been removed to prevent unwanted activations.
    // StoreLocal should ONLY execute when explicitly triggered by boolean input.

    // -------------------------------------------------------------------------
    // 4.5c  Output generation
    // -------------------------------------------------------------------------

    /* 🔄 Handle-based output field generation for multi-handle compatibility */
    useEffect(() => {
      try {
        // Create a data object with proper handle field mapping, basically map localStorage results to output handles
        const mappedData = {
          ...nodeData,
          output: output || null, // Map output data to main output handle
        };

        // Only update if there are actual changes to prevent unnecessary re-renders
        const currentOutput = lastGeneralOutputRef.current;
        let hasChanged = true;

        if (currentOutput && output) {
          // Compare output contents
          hasChanged = JSON.stringify(currentOutput) !== JSON.stringify(output);
        } else if (currentOutput !== output) {
          hasChanged = true;
        }

        if (hasChanged) {
          lastGeneralOutputRef.current = output;
          updateNodeData({ output: output || null });
        }
      } catch (error) {
        console.error(`StoreLocal ${id}: Error generating output`, error, {
          spec: spec?.kind,
          nodeDataKeys: Object.keys(nodeData || {}),
        });

        // Fallback: set null to prevent crashes, basically empty state for storage
        if (lastGeneralOutputRef.current !== null) {
          lastGeneralOutputRef.current = null;
          updateNodeData({ output: null });
        }
      }
    }, [spec.handles, nodeData, output, updateNodeData, id]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("StoreLocal", id, validation.errors, {
        originalData: validation.originalData,
        component: "StoreLocalNode",
      });
    }

    useNodeDataValidation(
      StoreLocalDataSchema,
      "StoreLocal",
      validation.data,
      id
    );

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      // For small collapsed sizes (C1, C1W), hide text and center better
      const isSmallNode =
        !isExpanded &&
        (nodeData.collapsedSize === "C1" || nodeData.collapsedSize === "C1W");

      return (
        <Loading
          className={
            isSmallNode
              ? "flex items-center justify-center w-full h-full"
              : "p-4"
          }
          size={isSmallNode ? "w-6 h-6" : "w-8 h-8"}
          text={isSmallNode ? undefined : "Loading..."}
          showText={!isSmallNode}
        />
      );
    }

    // If flag is disabled and should hide, return null
    if (!flagState.isEnabled && flagState.hideWhenDisabled) {
      return null;
    }

    // If flag is disabled, show disabled message
    if (!flagState.isEnabled) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground border border-dashed border-muted-foreground/20 rounded-lg">
          {flagState.disabledMessage}
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={(nodeData as StoreLocalData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`
              ${CONTENT_CLASSES.expanded}
              bg-node-store
              border-node-store
              text-node-store
              ${isEnabled ? "" : CONTENT_CLASSES.disabled}
            `}
          >
            {/* Fixed header section */}
            <div className={`${containerPadding} flex-shrink-0 mt-1`}>
              <div className="flex content-center w-full">
                <ModeSelector
                  className="w-full"
                  mode={mode}
                  onModeChange={setMode}
                  disabled={!isEnabled}
                  isProcessing={isProcessing}
                  isCollapsed={false}
                />
              </div>
              <div className={`font-medium text-xs pt-0`}>
                {mode === "store"
                  ? "Will store"
                  : mode === "delete"
                    ? "Will delete"
                    : "Output values"}
              </div>
            </div>

            {/* Scrollable content section */}
            <div
              className={`flex-1 flex flex-col items-stretch justify-start overflow-y-auto ${containerPadding} pt-0 nowheel w-full`}
            >
              <DataPreview
                data={inputData}
                mode={mode}
                maxItems={Number.POSITIVE_INFINITY}
              />
            </div>
          </div>
        ) : (
          <div
            className={`
              ${CONTENT_CLASSES.collapsed}
              bg-node-store
              border-node-store
              text-node-store
              ${isEnabled ? "" : CONTENT_CLASSES.disabled}
            `}
          >
            <div className="flex flex-col items-center justify-center gap-1 p-1 w-full">
              <div className="flex content-center w-full">
                <ModeSelector
                  className="w-full"
                  mode={mode}
                  onModeChange={setMode}
                  disabled={!isEnabled}
                  isProcessing={isProcessing}
                  isCollapsed={true}
                />
              </div>
              {/* Collapsed counters using shared CounterBoxContainer */}
              <CounterBoxContainer
                className="mt-2"
                // defaultTextColor={MODE_CONFIG[mode.toUpperCase() as keyof typeof MODE_CONFIG].colors.counterContainer}
                // defaultBgColor={MODE_CONFIG[mode.toUpperCase() as keyof typeof MODE_CONFIG].colors.counterBg}
                // defaultLabelColor={MODE_CONFIG[mode.toUpperCase() as keyof typeof MODE_CONFIG].colors.counterLabel}
                counters={[
                  { label: "Key", count: collapsedCounts.keyCount },
                  { label: "Value", count: collapsedCounts.valueCount },
                ]}
              />
            </div>
          </div>
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * ⚠️ THIS is the piece that fixes the focus‑loss issue.
 *
 * `withNodeScaffold` returns a *component function*.  Re‑creating that function
 * on every keystroke causes React to unmount / remount the subtree (and your
 * textarea loses focus).  We memoise the scaffolded component so its identity
 * stays stable across renders unless the *spec itself* really changes.
 */
const StoreLocalNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as StoreLocalData),
    [
      (nodeData as StoreLocalData).expandedSize,
      (nodeData as StoreLocalData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <StoreLocalNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default StoreLocalNodeWithDynamicSpec;
