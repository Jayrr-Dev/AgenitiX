/**
 * AiAgent NODE – Content‑focused, schema‑driven, type‑safe
 *
 * • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
 * • Zod schema auto‑generates type‑checked Inspector controls.
 * • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
 * • Output propagation is gated by `isActive` *and* `isEnabled` to prevent runaway loops.
 * • Code is fully commented and follows current React + TypeScript best practices.
 *
 * Keywords: ai-agent, schema-driven, type‑safe, clean‑architecture
 */

import type { NodeProps } from "@xyflow/react";
import { type ChangeEvent, memo, useCallback, useEffect, useMemo, useRef } from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { api } from "@/convex/_generated/api";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import { createSafeInitialData } from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
import { useAction } from "convex/react";
import { findEdgeByHandle, extractNodeValue } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";

// -----------------------------------------------------------------------------
// 1️⃣  Constants
// -----------------------------------------------------------------------------

/** Processing state constants for better type safety and maintainability */
const PROCESSING_STATE = {
  IDLE: "idle",
  PROCESSING: "processing", 
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ProcessingState = typeof PROCESSING_STATE[keyof typeof PROCESSING_STATE];

// -----------------------------------------------------------------------------
// 2️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const AiAgentDataSchema = z
  .object({
    // AI Model Configuration
    selectedProvider: z.enum(["openai", "anthropic", "custom"]).default("openai"),
    selectedModel: z.string().default("gpt-4o-mini"),
    customApiKey: z.string().optional(),
    customEndpoint: z.string().optional(),

    // Agent Configuration
    systemPrompt: z.string().default("You are a helpful assistant."),
    maxSteps: z.number().default(1),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().optional(),

    // Input/Output State
    inputs: z.string().nullable().default(null), // Standard inputs field for text input
    triggerInputs: z.boolean().nullable().default(null), // Standard inputs field for trigger
    userInput: z.string().nullable().default(null),
    trigger: z.boolean().nullable().default(null), // Can be null when no trigger connected
    isActive: z.boolean().nullable().default(null), // Can be null during initialization
    processingState: z.enum([PROCESSING_STATE.IDLE, PROCESSING_STATE.PROCESSING, PROCESSING_STATE.SUCCESS, PROCESSING_STATE.ERROR]).default(PROCESSING_STATE.IDLE),
    processingResult: z.string().nullable().default(null), // Store processing result
    processingError: z.string().nullable().default(null), // Store error message if any

    // Thread Management
    threadId: z.string().nullable().default(null),

    // UI State
    isEnabled: z.boolean().default(true),
    isExpanded: z.boolean().default(false),
    expandedSize: z.string().default("VE2"),
    collapsedSize: z.string().default("C2"),

    // Output
    outputs: z.string().nullable().default(null),
  })
  .passthrough();

export type AiAgentData = z.infer<typeof AiAgentDataSchema>;

const validateNodeData = createNodeValidator(AiAgentDataSchema, "AiAgent");

// -----------------------------------------------------------------------------
// 3️⃣  UI Constants  
// -----------------------------------------------------------------------------

const CATEGORY_TEXT = {
  AI: {
    primary: "text-[--node-ai-text]",
  },
} as const;

const CONTENT = {
  expanded: "p-4 w-full h-full flex flex-col",
  collapsed: "flex items-center justify-center w-full h-full",
  header: "flex items-center justify-between mb-3",
  body: "flex-1 flex items-center justify-center",
  disabled: "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
} as const;

// -----------------------------------------------------------------------------
// 3️⃣  Dynamic spec factory (pure)
// -----------------------------------------------------------------------------

/**
 * Builds a NodeSpec whose size keys can change at runtime via node data.
 */
function createDynamicSpec(data: AiAgentData): NodeSpec {
  const expanded =
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ?? EXPANDED_SIZES.FE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ?? COLLAPSED_SIZES.C2;

  return {
    kind: "aiAgent",
    displayName: "AI Agent",
    label: "AI Agent",
    category: CATEGORIES.AI,
    size: { expanded, collapsed },
    handles: [
      {
        id: "text-input",
        code: "s",
        position: "top",
        type: "target",
        dataType: "String",
      },
      {
        id: "trigger",
        code: "b",
        position: "left",
        type: "target",
        dataType: "Boolean",
      },
      {
        id: "output",
        code: "s",
        position: "right",
        type: "source",
        dataType: "String",
      },
    ],
    inspector: { key: "AiAgentInspector" },
    version: 1,
    runtime: { execute: "aiAgent_execute_v1" },
    initialData: createSafeInitialData(AiAgentDataSchema, {
      selectedProvider: "openai",
      selectedModel: "gpt-4o-mini",
      systemPrompt: "You are a helpful assistant.",
      inputs: null,
      triggerInputs: null,
      userInput: null,
      trigger: false,
      processingState: PROCESSING_STATE.IDLE,
      threadId: null,
      outputs: null,
    }),
    dataSchema: AiAgentDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "inputs",
        "triggerInputs",
        "userInput",
        "trigger",
        "processingState",
        "threadId",
        "outputs",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "selectedProvider",
          type: "select",
          label: "AI Provider",
          options: [
            { value: "openai", label: "OpenAI" },
            { value: "anthropic", label: "Anthropic" },
            { value: "custom", label: "Custom" },
          ],
        },
        { key: "selectedModel", type: "text", label: "Model" },
        {
          key: "systemPrompt",
          type: "textarea",
          label: "System Prompt",
          placeholder: "You are a helpful assistant...",
          ui: { rows: 3 },
        },
        { key: "customApiKey", type: "text", label: "API Key (BYOK)" },
        { key: "customEndpoint", type: "text", label: "Custom Endpoint" },
        {
          key: "temperature",
          type: "number",
          label: "Temperature",
          min: 0,
          max: 2,
          step: 0.1,
        },
        {
          key: "maxSteps",
          type: "number",
          label: "Max Steps",
          min: 1,
          max: 10,
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuBot",
    author: "Agenitix Team",
    description: "AiAgent node for AI and machine learning",
    feature: "ai",
    tags: ["ai", "aiAgent"],
    featureFlag: {
      flag: "test",
      fallback: true,
      disabledMessage: "This aiAgent node is currently disabled",
      hideWhenDisabled: false,
    },
    theming: {},
  };
}

/** Static spec for registry (uses default size keys) */
export const spec: NodeSpec = createDynamicSpec({
  expandedSize: "FE3",
  collapsedSize: "C2",
} as AiAgentData);

// -----------------------------------------------------------------------------
// 4️⃣  React component – data propagation & rendering
// -----------------------------------------------------------------------------

const AiAgentNode = memo(({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
    // -------------------------------------------------------------------------
    // 4.1  Sync with React‑Flow store
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);

    // -------------------------------------------------------------------------
    // 4.2  Derived state
    // -------------------------------------------------------------------------
  const {
    isExpanded,
    isEnabled,
    isActive,
    selectedProvider,
    selectedModel,
    systemPrompt,
    maxSteps,
    temperature,
    customApiKey,
    customEndpoint,
    inputs,
    triggerInputs,
    userInput,
    trigger,
    processingState,
    processingResult,
    processingError,
    threadId,
    outputs,
  } = nodeData as AiAgentData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.AI;

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

    /** Propagate output ONLY when node is active AND enabled (mirrors Create-Text behaviour) */
    const propagate = useCallback(
      (value: string | null) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ outputs: out });
        }
      },
      [isActive, isEnabled, updateNodeData]
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!isActive || !isEnabled) {
        updateNodeData({
          json: null,
          data: null,
          payload: null,
          result: null,
          response: null,
        });
      }
    }, [isActive, isEnabled, updateNodeData]);

  const processUserMessageAction = useAction(api.aiAgent.processUserMessage);
  const createThreadAction = useAction(api.aiAgent.createThread);

  /** Process with AI using Convex action */
  const processWithAI = useCallback(
    async (input: string, currentThreadId?: string): Promise<string> => {
      try {
        // Use provided thread ID or get/create one
        let activeThreadId = currentThreadId;
        if (!activeThreadId) {
          if (threadId) {
            activeThreadId = threadId;
          } else {
            // Create new thread
            activeThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            updateNodeData({ threadId: activeThreadId });
          }
        }

        // Use real Convex action
        const result = await processUserMessageAction({
          threadId: activeThreadId,
          userInput: input,
          jsonInput: null, // No longer using JSON input
          agentConfig: {
            selectedProvider,
            selectedModel,
            systemPrompt,
            maxSteps,
            temperature,
            customApiKey,
            customEndpoint,
          },
        });

        // Update thread ID if it was created
        if (result.threadId !== activeThreadId) {
          updateNodeData({ threadId: result.threadId });
        }

        return result.response;
      } catch (error) {
        console.error("AI processing error:", error);
        throw error;
      }
    },
    [systemPrompt, selectedProvider, selectedModel, maxSteps, temperature, threadId, updateNodeData]
  );



  /** Compute the latest text input from connected text-input handle */
  const computeTextInput = useCallback((): string | null => {
    const textEdge = findEdgeByHandle(edges, id, "text-input");
    if (!textEdge) return null;

    const src = nodes.find((n) => n.id === textEdge.source);
      if (!src) return null;

      // priority: outputs ➜ store ➜ whole data
    const rawInput = src.data?.outputs ?? src.data?.store ?? src.data;

    // If upstream node outputs an object with a `text` field (e.g. Create-Text),
    // extract that for a cleaner prompt.
    if (typeof rawInput === "object" && rawInput !== null && "text" in rawInput) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return String((rawInput as any).text ?? "");
    }

    return typeof rawInput === "string" ? rawInput : String(rawInput ?? "");
  }, [edges, nodes, id]);

  /**
   * Compute the latest trigger boolean from the connected handle.
   *
   * Returns null when no trigger is connected, allowing the node to distinguish
   * between "no trigger wired" vs "trigger is false".
   */

  const computeTrigger = useCallback((): boolean | null => {
    const triggerEdge = findEdgeByHandle(edges, id, "trigger");

    // No trigger connected ➜ return null (no trigger wired)
    if (!triggerEdge) return null;

    const src = nodes.find((n) => n.id === triggerEdge.source);
    if (!src) return false;

    // Derive boolean value from upstream node
    const triggerValue = src.data?.outputs ?? src.data?.store ?? src.data?.isActive ?? false;
    return Boolean(triggerValue);
    }, [edges, nodes, id]);

  /** Handle system prompt change (memoised for perf) */
  const handleSystemPromptChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
      console.log("System prompt changed:", e.target.value);
      updateNodeData({ systemPrompt: e.target.value });
    },
    [updateNodeData]
  );

  /** Handle provider selection change */
  const handleProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      console.log("Provider changed:", e.target.value);
      updateNodeData({ selectedProvider: e.target.value as "openai" | "anthropic" | "custom" });
    },
    [updateNodeData]
  );

  /** Get AI provider icon for collapsed mode with processing animation */
  const getProviderIcon = useCallback(() => {
    // Show spinning wheel when processing
    if (processingState === PROCESSING_STATE.PROCESSING) {
      return (
        <div className="animate-spin duration-1000">
          🔄
        </div>
      );
    }
    
    // Show error icon when error state
    if (processingState === PROCESSING_STATE.ERROR) {
      return "❌";
    }
    
    // Show success icon when completed
    if (processingState === PROCESSING_STATE.SUCCESS) {
      return "✅";
    }
    
    // Default provider icons
    switch (selectedProvider) {
      case "openai":
        return "🤖";
      case "anthropic":
        return "🧠";
      case "custom":
        return "⚙️";
      default:
        return "🤖";
    }
  }, [selectedProvider, processingState]);

  /** Reset thread to start fresh conversation */
  const resetThread = useCallback(() => {
    updateNodeData({
      threadId: null,
      processingState: PROCESSING_STATE.IDLE,
      processingResult: null,
      processingError: null,
      outputs: null,
    });
  }, [updateNodeData]);

  /** Validate AI agent configuration */
  const validateConfiguration = useCallback(() => {
    const errors: string[] = [];

    // Validate system prompt
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      errors.push("System prompt is required");
    } else if (systemPrompt.length > 2000) {
      errors.push("System prompt is too long (max 2000 characters)");
    }

    // Validate model selection
    if (!selectedModel || selectedModel.trim().length === 0) {
      errors.push("Model selection is required");
    }

    // Validate temperature
    if (temperature < 0 || temperature > 2) {
      errors.push("Temperature must be between 0 and 2");
    }

    // Validate max steps
    if (maxSteps < 1 || maxSteps > 10) {
      errors.push("Max steps must be between 1 and 10");
    }

    // Validate custom provider settings
    if (selectedProvider === "custom") {
      if (!customApiKey || customApiKey.trim().length === 0) {
        errors.push("API key is required for custom provider");
      }
      if (!customEndpoint || customEndpoint.trim().length === 0) {
        errors.push("Custom endpoint is required for custom provider");
      } else {
        // Validate URL format
        try {
          new URL(customEndpoint);
        } catch {
          errors.push("Custom endpoint must be a valid URL");
        }
      }
    }

    return errors;
  }, [
    systemPrompt,
    selectedModel,
    temperature,
    maxSteps,
    selectedProvider,
    customApiKey,
    customEndpoint,
  ]);

  /** Get configuration status */
  const getConfigurationStatus = useCallback(() => {
    const errors = validateConfiguration();
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [] as string[], // Could add warnings for non-critical issues
    };
  }, [validateConfiguration]);

  /** Enhanced error handling with retry logic */
  const handleProcessingError = useCallback(
    async (error: any, retryCount = 0): Promise<string> => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second

      // Classify error type
      let errorType = "unknown";
      let shouldRetry = false;
      let retryDelay = 0;

      if (error.message?.includes("rate limit")) {
        errorType = "rate_limit";
        shouldRetry = retryCount < maxRetries;
        retryDelay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      } else if (error.message?.includes("timeout")) {
        errorType = "timeout";
        shouldRetry = retryCount < maxRetries;
        retryDelay = baseDelay;
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorType = "network";
        shouldRetry = retryCount < maxRetries;
        retryDelay = baseDelay;
      } else if (error.message?.includes("auth")) {
        errorType = "authentication";
        shouldRetry = false; // Don't retry auth errors
      } else {
        errorType = "model_error";
        shouldRetry = false; // Don't retry model errors
      }

      // Log error for debugging
      console.error(`AI Agent Error (${errorType}, attempt ${retryCount + 1}):`, error);

      // If we should retry and haven't exceeded max retries
      if (shouldRetry && retryCount < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        // Retry the processing
        try {
          return await processWithAI(userInput || "", threadId || undefined);
        } catch (retryError) {
          return await handleProcessingError(retryError, retryCount + 1);
        }
      }

      // Generate user-friendly error message
      let userMessage = "";
      switch (errorType) {
        case "rate_limit":
          userMessage = "Rate limit exceeded. Please try again in a few moments.";
          break;
        case "timeout":
          userMessage = "Request timed out. Please try again.";
          break;
        case "network":
          userMessage = "Network error. Please check your connection and try again.";
          break;
        case "authentication":
          userMessage = "Authentication failed. Please check your API key.";
          break;
        case "model_error":
          userMessage = "AI model error. Please try a different prompt.";
          break;
        default:
          userMessage = `Processing failed: ${error.message}`;
      }

      throw new Error(userMessage);
    },
    [userInput, threadId, processWithAI]
    );

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
    const textInputVal = computeTextInput();
    const triggerVal = computeTrigger();

    if (textInputVal !== userInput || triggerVal !== trigger) {
      updateNodeData({
        inputs: textInputVal,
        triggerInputs: triggerVal,
        userInput: textInputVal,
        trigger: triggerVal,
      });
    }
  }, [computeTextInput, computeTrigger, userInput, trigger, updateNodeData, edges, nodes]);

    /* 🔄 Make isEnabled dependent on triggerInputs (like Create Text with boolean input) */
    useEffect(() => {
    // When triggerInputs is not null (has a connection), mirror the toggle state
    if (triggerInputs !== null) {
      const nextEnabled = Boolean(triggerInputs);
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
        }
      }
    // When triggerInputs is null (no connection), keep current isEnabled state
  }, [triggerInputs, isEnabled, updateNodeData]);

  // Monitor isEnabled and update active state (exactly like Create Text)
    useEffect(() => {
    if (isEnabled) {
      // When enabled, check if we have valid configuration
      const hasValidPrompt = systemPrompt && systemPrompt.trim().length > 0;
      const hasValidInput = userInput && userInput.trim().length > 0;
      const configStatus = getConfigurationStatus();

      // Node is active when enabled AND has valid config AND has inputs
      const nextActive = hasValidPrompt && hasValidInput && configStatus.isValid;

      if (isActive !== nextActive) {
        updateNodeData({
          isActive: nextActive,
          isProcessing: nextActive ? null : nodeData.isProcessing, // reset when going active
        });
      }
    } else if (isActive) {
      // When disabled, turn off active state
      updateNodeData({ isActive: false });
    }
  }, [systemPrompt, userInput, isEnabled, isActive, updateNodeData, getConfigurationStatus]);

  // Handle AI processing when node becomes active
  useEffect(() => {
    if (isActive && isEnabled && userInput && systemPrompt && processingState === PROCESSING_STATE.IDLE) {
      // Start AI processing
      updateNodeData({ 
        processingState: PROCESSING_STATE.PROCESSING,
        processingResult: null,
        processingError: null 
      });

      processWithAI(userInput)
        .then((response) => {
          // Processing completed successfully
          updateNodeData({
            processingState: PROCESSING_STATE.SUCCESS,
            processingResult: response,
            processingError: null,
            isActive: false, // Turn off after processing
          });
          // Ensure the final response is propagated to outputs
          propagate(response);
        })
        .catch(async (error) => {
          try {
            // Try enhanced error handling with retry logic
            const retryResult = await handleProcessingError(error);
            updateNodeData({
              processingState: typeof retryResult === "string" ? PROCESSING_STATE.SUCCESS : PROCESSING_STATE.ERROR,
              processingResult: typeof retryResult === "string" ? retryResult : null,
              processingError: typeof retryResult === "string" ? null : String(retryResult),
              isActive: false,
            });
            // Propagate error result
            propagate(typeof retryResult === "string" ? retryResult : `Error: ${String(retryResult)}`);
          } catch (finalError) {
            // All retries failed
            updateNodeData({
              processingState: PROCESSING_STATE.ERROR,
              processingResult: null,
              processingError: String(finalError),
              isActive: false,
            });
            // Propagate final error
            propagate(`Error: ${String(finalError)}`);
          }
        });
    }
  }, [isActive, isEnabled, userInput, systemPrompt, processingState, processWithAI, updateNodeData, handleProcessingError]);

  // Handle processing cancellation when isActive becomes false
  useEffect(() => {
    if (!isActive && processingState === PROCESSING_STATE.PROCESSING) {
      // Cancel ongoing processing
      updateNodeData({
        processingState: PROCESSING_STATE.ERROR,
        processingError: "Processing cancelled",
        isActive: false,
      });
    }
  }, [isActive, processingState, updateNodeData]);

  // Sync outputs with processing state
    useEffect(() => {
    let outputValue: string | null = null;

    if (processingState === PROCESSING_STATE.PROCESSING) {
      // Processing in progress
      outputValue = null;
    } else if (processingState === PROCESSING_STATE.SUCCESS && processingResult) {
      // Processing completed successfully
      outputValue = processingResult;
    } else if (processingState === PROCESSING_STATE.ERROR && processingError) {
      // Processing failed
      outputValue = `Error: ${processingError}`;
    }

    propagate(outputValue || "");
      blockJsonWhenInactive();
  }, [processingState, processingResult, processingError, propagate, blockJsonWhenInactive]);

    // -------------------------------------------------------------------------
    // 4.6  Validation
    // -------------------------------------------------------------------------
    const validation = validateNodeData(nodeData);
    if (!validation.success) {
      reportValidationError("AiAgent", id, validation.errors, {
        originalData: validation.originalData,
        component: "AiAgentNode",
      });
    }

  useNodeDataValidation(AiAgentDataSchema, "AiAgent", validation.data, id);

    // -------------------------------------------------------------------------
    // 4.7  Feature flag conditional rendering
    // -------------------------------------------------------------------------
    
    // If flag is loading, show loading state
    if (flagState.isLoading) {
      return (
        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
          Loading aiAgent feature...
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
    // 4.8  Render
    // -------------------------------------------------------------------------
    return (
      <>
        {/* Editable label or icon */}
      {!isExpanded && spec.size.collapsed.width === 60 && spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={spec.displayName} />
        )}

      {isExpanded ? (
        <div className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}>
          <div className="space-y-3">
            {/* AI Provider Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">AI Provider</label>
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderIcon()}</span>
                  <select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    className="text-xs bg-background border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="custom">Custom</option>
                  </select>
                  {(() => {
                    const configStatus = getConfigurationStatus();
                    return configStatus.isValid ? (
                      <span className="text-xs text-green-500">✓</span>
                    ) : (
                      <span className="text-xs text-red-500" title={configStatus.errors.join(", ")}>
                        ⚠️
                      </span>
                    );
                  })()}
                </div>
                <input
                  type="text"
                  value={selectedModel}
                  onChange={(e) => updateNodeData({ selectedModel: e.target.value })}
                  placeholder="Model name (e.g., gpt-4o-mini)"
                  className="text-xs bg-background border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={!isEnabled}
                />
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">System Prompt</label>
            <textarea
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                placeholder="You are a helpful assistant..."
                className={`resize-none nowheel bg-background border rounded-md p-2 text-xs h-20 w-full overflow-y-auto focus:outline-none focus:ring-1 focus:ring-blue-500 ${categoryStyles.primary}`}
                disabled={!isEnabled}
              />
            </div>

            {/* BYOK Section for Custom Provider */}
            {selectedProvider === "custom" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Custom Configuration
                </label>
                <div className="space-y-2 mt-1">
                  <input
                    type="password"
                    value={customApiKey || ""}
                    onChange={(e) => updateNodeData({ customApiKey: e.target.value })}
                    placeholder="API Key"
                    className="text-xs bg-background border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  />
                  <input
                    type="text"
                    value={customEndpoint || ""}
                    onChange={(e) => updateNodeData({ customEndpoint: e.target.value })}
                    placeholder="Custom Endpoint URL"
                    className="text-xs bg-background border rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  />
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Advanced Settings</label>
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-20">Temperature:</label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) =>
                      updateNodeData({ temperature: Number.parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    max="2"
                    step="0.1"
                    className="text-xs bg-background border rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!isEnabled}
            />
          </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-20">Max Steps:</label>
                  <input
                    type="number"
                    value={maxSteps}
                    onChange={(e) =>
                      updateNodeData({ maxSteps: Number.parseInt(e.target.value) || 1 })
                    }
                    min="1"
                    max="10"
                    className="text-xs bg-background border rounded px-2 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!isEnabled}
            />
                </div>
              </div>
            </div>

            {/* Status Display */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <div className="text-xs mt-1">
                {processingState === PROCESSING_STATE.IDLE && "Ready"}
                {processingState === PROCESSING_STATE.PROCESSING && (
                  <span className="text-blue-500 flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Processing...
                  </span>
                )}
                {processingState === PROCESSING_STATE.SUCCESS && (
                  <span className="text-green-500">✓ Complete</span>
                )}
                {processingState === PROCESSING_STATE.ERROR && (
                  <div className="space-y-1">
                    <span className="text-red-500">✗ Error: {processingError}</span>
                    <button
                      onClick={() => updateNodeData({ processingState: PROCESSING_STATE.IDLE, processingError: null, isActive: true })}
                      className="text-xs text-blue-500 hover:text-blue-700 underline block"
                      disabled={!isEnabled}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Thread Management */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Conversation</label>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-muted-foreground">
                  {threadId ? `Thread: ${threadId.substring(0, 12)}...` : "No active thread"}
                </div>
                {threadId && (
                  <button
                    onClick={resetThread}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                    disabled={!isEnabled}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Input Preview */}
            {userInput && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Input</label>
                <div className="text-xs mt-1 p-2 bg-muted rounded text-muted-foreground max-h-16 overflow-y-auto">
                  {userInput.length > 100 ? `${userInput.substring(0, 100)}...` : userInput}
                </div>
              </div>
            )}

            {/* Output Preview */}
            {outputs && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Output</label>
                <div className="text-xs mt-1 p-2 bg-muted rounded text-muted-foreground max-h-16 overflow-y-auto">
                  {outputs.length > 100 ? `${outputs.substring(0, 100)}...` : outputs}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}>
          <div className="text-2xl">{getProviderIcon()}</div>
        </div>
        )}

      <ExpandCollapseButton showUI={isExpanded} onToggle={toggleExpand} size="sm" />
      </>
    );
});

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
const AiAgentNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as AiAgentData),
    [(nodeData as AiAgentData).expandedSize, (nodeData as AiAgentData).collapsedSize]
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () => withNodeScaffold(dynamicSpec, (p) => <AiAgentNode {...p} spec={dynamicSpec} />),
    [dynamicSpec]
  );

  return <ScaffoldedNode {...props} />;
};

export default AiAgentNodeWithDynamicSpec;
