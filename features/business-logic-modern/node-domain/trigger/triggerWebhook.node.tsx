/**
 * TriggerWebhook NODE – Professional webhook receiver with advanced configuration
 *
 * • WEBHOOK RECEIVER: Creates HTTP endpoints to receive data from external services
 * • MULTIPLE HTTP METHODS: GET, POST, PUT, PATCH, DELETE, HEAD support
 * • AUTHENTICATION: Basic Auth, Header Auth, JWT Auth, and None
 * • CORS SUPPORT: Configurable allowed origins for cross-origin requests
 * • IP WHITELIST: Restrict access to specific IP addresses
 * • CUSTOM RESPONSES: Configure response codes, headers, and body data
 * • BINARY SUPPORT: Handle file uploads and binary data
 * • PROFESSIONAL UI: Real-time webhook status and request monitoring
 * • STARTUP-LEVEL QUALITY: Enterprise-grade webhook functionality
 *
 * Keywords: webhook, http-endpoint, trigger, api-receiver, professional-ui
 */

import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/features/useNodeFeatureFlag";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/utils/iconUtils";
import {
  SafeSchemas,
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/utils/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { toast } from "sonner";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
// -----------------------------------------------------------------------------
export const TriggerWebhookDataSchema = z
  .object({
    // Webhook Configuration
    httpMethod: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])
      .default("POST"),
    webhookPath: z.string().default(""),

    // Authentication
    authType: z.enum(["none", "basic", "header", "jwt"]).default("none"),
    authConfig: z
      .object({
        username: z.string().default(""),
        password: z.string().default(""),
        headerName: z.string().default(""),
        headerValue: z.string().default(""),
        jwtSecret: z.string().default(""),
      })
      .default({}),

    // Response Configuration
    respondMode: z
      .enum(["immediately", "lastNode", "respondNode"])
      .default("immediately"),
    responseCode: z.number().min(100).max(599).default(200),
    responseData: z
      .enum(["allEntries", "firstJSON", "firstBinary", "noBody"])
      .default("firstJSON"),

    // Advanced Options
    allowedOrigins: z.string().default("*"), // CORS
    ipWhitelist: z.string().default(""), // Comma-separated IPs
    ignoreBots: z.boolean().default(false),
    binaryProperty: z.string().default(""),
    rawBody: z.boolean().default(false),
    responseHeaders: z.string().default(""), // JSON string of headers
    autoTrigger: z.boolean().default(true), // Auto-send data when received

    // Webhook State
    isActive: z.boolean().default(false),
    webhookUrl: z.string().default(""),
    lastRequestTime: z.number().nullable().default(null),
    requestCount: z.number().default(0),
    lastRequestData: z.any().nullable().default(null),

    // Node State
    isEnabled: SafeSchemas.boolean(true),
    isExpanded: SafeSchemas.boolean(false),
    expandedSize: SafeSchemas.text("VE3"),
    collapsedSize: SafeSchemas.text("C2"),
    label: z.string().optional(),

    // Legacy fields for compatibility
    store: SafeSchemas.text(""),
    inputs: SafeSchemas.optionalText().nullable().default(null),
    output: SafeSchemas.optionalText(),

    // Webhook output data (what gets sent to connected nodes)
    webhookOutput: z.any().nullable().default(null),
  })
  .passthrough();

export type TriggerWebhookData = z.infer<typeof TriggerWebhookDataSchema>;

const validateNodeData = createNodeValidator(
  TriggerWebhookDataSchema,
  "TriggerWebhook"
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants & Utilities - Professional TRIGGER theming
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  TRIGGER: {
    primary: "text-[--node-trigger-text]",
    secondary: "text-[--node-trigger-text-secondary]",
  },
} as const;

const CONTENT = {
  // Professional expanded layout with TRIGGER theming
  expanded:
    "p-3 w-full h-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm",

  // Professional collapsed layout with TRIGGER theming
  collapsed:
    "flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm",

  header: "flex items-center justify-between mb-2",
  body: "flex-1 flex flex-col gap-2",
  disabled: "opacity-60 grayscale transition-all duration-300",

  // Active indicator with TRIGGER theming
  activeIndicator:
    "absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse",

  // Professional configuration sections
  configSection:
    "bg-white dark:bg-slate-800 rounded-lg p-2 border border-purple-200 dark:border-purple-700 shadow-sm",
  configHeader:
    "text-[8px] font-semibold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1",
  configGrid: "grid grid-cols-1 gap-1",

  // Professional form controls with TRIGGER theming
  formGroup: "flex flex-col gap-1",
  formRow: "flex items-center justify-between gap-1",
  label:
    "text-[8px] font-medium text-purple-600 dark:text-purple-400 min-w-0 flex-shrink-0",
  input:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors",
  select:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors",
  textarea:
    "flex-1 min-w-0 px-1.5 py-0.5 text-[8px] border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-colors resize-none",

  // Professional status section with TRIGGER theming
  statusSection:
    "bg-gradient-to-r from-purple-50 to-indigo-100 dark:from-purple-800 dark:to-indigo-700 rounded-lg p-2 border border-purple-200 dark:border-purple-700",

  // Control buttons
  buttonPrimary:
    "px-2 py-1 text-[8px] font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed rounded-md transition-all duration-200 shadow-sm hover:shadow-md",
  buttonSecondary:
    "px-2 py-1 text-[8px] font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-700 border border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-slate-600 rounded-md transition-all duration-200",

  // Professional collapsed view with TRIGGER theming
  collapsedIcon: "text-lg mb-1 text-purple-600 dark:text-purple-400",
  collapsedTitle:
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1",
  collapsedSubtitle: "text-[8px] text-slate-500 dark:text-slate-400",
  collapsedStatus: "mt-1 px-1 py-0.5 rounded-full text-[8px] font-medium",
  collapsedActive:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  collapsedInactive:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
} as const;

// Generate webhook URL based on configuration
const generateWebhookUrl = (
  path: string,
  baseUrl: string = "http://localhost:3000"
): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/api/webhook${cleanPath}`;
};

// Generate random webhook path if none provided
const generateRandomPath = (): string => {
  return `/webhook-${Math.random().toString(36).substring(2, 15)}`;
};

// Format request count for display
const formatRequestCount = (count: number | undefined | null): string => {
  const validCount = Number(count) || 0;
  if (validCount === 0) return "No requests";
  if (validCount === 1) return "1 request";
  if (validCount < 1000) return `${validCount} requests`;
  if (validCount < 1000000)
    return `${(validCount / 1000).toFixed(1)}k requests`;
  return `${(validCount / 1000000).toFixed(1)}M requests`;
};

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec with professional TRIGGER theming and webhook configuration.
 */
function createDynamicSpec(data: TriggerWebhookData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.VE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "triggerWebhook",
    displayName: "Webhook Trigger",
    label: "Webhook Trigger",
    category: CATEGORIES.TRIGGER,
    size: { expanded, collapsed },
    handles: [
      // Webhook output - emits received data
      {
        id: "webhook-output",
        code: "json", // JSON data from webhook
        position: "right",
        type: "source",
        dataType: "JSON",
      },
      // Status output - webhook active/inactive
      {
        id: "status-output",
        code: "boolean", // Boolean status
        position: "bottom",
        type: "source",
        dataType: "boolean",
      },
    ],
    inspector: { key: "TriggerWebhookInspector" },
    version: 1,
    runtime: { execute: "triggerWebhook_execute_v1" },
    initialData: createSafeInitialData(TriggerWebhookDataSchema, {
      httpMethod: "POST",
      webhookPath: "",
      authType: "none",
      respondMode: "immediately",
      responseCode: 200,
      responseData: "firstJSON",
      allowedOrigins: "*",
      autoTrigger: true, // Explicitly set auto-trigger to true by default
      isActive: false,
      requestCount: 0,
    }),
    dataSchema: TriggerWebhookDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "webhookUrl",
        "lastRequestTime",
        "requestCount",
        "lastRequestData",
        "expandedSize",
        "collapsedSize",
        "store",
        "inputs",
        "output",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable Webhook" },
        { key: "autoTrigger", type: "boolean", label: "Auto-trigger Flow" },
        { key: "httpMethod", type: "select", label: "HTTP Method" },
        {
          key: "webhookPath",
          type: "text",
          label: "Webhook Path",
          placeholder: "/my-webhook",
        },
        { key: "authType", type: "select", label: "Authentication" },
        { key: "respondMode", type: "select", label: "Response Mode" },
        { key: "responseCode", type: "number", label: "Response Code" },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuWebhook",
    author: "Agenitix Team",
    description:
      "Receive HTTP requests from external services and trigger workflows with webhook data",
    feature: "trigger",
    tags: ["webhook", "http", "api", "trigger", "endpoint", "receiver"],
    featureFlag: {
      flag: "webhook_triggers_enabled",
      fallback: true,
      disabledMessage: "Webhook triggers are currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "VE3",
  collapsedSize: "C2",
  httpMethod: "POST",
  webhookPath: "",
  authType: "none",
} as TriggerWebhookData);
// -----------------------------------------------------------------------------
// 4️⃣  React component – webhook configuration & monitoring
// -----------------------------------------------------------------------------

const TriggerWebhookNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
    const typedNodeData = nodeData as TriggerWebhookData;
    const {
      isExpanded,
      isEnabled,
      httpMethod,
      webhookPath,
      authType,
      authConfig,
      respondMode,
      responseCode,
      responseData,
      allowedOrigins,
      ipWhitelist,
      ignoreBots,
      binaryProperty,
      rawBody,
      responseHeaders,
      autoTrigger,
      isActive,
      webhookUrl,
      lastRequestTime,
      requestCount,
      lastRequestData,
    } = typedNodeData;

    // Local state for inputs to prevent focus loss
    const [localWebhookPath, setLocalWebhookPath] = useState(
      webhookPath as string
    );
    const [localAllowedOrigins, setLocalAllowedOrigins] = useState(
      allowedOrigins as string
    );
    const [localIpWhitelist, setLocalIpWhitelist] = useState(
      ipWhitelist as string
    );
    const [localBinaryProperty, setLocalBinaryProperty] =
      useState(binaryProperty);
    const [localResponseHeaders, setLocalResponseHeaders] =
      useState(responseHeaders);

    // Auth config local state
    const [localAuthConfig, setLocalAuthConfig] = useState(authConfig || {});

    // Ref to track if we're currently editing
    const isEditingRef = useRef(false);

    const categoryStyles = CATEGORY_TEXT.TRIGGER;

    // -------------------------------------------------------------------------
    // 4.3  Feature flag evaluation (after all hooks)
    // -------------------------------------------------------------------------
    const flagState = useNodeFeatureFlag(spec.featureFlag);

    // -------------------------------------------------------------------------
    // 4.4  Backend Communication Functions (FIRST - before they're used)
    // -------------------------------------------------------------------------

    /** Register webhook with backend */
    const registerWebhookWithBackend = useCallback(
      async (path: string, method: string) => {
        try {
          const response = await fetch(`/api/webhook${path}?action=register`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              config: {
                httpMethod: method,
                authType: authType || "none",
                authConfig: authConfig || {},
                allowedOrigins: allowedOrigins || "*",
                ipWhitelist: ipWhitelist || "",
                ignoreBots: ignoreBots || false,
                respondMode: respondMode || "immediately",
                responseCode: responseCode || 200,
                responseData: responseData || "firstJSON",
                responseHeaders: responseHeaders || "",
                nodeId: id,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to register webhook: ${response.statusText}`
            );
          }

          // Webhook registered successfully
          return true;
        } catch (error) {
          console.error("❌ Failed to register webhook:", error);
          toast.error("Failed to register webhook with backend");
          return false;
        }
      },
      [
        authType,
        authConfig,
        allowedOrigins,
        ipWhitelist,
        ignoreBots,
        respondMode,
        responseCode,
        responseData,
        responseHeaders,
        id,
      ]
    );

    /** Unregister webhook from backend */
    const unregisterWebhookFromBackend = useCallback(
      async (path: string, method: string) => {
        try {
          const response = await fetch(
            `/api/webhook${path}?action=unregister`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                config: { httpMethod: method },
              }),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to unregister webhook: ${response.statusText}`
            );
          }

          // Webhook unregistered successfully
          return true;
        } catch (error) {
          console.error("❌ Failed to unregister webhook:", error);
          return false;
        }
      },
      []
    );

    /** Get webhook statistics from backend */
    const getWebhookStats = useCallback(
      async (path: string, method: string) => {
        try {
          const response = await fetch(
            `/api/webhook${path}?action=getStats&method=${method}`,
            {
              method: "PATCH",
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to get stats: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.success && data.stats) {
            // Polling webhook stats for new data

            // Get webhook data from backend response
            const lastData = data.stats.lastRequestData;
            if (lastData) {
              // Found webhook data from backend
            } else {
              // No webhook data available from backend
            }

            // Check if we have new data and auto-trigger is enabled
            const hasNewData =
              lastData &&
              JSON.stringify(lastData) !== JSON.stringify(lastRequestData);

            // Auto-trigger debug information
            const debugInfo = {
              autoTrigger,
              hasNewData,
              lastData: lastData ? "exists" : "null",
              lastRequestData: lastRequestData ? "exists" : "null",
              dataComparison: {
                new: lastData
                  ? JSON.stringify(lastData).substring(0, 100)
                  : "null",
                old: lastRequestData
                  ? JSON.stringify(lastRequestData).substring(0, 100)
                  : "null",
              },
            };

            updateNodeData({
              requestCount: data.stats.requestCount,
              lastRequestTime: data.stats.lastRequestTime,
              lastRequestData: lastData,
            });

            // Auto-trigger if enabled and we have new data
            if (autoTrigger && hasNewData && lastData) {
              // Auto-triggering webhook data

              updateNodeData({
                webhookOutput: lastData,
                output: JSON.stringify(lastData),
              });

              toast.success(
                "Webhook data automatically sent to connected nodes!"
              );
            } else if (autoTrigger && lastData && !hasNewData) {
              // Auto-trigger enabled but no new data detected
            } else if (!autoTrigger && lastData) {
              // Auto-trigger disabled, data available but not sent
            }
          }
        } catch (error) {
          console.error("❌ Failed to get webhook stats:", error);
        }
      },
      [updateNodeData, id, lastRequestData, autoTrigger]
    );

    // -------------------------------------------------------------------------
    // 4.5  Main Action Callbacks
    // -------------------------------------------------------------------------

    /** Toggle between collapsed / expanded */
    const toggleExpand = useCallback(() => {
      updateNodeData({ isExpanded: !isExpanded });
    }, [isExpanded, updateNodeData]);

    /** Generate webhook URL */
    const generateUrl = useCallback(() => {
      const newPath = generateRandomPath();
      const newUrl = generateWebhookUrl(newPath);

      // Update both local state and node data immediately
      setLocalWebhookPath(newPath);
      updateNodeData({
        webhookPath: newPath,
        webhookUrl: newUrl,
      });

      toast.success("New webhook URL generated!");
    }, [updateNodeData]);

    /** Activate webhook */
    const activateWebhook = useCallback(async () => {
      let pathToUse = webhookPath;
      if (!pathToUse) {
        pathToUse = generateRandomPath();
        setLocalWebhookPath(pathToUse);
      }

      // Ensure we have a valid HTTP method
      const methodToUse = httpMethod || "POST";

      // Register with backend first
      const success = await registerWebhookWithBackend(pathToUse, methodToUse);

      if (success) {
        updateNodeData({
          isActive: true,
          webhookPath: pathToUse,
          webhookUrl: generateWebhookUrl(pathToUse),
          httpMethod: methodToUse, // Ensure method is set
        });

        toast.success(
          `Webhook activated! Listening on ${methodToUse} ${pathToUse}`
        );
      } else {
        toast.error("Failed to activate webhook");
      }
    }, [webhookPath, httpMethod, registerWebhookWithBackend, updateNodeData]);

    /** Deactivate webhook */
    const deactivateWebhook = useCallback(async () => {
      // Unregister from backend first
      const success = await unregisterWebhookFromBackend(
        webhookPath,
        httpMethod
      );

      updateNodeData({
        isActive: false,
      });

      if (success) {
        toast.info("Webhook deactivated");
      } else {
        toast.warning(
          "Webhook deactivated locally (backend may still be active)"
        );
      }
    }, [webhookPath, httpMethod, unregisterWebhookFromBackend, updateNodeData]);

    /** Clear webhook statistics */
    const clearStats = useCallback(async () => {
      // Clear local statistics
      updateNodeData({
        requestCount: 0,
        lastRequestTime: null,
        lastRequestData: null,
      });

      // If webhook is active, re-register to reset backend stats
      if (isActive && webhookPath) {
        await unregisterWebhookFromBackend(webhookPath, httpMethod);
        await registerWebhookWithBackend(webhookPath, httpMethod);
      }

      toast.success("Webhook statistics cleared");
    }, [
      isActive,
      webhookPath,
      httpMethod,
      updateNodeData,
      unregisterWebhookFromBackend,
      registerWebhookWithBackend,
    ]);

    // -------------------------------------------------------------------------
    // 4.6  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Sync local state with node data */
    useEffect(() => {
      if (!isEditingRef.current) {
        setLocalWebhookPath(webhookPath);
        setLocalAllowedOrigins(allowedOrigins);
        setLocalIpWhitelist(ipWhitelist);
        setLocalBinaryProperty(binaryProperty);
        setLocalResponseHeaders(responseHeaders);
        setLocalAuthConfig(authConfig || {});
      }
    }, [
      webhookPath,
      allowedOrigins,
      ipWhitelist,
      binaryProperty,
      responseHeaders,
      authConfig,
    ]);

    /* 🔄 Generate initial webhook path if empty */
    useEffect(() => {
      if (!webhookPath && isEnabled) {
        const randomPath = generateRandomPath();
        updateNodeData({
          webhookPath: randomPath,
          webhookUrl: generateWebhookUrl(randomPath),
        });
      }
    }, [webhookPath, isEnabled, updateNodeData]);

    /* 🔄 Ensure auto-trigger default value is properly set for new nodes */
    useEffect(() => {
      // Only run once when the node is first created
      if (autoTrigger === undefined || autoTrigger === null) {
        updateNodeData({
          autoTrigger: true, // Set default value explicitly
        });
      }
    }, []); // Empty dependency array - only run once on mount

    /* 🔄 Deactivate webhook when disabled */
    useEffect(() => {
      if (!isEnabled && isActive) {
        deactivateWebhook();
      }
    }, [isEnabled, isActive, deactivateWebhook]);

    /* 🔄 Poll webhook statistics when active */
    useEffect(() => {
      if (!isActive || !webhookPath || !httpMethod) return;

      const interval = setInterval(() => {
        getWebhookStats(webhookPath, httpMethod);
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }, [isActive, webhookPath, httpMethod, getWebhookStats]);

    /* 🔄 Re-register webhook when HTTP method changes */
    useEffect(() => {
      if (isActive && webhookPath && httpMethod) {
        // Re-register webhook with new method
        const reRegisterWebhook = async () => {
          await unregisterWebhookFromBackend(webhookPath, httpMethod);
          await registerWebhookWithBackend(webhookPath, httpMethod);
        };
        reRegisterWebhook();
      }
    }, [httpMethod]); // Only trigger when httpMethod changes

    /* 🧹 Cleanup webhook on unmount */
    useEffect(() => {
      return () => {
        if (isActive && webhookPath && httpMethod) {
          // Cleanup webhook when component unmounts
          unregisterWebhookFromBackend(webhookPath, httpMethod);
        }
      };
    }, [isActive, webhookPath, httpMethod, unregisterWebhookFromBackend]);

    // -------------------------------------------------------------------------
    // 4.7  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("TriggerWebhook", id, validation.errors, {
        originalData: validation.originalData,
        component: "TriggerWebhookNode",
      });
    }

    useNodeDataValidation(
      TriggerWebhookDataSchema,
      "TriggerWebhook",
      validation.data,
      id
    );
    // -------------------------------------------------------------------------
    // 4.8  Feature flag conditional rendering
    // -------------------------------------------------------------------------

    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className={`${CONTENT.collapsed} animate-pulse`}>
          <div className="flex flex-col items-center justify-center w-full h-full p-2">
            <div className={`${CONTENT.collapsedIcon} opacity-50`}>
              {spec.icon && renderLucideIcon(spec.icon, "", 18)}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Loading...
            </div>
          </div>
        </div>
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
    // 4.9  Computed display values
    // -------------------------------------------------------------------------
    const displayUrl =
      webhookUrl || generateWebhookUrl(webhookPath || "/webhook");
    const lastRequestDisplay = lastRequestTime
      ? new Date(lastRequestTime).toLocaleString()
      : "Never";

    // -------------------------------------------------------------------------
    // 4.10  Professional Render - Startup Quality
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Active indicator when webhook is active */}
        {isActive && <div className={CONTENT.activeIndicator} />}

        {/* Editable label or icon */}
        {!isExpanded &&
        spec.size.collapsed.width === 60 &&
        spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-0 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode
            nodeId={id}
            label={typedNodeData.label || spec.displayName}
          />
        )}

        {!isExpanded ? (
          // ===== COLLAPSED VIEW - Professional & Compact =====
          <div
            className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              {/* Icon */}
              <div className={CONTENT.collapsedIcon}>
                {spec.icon && renderLucideIcon(spec.icon, "", 18)}
              </div>

              {/* HTTP Method */}
              <div className={CONTENT.collapsedTitle}>{httpMethod}</div>

              {/* Request Count */}
              <div className={CONTENT.collapsedSubtitle}>
                {formatRequestCount(requestCount)}
              </div>

              {/* Webhook Path Preview */}
              {webhookPath && (
                <div className="text-[7px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-full">
                  {webhookPath.length > 15
                    ? `...${webhookPath.slice(-12)}`
                    : webhookPath}
                </div>
              )}

              {/* Status Badge */}
              <div
                className={`${CONTENT.collapsedStatus} ${
                  isActive ? CONTENT.collapsedActive : CONTENT.collapsedInactive
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        ) : (
          // ===== EXPANDED VIEW - Professional Interface =====
          <div
            className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ""}`}
          >
            <div className={CONTENT.body}>
              {/* Webhook Configuration Section */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuWebhook", "text-purple-500", 10)}
                  Webhook Configuration
                </div>
                <div className={CONTENT.configGrid}>
                  {/* HTTP Method */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Method:</label>
                      <select
                        className={CONTENT.select}
                        value={httpMethod}
                        onChange={(e) =>
                          updateNodeData({
                            httpMethod: e.target.value as any,
                          })
                        }
                        disabled={isActive}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                        <option value="HEAD">HEAD</option>
                      </select>
                    </div>
                  </div>

                  {/* Webhook Path */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Path:</label>
                      <input
                        type="text"
                        className={CONTENT.input}
                        value={localWebhookPath}
                        onFocus={() => {
                          isEditingRef.current = true;
                        }}
                        onChange={(e) => {
                          setLocalWebhookPath(e.target.value);
                        }}
                        onBlur={(e) => {
                          isEditingRef.current = false;
                          const path = e.target.value || generateRandomPath();
                          updateNodeData({
                            webhookPath: path,
                            webhookUrl: generateWebhookUrl(path),
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="/my-webhook"
                        disabled={isActive}
                      />
                    </div>
                  </div>

                  {/* Authentication Type */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Auth:</label>
                      <select
                        className={CONTENT.select}
                        value={authType}
                        onChange={(e) =>
                          updateNodeData({
                            authType: e.target.value as any,
                          })
                        }
                        disabled={isActive}
                      >
                        <option value="none">None</option>
                        <option value="basic">Basic Auth</option>
                        <option value="header">Header Auth</option>
                        <option value="jwt">JWT Auth</option>
                      </select>
                    </div>
                  </div>

                  {/* Basic Auth Configuration */}
                  {authType === "basic" && (
                    <>
                      <div className={CONTENT.formGroup}>
                        <div className={CONTENT.formRow}>
                          <label className={CONTENT.label}>Username:</label>
                          <input
                            type="text"
                            className={CONTENT.input}
                            value={(localAuthConfig || {}).username || ""}
                            onChange={(e) => {
                              const newConfig = {
                                ...(localAuthConfig || {}),
                                username: e.target.value,
                              };
                              setLocalAuthConfig(newConfig);
                              updateNodeData({ authConfig: newConfig });
                            }}
                            placeholder="admin"
                            disabled={isActive}
                          />
                        </div>
                      </div>
                      <div className={CONTENT.formGroup}>
                        <div className={CONTENT.formRow}>
                          <label className={CONTENT.label}>Password:</label>
                          <input
                            type="password"
                            className={CONTENT.input}
                            value={(localAuthConfig || {}).password || ""}
                            onChange={(e) => {
                              const newConfig = {
                                ...(localAuthConfig || {}),
                                password: e.target.value,
                              };
                              setLocalAuthConfig(newConfig);
                              updateNodeData({ authConfig: newConfig });
                            }}
                            placeholder="password123"
                            disabled={isActive}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Header Auth Configuration */}
                  {authType === "header" && (
                    <>
                      <div className={CONTENT.formGroup}>
                        <div className={CONTENT.formRow}>
                          <label className={CONTENT.label}>Header Name:</label>
                          <input
                            type="text"
                            className={CONTENT.input}
                            value={(localAuthConfig || {}).headerName || ""}
                            onChange={(e) => {
                              const newConfig = {
                                ...(localAuthConfig || {}),
                                headerName: e.target.value,
                              };
                              setLocalAuthConfig(newConfig);
                              updateNodeData({ authConfig: newConfig });
                            }}
                            placeholder="X-API-Key"
                            disabled={isActive}
                          />
                        </div>
                      </div>
                      <div className={CONTENT.formGroup}>
                        <div className={CONTENT.formRow}>
                          <label className={CONTENT.label}>Header Value:</label>
                          <input
                            type="text"
                            className={CONTENT.input}
                            value={(localAuthConfig || {}).headerValue || ""}
                            onChange={(e) => {
                              const newConfig = {
                                ...(localAuthConfig || {}),
                                headerValue: e.target.value,
                              };
                              setLocalAuthConfig(newConfig);
                              updateNodeData({ authConfig: newConfig });
                            }}
                            placeholder="your-secret-key"
                            disabled={isActive}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* JWT Auth Configuration */}
                  {authType === "jwt" && (
                    <div className={CONTENT.formGroup}>
                      <div className={CONTENT.formRow}>
                        <label className={CONTENT.label}>JWT Secret:</label>
                        <input
                          type="password"
                          className={CONTENT.input}
                          value={(localAuthConfig || {}).jwtSecret || ""}
                          onChange={(e) => {
                            const newConfig = {
                              ...(localAuthConfig || {}),
                              jwtSecret: e.target.value,
                            };
                            setLocalAuthConfig(newConfig);
                            updateNodeData({ authConfig: newConfig });
                          }}
                          placeholder="your-jwt-secret"
                          disabled={isActive}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Webhook URL Display */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuLink", "text-purple-500", 10)}
                  Webhook URL
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded p-2 border">
                  <div className="text-[8px] font-mono text-slate-600 dark:text-slate-300 break-all">
                    {displayUrl}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      className={CONTENT.buttonSecondary}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(displayUrl);
                          toast.success("Webhook URL copied to clipboard!");
                        } catch (error) {
                          toast.error("Failed to copy URL");
                        }
                      }}
                    >
                      Copy
                    </button>
                    <button
                      className={CONTENT.buttonSecondary}
                      onClick={generateUrl}
                      disabled={isActive}
                    >
                      Generate New
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Configuration */}
              <div className={CONTENT.configSection}>
                <div className={CONTENT.configHeader}>
                  {renderLucideIcon("LuSettings", "text-purple-500", 10)}
                  Response Settings
                </div>
                <div className={CONTENT.configGrid}>
                  {/* Response Mode */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Mode:</label>
                      <select
                        className={CONTENT.select}
                        value={respondMode}
                        onChange={(e) =>
                          updateNodeData({
                            respondMode: e.target.value as any,
                          })
                        }
                      >
                        <option value="immediately">Immediately</option>
                        <option value="lastNode">
                          When Last Node Finishes
                        </option>
                        <option value="respondNode">Using Respond Node</option>
                      </select>
                    </div>
                  </div>

                  {/* Response Code */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Code:</label>
                      <input
                        type="number"
                        className={CONTENT.input}
                        value={responseCode}
                        min={100}
                        max={599}
                        onChange={(e) =>
                          updateNodeData({
                            responseCode:
                              Number.parseInt(e.target.value) || 200,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Response Data Type */}
                  <div className={CONTENT.formGroup}>
                    <div className={CONTENT.formRow}>
                      <label className={CONTENT.label}>Data:</label>
                      <select
                        className={CONTENT.select}
                        value={responseData}
                        onChange={(e) =>
                          updateNodeData({
                            responseData: e.target.value as any,
                          })
                        }
                      >
                        <option value="allEntries">All Entries</option>
                        <option value="firstJSON">First Entry JSON</option>
                        <option value="firstBinary">First Entry Binary</option>
                        <option value="noBody">No Response Body</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhook Statistics */}
              <div className={CONTENT.statusSection}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-purple-600 dark:text-purple-400">
                      Status:
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                      />
                      <span
                        className={`text-[8px] font-medium ${isActive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-purple-600 dark:text-purple-400">
                      Requests:
                    </span>
                    <span className="text-[8px] font-medium text-slate-600 dark:text-slate-300">
                      {formatRequestCount(requestCount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-purple-600 dark:text-purple-400">
                      Last Request:
                    </span>
                    <span className="text-[8px] font-medium text-slate-600 dark:text-slate-300">
                      {lastRequestDisplay}
                    </span>
                  </div>

                  {/* Auto-trigger status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-medium text-purple-600 dark:text-purple-400">
                      Auto-trigger:
                    </span>
                    <span
                      className={`text-[8px] font-medium ${autoTrigger ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {autoTrigger ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {/* Last data preview */}
                  {lastRequestData && (
                    <div className="mt-1 p-1 bg-slate-100 dark:bg-slate-700 rounded text-[7px] font-mono">
                      <div className="text-purple-600 dark:text-purple-400 font-semibold mb-0.5">
                        Last Data:
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 truncate">
                        {JSON.stringify(lastRequestData).substring(0, 50)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-1 mt-2">
                <button
                  className={CONTENT.buttonPrimary}
                  onClick={isActive ? deactivateWebhook : activateWebhook}
                  disabled={!isEnabled}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>

                <button
                  className={CONTENT.buttonSecondary}
                  onClick={clearStats}
                  disabled={!isEnabled || requestCount === 0}
                >
                  Clear Stats
                </button>

                {isActive && (
                  <button
                    className={CONTENT.buttonSecondary}
                    onClick={async () => {
                      try {
                        const response = await fetch(displayUrl, {
                          method: httpMethod,
                          headers: { "Content-Type": "application/json" },
                          body:
                            httpMethod !== "GET" && httpMethod !== "HEAD"
                              ? JSON.stringify({
                                  test: true,
                                  timestamp: new Date().toISOString(),
                                })
                              : undefined,
                        });

                        if (response.ok) {
                          toast.success("Test request sent successfully!");
                        } else {
                          toast.error(
                            `Test failed: ${response.status} ${response.statusText}`
                          );
                        }
                      } catch (error) {
                        toast.error("Test request failed");
                      }
                    }}
                    disabled={!isEnabled}
                  >
                    Test
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  }
);

TriggerWebhookNode.displayName = "TriggerWebhookNode";

// -----------------------------------------------------------------------------
// 5️⃣  High‑order wrapper – inject scaffold with dynamic spec
// -----------------------------------------------------------------------------

/**
 * Memoized scaffolded component to prevent focus loss.
 */
const TriggerWebhookNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec when size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as TriggerWebhookData),
    [
      (nodeData as TriggerWebhookData).expandedSize,
      (nodeData as TriggerWebhookData).collapsedSize,
    ]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <TriggerWebhookNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default TriggerWebhookNodeWithDynamicSpec;
