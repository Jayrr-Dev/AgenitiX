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
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from "react";
import { z } from "zod";

import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { renderLucideIcon } from "@/features/business-logic-modern/infrastructure/node-core/iconUtils";
import {
  createSafeInitialData,
} from "@/features/business-logic-modern/infrastructure/node-core/schema-helpers";
import {
  createNodeValidator,
  reportValidationError,
  useNodeDataValidation,
} from "@/features/business-logic-modern/infrastructure/node-core/validation";
import { withNodeScaffold } from "@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold";
import { useNodeFeatureFlag } from "@/features/business-logic-modern/infrastructure/node-core/useNodeFeatureFlag";
import { CATEGORIES } from "@/features/business-logic-modern/infrastructure/theming/categories";
import {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import { useNodeData } from "@/hooks/useNodeData";
import { useStore } from "@xyflow/react";
// TODO: Uncomment after setting up Convex client
// import { useAction } from "convex/react";
// import { api } from "@/convex/_generated/api";

// -----------------------------------------------------------------------------
// 1️⃣  Data schema & validation
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
    userInput: z.string().nullable().default(null),
    jsonInput: z.any().nullable().default(null),
    isActive: z.boolean().default(false),
    isProcessing: z.any().nullable().default(null), // Promise<string> | null

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

const validateNodeData = createNodeValidator(
  AiAgentDataSchema,
  "AiAgent",
);

// -----------------------------------------------------------------------------
// 2️⃣  Constants
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
    EXPANDED_SIZES[data.expandedSize as keyof typeof EXPANDED_SIZES] ??
    EXPANDED_SIZES.FE3;
  const collapsed =
    COLLAPSED_SIZES[data.collapsedSize as keyof typeof COLLAPSED_SIZES] ??
    COLLAPSED_SIZES.C2;

  return {
    kind: "aiAgent",
    displayName: "AI Agent",
    label: "AI Agent",
    category: CATEGORIES.AI,
    size: { expanded, collapsed },
    handles: [
      {
        id: "json-input",
        code: "j",
        position: "top",
        type: "target",
        dataType: "JSON",
      },
      {
        id: "text-input",
        code: "s",
        position: "left",
        type: "target",
        dataType: "String",
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
      userInput: null,
      jsonInput: null,
      isProcessing: null,
      threadId: null,
      outputs: null,
    }),
    dataSchema: AiAgentDataSchema,
    controls: {
      autoGenerate: true,
      excludeFields: [
        "isActive",
        "userInput",
        "jsonInput",
        "isProcessing",
        "threadId",
        "outputs",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        { key: "selectedProvider", type: "select", label: "AI Provider" },
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
        { key: "temperature", type: "number", label: "Temperature" },
        { key: "maxSteps", type: "number", label: "Max Steps" },
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

const AiAgentNode = memo(
  ({ id, data, spec }: NodeProps & { spec: NodeSpec }) => {
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
      userInput,
      jsonInput,
      isProcessing,
      threadId,
      outputs
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

    /** Propagate output ONLY when node is active AND enabled */
    const propagate = useCallback(
      (value: string) => {
        const shouldSend = isActive && isEnabled;
        const out = shouldSend ? value : null;
        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ outputs: out });
        }
      },
      [isActive, isEnabled, updateNodeData],
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

    // TODO: Uncomment after setting up Convex client
    // const processUserMessageAction = useAction(api.aiAgent.processUserMessage);

    /** Process with AI using Convex action */
    const processWithAI = useCallback(async (input: string, currentThreadId?: string): Promise<string> => {
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
        
        // TODO: Replace with actual Convex action call
        // const result = await processUserMessageAction({
        //   threadId: activeThreadId,
        //   userInput: input,
        //   jsonInput: jsonInput,
        //   agentConfig: {
        //     selectedProvider,
        //     selectedModel,
        //     systemPrompt,
        //     maxSteps,
        //     temperature,
        //     customApiKey,
        //     customEndpoint,
        //   },
        // });
        // return result.response;
        
        // Mock implementation for now - simulates the Convex action
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        // Simulate different error scenarios
        if (input.toLowerCase().includes('error')) {
          throw new Error('AI processing failed');
        }
        if (input.toLowerCase().includes('timeout')) {
          throw new Error('Request timeout');
        }
        if (input.toLowerCase().includes('rate limit')) {
          throw new Error('Rate limit exceeded');
        }
        
        // Generate mock response based on provider
        let mockResponse = "";
        switch (selectedProvider) {
          case "openai":
            mockResponse = `OpenAI ${selectedModel} Response: `;
            break;
          case "anthropic":
            mockResponse = `Anthropic ${selectedModel} Response: `;
            break;
          case "custom":
            mockResponse = `Custom AI Response: `;
            break;
        }
        
        mockResponse += `[Thread: ${activeThreadId.substring(0, 12)}...] Based on your system prompt "${systemPrompt.substring(0, 50)}..." I processed your input: "${input.substring(0, 100)}..."`;
        
        if (jsonInput) {
          mockResponse += ` I also received JSON context: ${JSON.stringify(jsonInput).substring(0, 50)}...`;
        }
        
        mockResponse += ` [Temperature: ${temperature}, Max Steps: ${maxSteps}]`;
        
        return mockResponse;
      } catch (error) {
        console.error("AI processing error:", error);
        throw error;
      }
    }, [systemPrompt, jsonInput, selectedProvider, selectedModel, maxSteps, temperature, threadId, updateNodeData]);

    /** Compute the latest text input from connected text-input handle */
    const computeTextInput = useCallback((): string | null => {
      const textEdge = edges.find((e) => e.target === id && e.targetHandle === "text-input");
      if (!textEdge) return null;

      const src = nodes.find((n) => n.id === textEdge.source);
      if (!src) return null;

      // priority: outputs ➜ store ➜ whole data
      const inputValue = src.data?.outputs ?? src.data?.store ?? src.data;
      return typeof inputValue === 'string' ? inputValue : String(inputValue || '');
    }, [edges, nodes, id]);

    /** Compute the latest JSON input from connected json-input handle */
    const computeJsonInput = useCallback((): any => {
      const jsonEdge = edges.find((e) => e.target === id && e.targetHandle === "json-input");
      if (!jsonEdge) return null;

      const src = nodes.find((n) => n.id === jsonEdge.source);
      if (!src) return null;

      // Return the raw data for JSON input
      return src.data?.outputs ?? src.data?.data ?? src.data;
    }, [edges, nodes, id]);

    /** Handle system prompt change (memoised for perf) */
    const handleSystemPromptChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        updateNodeData({ systemPrompt: e.target.value });
      },
      [updateNodeData],
    );

    /** Get AI provider icon for collapsed mode */
    const getProviderIcon = useCallback(() => {
      switch (selectedProvider) {
        case "openai": return "🤖";
        case "anthropic": return "🧠";
        case "custom": return "⚙️";
        default: return "🤖";
      }
    }, [selectedProvider]);



    /** Reset thread to start fresh conversation */
    const resetThread = useCallback(() => {
      updateNodeData({ 
        threadId: null,
        isProcessing: null,
        outputs: null 
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
    }, [systemPrompt, selectedModel, temperature, maxSteps, selectedProvider, customApiKey, customEndpoint]);

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
    const handleProcessingError = useCallback(async (error: any, retryCount: number = 0): Promise<string> => {
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
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
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
    }, [userInput, threadId, processWithAI]);

    // -------------------------------------------------------------------------
    // 4.5  Effects
    // -------------------------------------------------------------------------

    /* 🔄 Whenever nodes/edges change, recompute inputs. */
    useEffect(() => {
      const textInputVal = computeTextInput();
      const jsonInputVal = computeJsonInput();

      if (textInputVal !== userInput || jsonInputVal !== jsonInput) {
        updateNodeData({
          userInput: textInputVal,
          jsonInput: jsonInputVal
        });
      }
    }, [computeTextInput, computeJsonInput, userInput, jsonInput, updateNodeData]);

    /* 🔄 Make isEnabled dependent on input value only when there are connections. */
    useEffect(() => {
      // Only auto-control isEnabled when there are text connections (userInput !== null)
      // When userInput is null (no connections), let user manually control isEnabled
      if (userInput !== null) {
        const nextEnabled = userInput && userInput.trim().length > 0;
        if (nextEnabled !== isEnabled) {
          updateNodeData({ isEnabled: nextEnabled });
        }
      }
    }, [userInput, isEnabled, updateNodeData]);

    // Monitor system prompt and user input to update active state
    useEffect(() => {
      const hasValidPrompt = systemPrompt && systemPrompt.trim().length > 0;
      const hasValidInput = userInput && userInput.trim().length > 0;
      const configStatus = getConfigurationStatus();
      const shouldBeActive = hasValidPrompt && hasValidInput && configStatus.isValid;

      // If disabled, always set isActive to false
      if (!isEnabled) {
        if (isActive) updateNodeData({ isActive: false });
      } else {
        if (isActive !== shouldBeActive) {
          updateNodeData({ isActive: shouldBeActive });
        }
      }
    }, [systemPrompt, userInput, isEnabled, isActive, updateNodeData, getConfigurationStatus]);

    // Handle AI processing when node becomes active
    useEffect(() => {
      let abortController: AbortController | null = null;
      
      if (isActive && isEnabled && userInput && systemPrompt && isProcessing === null) {
        // Create abort controller for cancellation
        abortController = new AbortController();
        
        // Start AI processing
        const processingPromise = processWithAI(userInput);
        updateNodeData({ isProcessing: processingPromise });

        processingPromise
          .then((response) => {
            // Check if processing was cancelled
            if (!abortController?.signal.aborted) {
              // Processing completed successfully
              updateNodeData({
                isProcessing: response,
                isActive: false // Turn off after processing
              });
            }
          })
          .catch(async (error) => {
            // Check if processing was cancelled
            if (!abortController?.signal.aborted) {
              try {
                // Try enhanced error handling with retry logic
                const retryResult = await handleProcessingError(error);
                updateNodeData({
                  isProcessing: retryResult,
                  isActive: false
                });
              } catch (finalError) {
                // All retries failed
                updateNodeData({
                  isProcessing: finalError,
                  isActive: false
                });
              }
            }
          });
      }
      
      // Cleanup function to cancel processing if component unmounts or isActive changes
      return () => {
        if (abortController && !abortController.signal.aborted) {
          abortController.abort();
        }
      };
    }, [isActive, isEnabled, userInput, systemPrompt, isProcessing, processWithAI, updateNodeData, handleProcessingError]);

    // Handle processing cancellation when isActive becomes false
    useEffect(() => {
      if (!isActive && isProcessing instanceof Promise) {
        // Cancel ongoing processing
        updateNodeData({ 
          isProcessing: new Error("Processing cancelled"),
          isActive: false 
        });
      }
    }, [isActive, isProcessing, updateNodeData]);

    // Sync outputs with processing state
    useEffect(() => {
      let outputValue: string | null = null;

      if (isProcessing === null) {
        // No processing
        outputValue = null;
      } else if (isProcessing instanceof Promise) {
        // Processing in progress
        outputValue = null;
      } else if (typeof isProcessing === 'string') {
        // Processing completed successfully
        outputValue = isProcessing;
      } else if (isProcessing instanceof Error) {
        // Processing failed
        outputValue = `Error: ${isProcessing.message}`;
      }

      propagate(outputValue || "");
      blockJsonWhenInactive();
    }, [isProcessing, propagate, blockJsonWhenInactive]);

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

    useNodeDataValidation(
      AiAgentDataSchema,
      "AiAgent",
      validation.data,
      id,
    );

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
        {!isExpanded &&
          spec.size.collapsed.width === 60 &&
          spec.size.collapsed.height === 60 ? (
          <div className="absolute inset-0 flex justify-center text-lg p-1 text-foreground/80">
            {spec.icon && renderLucideIcon(spec.icon, "", 16)}
          </div>
        ) : (
          <LabelNode nodeId={id} label={spec.displayName} />
        )}

        {!isExpanded ? (
          <div className={`${CONTENT.collapsed} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="text-2xl">
              {getProviderIcon()}
            </div>
            {isProcessing instanceof Promise && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            {isProcessing instanceof Error && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            )}
          </div>
        ) : (
          <div className={`${CONTENT.expanded} ${!isEnabled ? CONTENT.disabled : ''}`}>
            <div className="space-y-3">
              {/* AI Provider Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">AI Provider</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg">{getProviderIcon()}</span>
                  <span className="text-xs">{selectedProvider} - {selectedModel}</span>
                  {(() => {
                    const configStatus = getConfigurationStatus();
                    return !configStatus.isValid ? (
                      <span className="text-xs text-red-500" title={configStatus.errors.join(", ")}>
                        ⚠️
                      </span>
                    ) : (
                      <span className="text-xs text-green-500">✓</span>
                    );
                  })()}
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

              {/* Status Display */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <div className="text-xs mt-1">
                  {isProcessing === null && "Ready"}
                  {isProcessing instanceof Promise && (
                    <span className="text-blue-500 flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Processing...
                    </span>
                  )}
                  {typeof isProcessing === 'string' && (
                    <span className="text-green-500">✓ Complete</span>
                  )}
                  {isProcessing instanceof Error && (
                    <div className="space-y-1">
                      <span className="text-red-500">✗ Error: {isProcessing.message}</span>
                      <button
                        onClick={() => updateNodeData({ isProcessing: null, isActive: true })}
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
        )}

        <ExpandCollapseButton
          showUI={isExpanded}
          onToggle={toggleExpand}
          size="sm"
        />
      </>
    );
  },
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
const AiAgentNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);

  // Recompute spec only when the size keys change
  const dynamicSpec = useMemo(
    () => createDynamicSpec(nodeData as AiAgentData),
    [
      (nodeData as AiAgentData).expandedSize,
      (nodeData as AiAgentData).collapsedSize,
    ],
  );

  // Memoise the scaffolded component to keep focus
  const ScaffoldedNode = useMemo(
    () =>
      withNodeScaffold(dynamicSpec, (p) => (
        <AiAgentNode {...p} spec={dynamicSpec} />
      )),
    [dynamicSpec],
  );

  return <ScaffoldedNode {...props} />;
};

export default AiAgentNodeWithDynamicSpec;
