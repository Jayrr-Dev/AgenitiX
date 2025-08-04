/**
 * AiAgent NODE – Full Convex Agents Integration
 *
 * • Fully integrated with Convex Agents framework for robust AI processing
 * • Thread-based conversation management with automatic state persistence
 * • Supports multiple AI providers (OpenAI, Anthropic, Custom) with proper configuration
 * • Advanced error handling with retry logic and rate limiting
 * • Output propagation follows store-first pattern to prevent recursion
 * • Real-time processing state management with visual feedback
 * • Comprehensive usage tracking and monitoring
 *
 * Keywords: convex-agents, ai-agent, thread-management, error-handling, store-pattern
 */

import type { NodeProps } from "@xyflow/react";
import {
  type ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MdRefresh } from "react-icons/md";
import { z } from "zod";

import { Loading } from "@/components/Loading";
import { ExpandCollapseButton } from "@/components/nodes/ExpandCollapseButton";
import LabelNode from "@/components/nodes/labelNode";
import { ButtonIconed } from "@/components/ui/button-iconed";
import { ButtonToggle } from "@/components/ui/button-toggle";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { findEdgeByHandle } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/edgeUtils";
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

// -----------------------------------------------------------------------------
// 1️⃣  Types & Interfaces
// -----------------------------------------------------------------------------

/**
 * AI usage statistics from the model provider
 * Matches LanguageModelUsage from the AI SDK
 */
interface AiUsage {
  /** Number of tokens used in the prompt */
  promptTokens: number;
  /** Number of tokens generated in the completion */
  completionTokens: number;
  /** Total tokens used (prompt + completion) */
  totalTokens: number;
}

/**
 * Complete AI response from Convex action
 * Contains the conversation thread ID, response text, and usage statistics
 */
interface AiResponse {
  /** Unique identifier for the conversation thread */
  threadId: string;
  /** The AI-generated response text */
  response: string;
  /** Token usage statistics for this request */
  usage: AiUsage;
}

/**
 * Processed AI result with clean response and full metadata
 * Separates the response text from the complete response object
 */
interface ProcessedAiResult {
  /** Clean AI response text for output propagation */
  response: string;
  /** Complete response object with metadata for storage */
  fullResult: AiResponse;
}

// -----------------------------------------------------------------------------
// 2️⃣  Constants
// -----------------------------------------------------------------------------

/** Processing state constants for better type safety and maintainability */
const PROCESSING_STATE = {
  IDLE: "idle",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
} as const;

/** Available AI models organized by provider */
const _AI_MODELS = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Most Capable Multimodal)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cost-Effective)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-4-turbo-2024-04-09", label: "GPT-4 Turbo (2024-04-09)" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-4-0613", label: "GPT-4 (0613)" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "gpt-3.5-turbo-0125", label: "GPT-3.5 Turbo (0125)" },
    { value: "o1-preview", label: "o1-preview (Reasoning Model)" },
    { value: "o1-mini", label: "o1-mini (Small Reasoning Model)" },
  ],
  anthropic: [
    {
      value: "claude-sonnet-4-20250514",
      label: "Claude Sonnet 4 (Current - Smart & Efficient)",
    },
    { value: "claude-opus-4", label: "Claude Opus 4 (Most Capable)" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    {
      value: "claude-3-5-haiku-20241022",
      label: "Claude 3.5 Haiku (Fast & Lightweight)",
    },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Legacy)" },
  ],
  google: [
    {
      value: "gemini-2.0-flash-exp",
      label: "Gemini 2.0 Flash (Experimental - Latest)",
    },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Most Capable)" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Fast & Efficient)" },
    {
      value: "gemini-1.5-flash-8b",
      label: "Gemini 1.5 Flash 8B (Lightweight)",
    },
    { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro (Stable)" },
  ],
} as const;

/** Get default model for a provider */
const getDefaultModel = (
  provider: "openai" | "anthropic" | "google" | "custom"
): string => {
  switch (provider) {
    case "openai":
      return "gpt-3.5-turbo"; // Most widely available
    case "anthropic":
      return "claude-3-5-haiku-20241022"; // Fast and lightweight
    case "google":
      return "gemini-1.5-flash-8b"; // Cheapest and lightweight
    case "custom":
      return "gpt-3.5-turbo"; // Fallback to OpenAI format
    default:
      return "gpt-3.5-turbo";
  }
};

// -----------------------------------------------------------------------------
// 3️⃣  Data schema & validation
// -----------------------------------------------------------------------------

export const AiAgentDataSchema = z
  .object({
    // AI Model Configuration
    selectedProvider: z
      .enum(["openai", "anthropic", "google", "custom"])
      .default("google"),
    selectedModel: z.string().default("gemini-1.5-flash-8b"),
    customApiKey: z.string().optional(),
    customEndpoint: z.string().optional(),

    // Agent Configuration
    systemPrompt: z
      .string()
      .default(
        "You are a helpful assistant. When you have tools available, ALWAYS use them to get information. Use the webSearch tool for ANY information requests, including facts, current events, news, Wikipedia articles, or general knowledge. Use the calculator tool for ANY mathematical calculations. Never say you don't have access to information if you have the webSearch tool available."
      ),
    maxSteps: z.number().default(10),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().optional(),

    // Input/Output State
    inputs: z.string().nullable().default(null), // Standard inputs field for text input
    triggerInputs: z.boolean().nullable().default(null), // Standard inputs field for trigger
    toolsInput: z.string().nullable().default(null), // Tools configuration from aiTools node
    userInput: z.string().nullable().default(null),
    trigger: z.boolean().nullable().default(null), // Can be null when no trigger connected

    // Tools Configuration (parsed from toolsInput)
    enabledTools: z
      .array(
        z.object({
          type: z.string(),
          name: z.string(),
          config: z.record(z.any()),
        })
      )
      .default([]),
    isActive: z.boolean().nullable().default(null), // Can be null during initialization
    processingState: z
      .enum([
        PROCESSING_STATE.IDLE,
        PROCESSING_STATE.PROCESSING,
        PROCESSING_STATE.SUCCESS,
        PROCESSING_STATE.ERROR,
      ])
      .default(PROCESSING_STATE.IDLE),
    processingResult: z.string().nullable().default(null), // Store processing result
    processingError: z.string().nullable().default(null), // Store error message if any

    // Convex Agents Thread Management
    threadId: z.string().nullable().default(null),
    agentName: z.string().nullable().default(null), // Agent name for thread attribution

    // UI State
    isEnabled: z.boolean().default(true),
    isExpanded: z.boolean().default(false),
    expandedSize: z.string().default("VE2"),
    collapsedSize: z.string().default("C2"),
    label: z.string().optional(), // User-editable node label

    // Output (depends on store to prevent recursion)
    output: z.string().nullable().default(null),
    store: z.string().nullable().default(null), // Store full Convex Agents response as JSON string
  })
  .passthrough();

export type AiAgentData = z.infer<typeof AiAgentDataSchema>;

const validateNodeData = createNodeValidator(AiAgentDataSchema, "AiAgent");

// -----------------------------------------------------------------------------
// 4️⃣  Helper Functions
// -----------------------------------------------------------------------------

/**
 * Extract clean human-readable text from any AI response format
 * Always returns a string, never an object
 * Prioritizes actual text content over JSON serialization
 * Handles meta-description responses from Convex Agents
 */
const extractCleanText = (value: unknown): string => {
  // Handle null/undefined early
  if (value === null || value === undefined) {
    return "";
  }

  // If already a string, handle meta-description format
  if (typeof value === "string") {
    let cleanText = value.trim();

    // Handle Convex Agents meta-description format
    if (
      cleanText.includes("Based on your system") &&
      cleanText.includes("I processed your input")
    ) {
      // This is a meta-description without "Response:" prefix
      const inputMatch = cleanText.match(
        /I processed your input: "([^"]+)"(.*)/
      );
      if (inputMatch?.[2]) {
        // The actual response should be after the input processing
        const afterInput = inputMatch[2].trim();
        if (afterInput && !afterInput.includes("Based on your system")) {
          cleanText = afterInput;
        } else {
          // If no clear response after input, generate a simple response
          cleanText = `I received your input: "${inputMatch[1]}". How can I help you with that?`;
        }
      } else {
        // Fallback: generate a simple response
        cleanText = "I'm here to help! What would you like to know?";
      }
    } else if (
      cleanText.includes("Response:") &&
      cleanText.includes("Based on your system")
    ) {
      // This is a meta-description with "Response:" prefix
      const responseMatch = cleanText.match(/Response:\s*(.+?)(?:\s*\[|$)/);
      if (responseMatch?.[1]) {
        cleanText = responseMatch[1].trim();
      } else {
        // Fallback: try to get just the content after "Response:"
        const parts = cleanText.split("Response:");
        if (parts.length > 1) {
          cleanText = parts[1].split("[")[0].trim();
        }
      }
    }

    return cleanText;
  }

  // Handle objects by extracting text fields
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Try common response text fields in order of preference
    const textFields = [
      "response",
      "text",
      "content",
      "message",
      "data",
      "result",
    ];

    for (const field of textFields) {
      const fieldValue = obj[field];
      if (typeof fieldValue === "string" && fieldValue.trim()) {
        let fieldText = fieldValue.trim();

        // Check for empty/null response specifically
        if (
          field === "response" &&
          (fieldText === "" ||
            fieldText === "null" ||
            fieldText === "undefined")
        ) {
          return "Error: No response received from AI. Please try again.";
        }

        // Handle meta-description in object fields too
        if (
          fieldText.includes("Response:") &&
          fieldText.includes("Based on your system")
        ) {
          const responseMatch = fieldText.match(/Response:\s*(.+?)(?:\s*\[|$)/);
          if (responseMatch?.[1]) {
            fieldText = responseMatch[1].trim();
          } else {
            const parts = fieldText.split("Response:");
            if (parts.length > 1) {
              fieldText = parts[1].split("[")[0].trim();
            }
          }
        }

        return fieldText;
      }
    }

    // If no text field found but object has meaningful content,
    // try to extract readable parts instead of full JSON
    if (obj.choices && Array.isArray(obj.choices) && obj.choices[0]) {
      const choice = obj.choices[0] as Record<string, unknown>;
      if (typeof choice.text === "string") {
        return choice.text.trim();
      }
      if (
        choice.message &&
        typeof (choice.message as any).content === "string"
      ) {
        return ((choice.message as any).content as string).trim();
      }
    }

    // Last resort: stringify the object but only if it contains useful data
    const hasUsefulData = Object.keys(obj || {}).some(
      (key) => typeof obj[key] === "string" || typeof obj[key] === "number"
    );

    if (hasUsefulData) {
      return JSON.stringify(value);
    }

    return "";
  }

  // For numbers, booleans, etc., convert to string
  return String(value).trim();
};

// -----------------------------------------------------------------------------
// 5️⃣  UI Constants
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
  disabled:
    "opacity-75 bg-zinc-100 dark:bg-zinc-500 rounded-md transition-all duration-300",
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
    displayName: "Ai Agent",
    label: "Ai Agent",
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
        id: "tools-input",
        code: "t",
        position: "bottom",
        type: "target",
        dataType: "Tools",
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
      selectedProvider: "google",
      selectedModel: "gemini-1.5-flash-8b",
      systemPrompt: "You are a helpful assistant.",
      inputs: null,
      triggerInputs: null,
      toolsInput: null,
      userInput: null,
      trigger: false,
      processingState: PROCESSING_STATE.IDLE,
      threadId: null,
      output: null,
      store: null,
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
        "output",
        "store",
        "expandedSize",
        "collapsedSize",
      ],
      customFields: [
        { key: "isEnabled", type: "boolean", label: "Enable" },
        {
          key: "selectedProvider",
          type: "select",
          label: "AI Provider",
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
        },
        {
          key: "maxSteps",
          type: "number",
          label: "Max Steps",
        },
        { key: "isExpanded", type: "boolean", label: "Expand" },
      ],
    },
    icon: "LuBot",
    author: "Agenitix Team",
    description: "AiAgent node for Ai and machine learning",
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
    // 4.1  Sync with React‑Flow store & Modal State
    // -------------------------------------------------------------------------
    const { nodeData, updateNodeData } = useNodeData(id, data);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [threadMessages, setThreadMessages] = useState<any[]>([]);

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
      triggerInputs,
      toolsInput,
      inputs,
      userInput,
      trigger,
      processingState,
      processingError,
      threadId,
      output,
      store,
      collapsedSize,
    } = nodeData as AiAgentData;

    // 4.2  Global React‑Flow store (nodes & edges) – triggers re‑render on change
    const nodes = useStore((s) => s.nodes);
    const edges = useStore((s) => s.edges);

    // keep last emitted output to avoid redundant writes
    const lastOutputRef = useRef<string | null>(null);
    const lastStoreRef = useRef<string | null>(null);

    const categoryStyles = CATEGORY_TEXT.AI;

    // Memoized message processing - moved to top level to follow Rules of Hooks
    const processedMessages = useMemo(() => {
      // Only process if we have messages
      if (threadMessages.length === 0) {
        return null;
      }

      return threadMessages
        .sort((a, b) => a._creationTime - b._creationTime)
        .map((message, index) => {
          // Determine if this is a user message or AI message
          const isUserMessage =
            message.message?.role === "user" ||
            message.message?.role === "human" ||
            message.role === "user" ||
            message.role === "human";

          // Extract content once and memoize
          const messageContent = message.message?.content;
          let displayContent = "No content available";

          if (typeof messageContent === "string") {
            displayContent = messageContent;
          } else if (typeof messageContent === "object" && messageContent) {
            if (typeof messageContent.text === "string") {
              displayContent = messageContent.text;
            } else if (
              Array.isArray(messageContent) &&
              messageContent.length > 0
            ) {
              displayContent = messageContent
                .map((item: any) =>
                  typeof item === "string"
                    ? item
                    : item?.text || JSON.stringify(item)
                )
                .join(" ");
            } else {
              displayContent = JSON.stringify(messageContent);
            }
          } else {
            displayContent =
              message.text || message.message?.text || "No content available";
          }

          return (
            <div
              key={`${message._id || `${isUserMessage ? "user" : "ai"}-${index}`}`}
              className={`flex flex-col ${isUserMessage ? "items-start" : "items-end"}`}
            >
              {/* Message Label */}
              <div
                className={`text-xs text-muted-foreground mb-1 px-2 ${
                  isUserMessage ? "text-left" : "text-right"
                }`}
              >
                {isUserMessage ? "You" : "AI"}
              </div>
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[10px] ${
                  isUserMessage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {displayContent}
                </div>
                {message.timestamp && (
                  <div
                    className={`text-xs mt-1 opacity-70 ${
                      isUserMessage ? "text-blue-100" : "text-gray-300"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        });
    }, [threadMessages]);

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

    /** Propagate output when node is enabled and has completed processing */
    const propagate = useCallback(
      (value: unknown, forcePropagate = false) => {
        // Always extract clean text from the store, never propagate objects
        const cleanText = extractCleanText(value);

        const shouldSend =
          forcePropagate ||
          (isEnabled &&
            (processingState === PROCESSING_STATE.SUCCESS ||
              processingState === PROCESSING_STATE.ERROR));

        const out = shouldSend ? cleanText : null;

        if (out !== lastOutputRef.current) {
          lastOutputRef.current = out;
          updateNodeData({ output: out });
        }
      },
      [isEnabled, processingState, updateNodeData]
    );

    /** Clear JSON‑ish fields when inactive or disabled */
    const blockJsonWhenInactive = useCallback(() => {
      if (!(isActive && isEnabled)) {
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
    const getThreadMessagesAction = useAction(api.aiAgent.getThreadMessages);
    const validateConfigurationAction = useAction(
      api.aiAgent.validateConfiguration
    );

    /** Process with AI using Convex Agents */
    const processWithAI = useCallback(
      async (
        input: string,
        currentThreadId?: string
      ): Promise<ProcessedAiResult> => {
        try {
          // Use existing thread ID or create a new one
          let activeThreadId = currentThreadId || threadId;

          // If no valid thread ID, create a new thread
          if (activeThreadId) {
            console.log("Using existing thread:", activeThreadId);
          } else {
            console.log("Creating new thread for conversation");
            const threadResult = await createThreadAction({
              userId: "workflow-user",
              title: `AI Conversation - ${selectedProvider}`,
            });
            activeThreadId = threadResult.threadId;

            // Update node data with the new thread ID for persistence
            updateNodeData({
              threadId: activeThreadId,
              agentName: `Ai Agent (${selectedProvider})`,
            });
          }

          // Use Convex Agents action with proper configuration
          const result = await processUserMessageAction({
            threadId: activeThreadId,
            userInput: input,
            agentConfig: {
              selectedProvider,
              selectedModel,
              systemPrompt,
              maxSteps,
              temperature,
              customApiKey,
              customEndpoint,
              enabledTools: (nodeData as AiAgentData).enabledTools,
            },
          });

          // Update thread ID if it changed (for new threads)
          if (result.threadId !== activeThreadId) {
            updateNodeData({ threadId: result.threadId });
          }

          // Extract clean response text from the result using our improved function
          const cleanResponseText = extractCleanText(result.text);

          const processedResult: ProcessedAiResult = {
            response: cleanResponseText,
            fullResult: {
              threadId: result.threadId || activeThreadId || "",
              response: cleanResponseText,
              usage: result.usage as AiUsage,
            },
          };

          return processedResult;
        } catch (error) {
          console.error("Convex Agents processing error:", error);
          throw error;
        }
      },
      [
        systemPrompt,
        selectedProvider,
        selectedModel,
        maxSteps,
        temperature,
        threadId,
        updateNodeData,
        createThreadAction,
        processUserMessageAction,
        (nodeData as AiAgentData).enabledTools,
      ]
    );

    /** Compute the latest text input from connected text-input handle */
    const computeTextInput = useCallback((): string | null => {
      const textEdge = findEdgeByHandle(edges, id, "text-input");
      if (!textEdge) {
        return null;
      }

      const src = nodes.find((n) => n.id === textEdge.source);
      if (!src) {
        return null;
      }

      // priority: output ➜ store ➜ whole data
      const rawInput = src.data?.output ?? src.data?.store ?? src.data;

      // If upstream node output an object with a `text` field (e.g. Create-Text),
      // extract that for a cleaner prompt.
      if (
        typeof rawInput === "object" &&
        rawInput !== null &&
        "text" in rawInput
      ) {
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
      if (!triggerEdge) {
        return null;
      }

      const src = nodes.find((n) => n.id === triggerEdge.source);
      if (!src) {
        return false;
      }

      // Derive boolean value from upstream node
      const triggerValue =
        src.data?.output ?? src.data?.store ?? src.data?.isActive ?? false;
      return Boolean(triggerValue);
    }, [edges, nodes, id]);

    /** Compute the latest tools configuration from connected tools-input handle */
    const computeToolsInput = useCallback((): string | null => {
      const toolsEdge = findEdgeByHandle(edges, id, "tools-input");
      if (!toolsEdge) {
        return null;
      }

      const src = nodes.find((n) => n.id === toolsEdge.source);
      if (!src) {
        return null;
      }

      // priority: toolsOutput ➜ output ➜ store ➜ whole data
      const rawInput =
        src.data?.toolsOutput ??
        src.data?.output ??
        src.data?.store ??
        src.data;
      return typeof rawInput === "string" ? rawInput : String(rawInput ?? "");
    }, [edges, nodes, id]);

    /** Handle system prompt change (memoised for perf) */
    const handleSystemPromptChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        console.log("System prompt changed:", e.target.value);
        updateNodeData({ systemPrompt: e.target.value });
      },
      [updateNodeData]
    );

    /** Get the provider for a given model */
    const getProviderForModel = useCallback(
      (model: string): "openai" | "anthropic" | "google" | "custom" => {
        // Google Gemini models
        if (model.startsWith("gemini-")) {
          return "google";
        }

        // OpenAI models
        if (model.startsWith("gpt-") || model.startsWith("o1-")) {
          return "openai";
        }

        // Anthropic models
        if (model.startsWith("claude-")) {
          return "anthropic";
        }

        // Default to current provider if unknown
        return selectedProvider;
      },
      [selectedProvider]
    );

    /** Handle provider selection change */
    const handleProviderChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as
          | "openai"
          | "anthropic"
          | "google"
          | "custom";
        const defaultModel = getDefaultModel(newProvider);
        console.log(
          "Provider changed:",
          newProvider,
          "defaultModel:",
          defaultModel
        );
        updateNodeData({
          selectedProvider: newProvider,
          selectedModel: defaultModel,
        });
      },
      [updateNodeData]
    );

    /** Handle model selection change with automatic provider switching */
    const handleModelChange = useCallback(
      (e: ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        const requiredProvider = getProviderForModel(newModel);

        // Only update provider if it's different from current
        if (requiredProvider !== selectedProvider) {
          console.log(
            "Auto-switching provider:",
            selectedProvider,
            "→",
            requiredProvider,
            "for model:",
            newModel
          );
          updateNodeData({
            selectedProvider: requiredProvider,
            selectedModel: newModel,
          });
        } else {
          updateNodeData({ selectedModel: newModel });
        }
      },
      [selectedProvider, updateNodeData, getProviderForModel]
    );

    /** Get AI provider icon for collapsed mode with processing animation */
    const getProviderIcon = useCallback(() => {
      // Show spinning wheel when processing
      if (processingState === PROCESSING_STATE.PROCESSING) {
        return <Loading showText={false} size="w-5 h-5" className="p-0" />;
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
        case "google":
          return "💎";
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
        agentName: null,
        processingResult: null,
        processingError: null,
        output: null,
        store: null,
      });
    }, [updateNodeData]);

    /** View thread history - memoized to prevent unnecessary calls */
    const viewThreadHistory = useCallback(async () => {
      if (!threadId) return;

      try {
        const result = await getThreadMessagesAction({
          threadId,
          limit: 50,
        });
        const messages = result?.page || result || [];
        setThreadMessages(Array.isArray(messages) ? messages : []);
        setShowHistoryModal(true);
      } catch (error) {
        console.error("Failed to get thread history:", error);
        setThreadMessages([]);
        setShowHistoryModal(true);
      }
    }, [threadId, getThreadMessagesAction]);

    /** Check API configuration */
    const _checkApiConfiguration = useCallback(async () => {
      try {
        const result = await validateConfigurationAction({
          provider: selectedProvider as "openai" | "anthropic" | "google",
          model: selectedModel,
          customApiKey,
        });

        if (result.success) {
          console.log("✅ API Configuration Valid:", result);
          const successMessage = `✅ API Configuration Valid\n\nProvider: ${selectedProvider}\nModel: ${result.model}\nTest Response: ${result.testResponse}`;

          // Update node data to show success in output
          updateNodeData({
            processingState: PROCESSING_STATE.SUCCESS,
            processingResult: successMessage,
            processingError: null,
            store: JSON.stringify({
              success: true,
              message: result.message,
              provider: selectedProvider,
              model: result.model,
              testResponse: result.testResponse,
            }),
            isActive: false,
          });
          // Also show alert for immediate feedback
          alert(successMessage);
        } else {
          console.error("❌ API Configuration Invalid:", result);
          const errorMessage = `❌ Configuration Error\n\n${result.error}\n\n${result.details}`;

          // Update node data to show error in output
          updateNodeData({
            processingState: PROCESSING_STATE.ERROR,
            processingResult: null,
            processingError: errorMessage,
            store: JSON.stringify({
              success: false,
              error: result.error,
              details: result.details,
              provider: result.provider,
            }),
            isActive: false,
          });
          // Also show alert for immediate feedback
          alert(errorMessage);
        }
      } catch (error: any) {
        console.error("❌ API Configuration Check Error:", error);
        const errorMessage = `❌ Configuration Check Failed\n\nError: ${error?.message || error}\n\nThis usually means:\n• API keys not configured in Convex environment\n• Network issues\n• Invalid model name\n• Provider service issues`;

        // Update node data to show error in output
        updateNodeData({
          processingState: PROCESSING_STATE.ERROR,
          processingResult: null,
          processingError: errorMessage,
          store: JSON.stringify({
            success: false,
            error: error?.message || error,
            details: error?.toString(),
          }),
          isActive: false,
        });
        // Also show alert for immediate feedback
        alert(errorMessage);
      }
    }, [
      selectedProvider,
      selectedModel,
      customApiKey,
      validateConfigurationAction,
      updateNodeData,
    ]);

    /** Validate Ai agent configuration */
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
          retryDelay = baseDelay * 2 ** retryCount; // Exponential backoff
        } else if (error.message?.includes("timeout")) {
          errorType = "timeout";
          shouldRetry = retryCount < maxRetries;
          retryDelay = baseDelay;
        } else if (
          error.message?.includes("network") ||
          error.message?.includes("fetch")
        ) {
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
        console.error(
          `Ai Agent Error (${errorType}, attempt ${retryCount + 1}):`,
          error
        );

        // If we should retry and haven't exceeded max retries
        if (shouldRetry && retryCount < maxRetries) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Retry the processing
          try {
            const result = await processWithAI(
              userInput || "",
              threadId || undefined
            );
            return result.response;
          } catch (retryError) {
            return await handleProcessingError(retryError, retryCount + 1);
          }
        }

        // Generate user-friendly error message
        let userMessage = "";
        switch (errorType) {
          case "rate_limit":
            userMessage =
              "Rate limit exceeded. Please try again in a few moments.";
            break;
          case "timeout":
            userMessage = "Request timed out. Please try again.";
            break;
          case "network":
            userMessage =
              "Network error. Please check your connection and try again.";
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
      const toolsInputVal = computeToolsInput();

      if (
        textInputVal !== userInput ||
        triggerVal !== trigger ||
        toolsInputVal !== toolsInput
      ) {
        // Parse tools configuration if available
        let parsedTools: any[] = [];
        if (toolsInputVal) {
          try {
            const toolsConfig = JSON.parse(toolsInputVal);
            parsedTools = toolsConfig.enabledTools || [];
          } catch (error) {
            console.warn("Failed to parse tools configuration:", error);
            parsedTools = [];
          }
        }

        // Sync upstream handles; keep manual userInput independent
        updateNodeData({
          inputs: textInputVal,
          triggerInputs: triggerVal,
          toolsInput: toolsInputVal,
          trigger: triggerVal,
          enabledTools: parsedTools,
        });
      }
    }, [
      computeTextInput,
      computeTrigger,
      computeToolsInput,
      userInput,
      trigger,
      toolsInput,
      updateNodeData,
      edges,
      nodes,
    ]);

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
        const hasValidInput =
          (userInput && userInput.trim().length > 0) ||
          (inputs && typeof inputs === "string" && inputs.trim().length > 0);
        const configStatus = getConfigurationStatus();

        // Node is active when enabled AND has valid config AND has inputs
        const nextActive =
          hasValidPrompt && hasValidInput && configStatus.isValid;

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
    }, [
      systemPrompt,
      userInput,
      isEnabled,
      isActive,
      updateNodeData,
      getConfigurationStatus,
    ]);

    // Handle AI processing when node becomes active OR when enabled is toggled on
    useEffect(() => {
      const combinedInput =
        userInput && userInput.trim().length > 0 ? userInput : inputs;
      const shouldProcess =
        isEnabled &&
        combinedInput &&
        systemPrompt &&
        processingState === PROCESSING_STATE.IDLE &&
        isActive; // Only process when explicitly active

      if (shouldProcess) {
        console.log("Starting AI processing with input:", combinedInput);

        // Start AI processing
        updateNodeData({
          processingState: PROCESSING_STATE.PROCESSING,
          processingResult: null,
          processingError: null,
        });

        processWithAI(combinedInput)
          .then((result) => {
            console.log("AI processing completed successfully:", result);

            // Processing completed successfully - extract clean human-readable text
            const cleanResponse = extractCleanText(result.response);
            const fullResultJson = JSON.stringify(result.fullResult, null, 2);

            // Ensure cleanResponse is not empty or null
            const safeCleanResponse = cleanResponse || "No response received";

            updateNodeData({
              processingState: PROCESSING_STATE.SUCCESS,
              processingResult: safeCleanResponse,
              processingError: null,
              store: fullResultJson, // Store full response object
              isActive: false, // Turn off after processing
            });

            // Ensure only the clean AI response is propagated
            propagate(safeCleanResponse, true);
          })
          .catch(async (error) => {
            console.error("AI processing error:", error);

            // Check if this is a model failure (meta-description error)
            const isModelFailure =
              error.message?.includes("AI Model Failure") ||
              error.message?.includes("meta-description");

            if (isModelFailure) {
              // This is a model failure - don't retry, show specific error
              const modelErrorMessage = `❌ AI Model Not Working\n\n${error.message}\n\nThe AI model "${selectedModel}" is not responding properly.\n\nPlease check:\n• Model name is correct\n• API keys are valid\n• Provider is accessible`;

              updateNodeData({
                processingState: PROCESSING_STATE.ERROR,
                processingResult: null,
                processingError: modelErrorMessage,
                store: JSON.stringify({
                  error: "Model Failure",
                  details: error.message,
                  model: selectedModel,
                  provider: selectedProvider,
                }),
                isActive: false,
              });
              // Propagate model error
              propagate(modelErrorMessage, true);
              return;
            }

            try {
              // Try enhanced error handling with retry logic for other errors
              const retryResult = await handleProcessingError(error);
              const isSuccess = typeof retryResult === "string";
              const errorMessage = isSuccess
                ? null
                : `❌ AI Processing Error\n\nError: ${String(retryResult)}\n\nThis could be due to:\n• API key issues\n• Network problems\n• Rate limiting\n• Invalid configuration`;

              updateNodeData({
                processingState: isSuccess
                  ? PROCESSING_STATE.SUCCESS
                  : PROCESSING_STATE.ERROR,
                processingResult: isSuccess ? retryResult : null,
                processingError: errorMessage,
                store: isSuccess
                  ? JSON.stringify({ response: retryResult, error: false })
                  : JSON.stringify({ error: String(retryResult) }),
                isActive: false,
              });
              // Propagate error result
              propagate(isSuccess ? retryResult : errorMessage, true);
            } catch (finalError) {
              console.error("All retries failed:", finalError);

              // All retries failed
              const finalErrorMessage = `❌ AI Processing Failed\n\nError: ${String(finalError)}\n\nAll retry attempts failed. Please check:\n• API keys configuration\n• Network connection\n• AI provider status`;

              updateNodeData({
                processingState: PROCESSING_STATE.ERROR,
                processingResult: null,
                processingError: finalErrorMessage,
                store: JSON.stringify({ error: String(finalError) }),
                isActive: false,
              });
              // Propagate final error
              propagate(finalErrorMessage, true);
            }
          });
      }
    }, [
      isActive,
      isEnabled,
      userInput,
      systemPrompt,
      processingState,
      processWithAI,
      updateNodeData,
      handleProcessingError,
    ]);

    // Handle re-evaluation when isEnabled is toggled on/off
    useEffect(() => {
      if (
        isEnabled &&
        userInput &&
        systemPrompt &&
        processingState === PROCESSING_STATE.IDLE
      ) {
        // Only activate if we have all required inputs and are in idle state
        console.log("Activating Ai Agent for processing");
        updateNodeData({
          isActive: true, // Activate to trigger processing
        });
      } else if (!isEnabled) {
        // Clear output when disabled
        console.log("Disabling Ai Agent");
        updateNodeData({
          output: null,
          isActive: false,
          processingState: PROCESSING_STATE.IDLE,
        });
      }
    }, [isEnabled, userInput, systemPrompt, processingState, updateNodeData]);

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

    // Sync output with processing state - output depend on store
    useEffect(() => {
      let outputValue: string | null = null;

      if (processingState === PROCESSING_STATE.PROCESSING) {
        // Processing in progress
        outputValue = null;
      } else if (processingState === PROCESSING_STATE.SUCCESS && store) {
        // Processing completed successfully - extract clean text from store JSON
        try {
          const storeObj = JSON.parse(store);

          // Check for null/empty response specifically
          if (
            storeObj.response === "" ||
            storeObj.response === null ||
            storeObj.response === undefined
          ) {
            outputValue =
              "Error: No response received from AI. Please try again.";
          } else {
            // Try to get the response field first, then fallback to extractCleanText
            outputValue =
              storeObj.response ||
              extractCleanText(storeObj) ||
              extractCleanText(store);
          }
        } catch {
          // Fallback if store is not valid JSON
          outputValue = extractCleanText(store);
        }
      } else if (
        processingState === PROCESSING_STATE.ERROR &&
        processingError
      ) {
        // Processing failed
        outputValue = `Error: ${processingError}`;
      }

      // Only update if store has changed to avoid recursion
      if (store !== lastStoreRef.current) {
        lastStoreRef.current = store;
        propagate(outputValue || "");
      }
      blockJsonWhenInactive();
    }, [
      processingState,
      store,
      processingError,
      propagate,
      blockJsonWhenInactive,
    ]);

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
      // For small collapsed sizes (C1, C1W), hide text and center better
      const isSmallNode =
        !isExpanded && (collapsedSize === "C1" || collapsedSize === "C1W");

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
        {/* History Side Panel */}
        {showHistoryModal && (
          <div
            className="absolute left-full top-0 ml-4 bg-background border border-border rounded-lg shadow-xl w-80 max-h-96 flex flex-col z-50"
            style={{ minHeight: "240px" }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getProviderIcon()}</span>
                <h3 className="font-medium text-sm">History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent nowheel">
              {threadMessages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No messages yet.
                </div>
              ) : (
                processedMessages
              )}
            </div>
          </div>
        )}
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
            label={(nodeData as AiAgentData).label || spec.displayName}
          />
        )}

        {isExpanded ? (
          <div
            className={`${CONTENT.expanded} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className="space-y-2">
              {/* Header with Provider & Status */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1">
                    {(() => {
                      const configStatus = getConfigurationStatus();
                      return configStatus.isValid ? (
                        <span className="text-xs text-green-500">
                          {getProviderIcon()}
                        </span>
                      ) : (
                        <span
                          className="text-xs text-red-500"
                          title={configStatus.errors.join(", ")}
                        >
                          ⚠️
                        </span>
                      );
                    })()}
                  </div>
                  <select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    className="text-xs bg-background border rounded px-1 py-0.5 flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google Gemini</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Model Selection - Compact */}
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="text-xs bg-background border rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={!isEnabled}
              >
                <optgroup label="Google Gemini">
                  <option value="gemini-2.0-flash-exp">
                    Gemini 2.0 Flash (Experimental)
                  </option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-flash-8b">
                    Gemini 1.5 Flash 8B (Cheap)
                  </option>
                  <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="o1-preview">o1-preview</option>
                  <option value="o1-mini">o1-mini</option>
                </optgroup>
                <optgroup label="Claude">
                  <option value="claude-sonnet-4-20250514">
                    Claude Sonnet 4
                  </option>
                  <option value="claude-opus-4">Claude Opus 4</option>
                  <option value="claude-3-5-sonnet-20241022">
                    Claude 3.5 Sonnet
                  </option>
                  <option value="claude-3-5-haiku-20241022">
                    Claude 3.5 Haiku
                  </option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                </optgroup>
              </select>

              {/* System Prompt - Compact */}
              <div>
                <label
                  htmlFor="ai-system-prompt"
                  className="text-xs font-medium text-muted-foreground mb-0.5 block"
                >
                  System Prompt
                </label>
                <Textarea
                  id="ai-system-prompt"
                  value={systemPrompt}
                  onChange={handleSystemPromptChange}
                  placeholder="You are a helpful assistant..."
                  className={`resize-none nowheel bg-background p-1.5 text-xs h-12 w-full overflow-y-auto ${categoryStyles.primary}`}
                  disabled={!isEnabled}
                />
              </div>

              {/* Settings Row - Compact horizontal layout */}
              <div
                className="flex items-center gap-2"
                style={{ fontSize: "10px" }}
              >
                <div className="flex items-center gap-1">
                  <label
                    htmlFor="ai-temperature"
                    className="text-muted-foreground"
                    style={{ fontSize: "10px" }}
                  >
                    Temp:
                  </label>
                  <input
                    id="ai-temperature"
                    type="text"
                    value={temperature}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = Number.parseFloat(value);
                      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
                        updateNodeData({ temperature: parsed });
                      } else if (value === "" || value === ".") {
                        // Allow empty or just decimal point for typing
                        updateNodeData({ temperature: 0 });
                      }
                    }}
                    placeholder="0.7"
                    className="bg-background border rounded px-1 py-0.5 w-8 h-6 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontSize: "10px" }}
                    disabled={!isEnabled}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label
                    htmlFor="ai-max-steps"
                    className="text-muted-foreground"
                    style={{ fontSize: "10px" }}
                  >
                    Steps:
                  </label>
                  <input
                    id="ai-max-steps"
                    type="text"
                    value={maxSteps}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsed = Number.parseInt(value);
                      if (
                        !Number.isNaN(parsed) &&
                        parsed >= 1 &&
                        parsed <= 10
                      ) {
                        updateNodeData({ maxSteps: parsed });
                      } else if (value === "") {
                        // Allow empty for typing
                        updateNodeData({ maxSteps: 1 });
                      }
                    }}
                    placeholder="10"
                    className="bg-background border rounded px-1 py-0.5 w-8 h-6 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ fontSize: "10px" }}
                    disabled={!isEnabled}
                  />
                </div>
              </div>

              {/* BYOK Section for Custom Provider */}
              {selectedProvider === "custom" && (
                <div className="space-y-1">
                  <input
                    type="password"
                    value={customApiKey || ""}
                    onChange={(e) =>
                      updateNodeData({ customApiKey: e.target.value })
                    }
                    placeholder="API Key"
                    className="text-xs bg-background border rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  />
                  <input
                    type="text"
                    value={customEndpoint || ""}
                    onChange={(e) =>
                      updateNodeData({ customEndpoint: e.target.value })
                    }
                    placeholder="Custom Endpoint URL"
                    className="text-xs bg-background border rounded px-1 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isEnabled}
                  />
                </div>
              )}

              {/* Status & Actions - Compact Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  {processingState === PROCESSING_STATE.ERROR && (
                    <button
                      type="button"
                      onClick={() =>
                        updateNodeData({
                          processingState: PROCESSING_STATE.IDLE,
                          processingError: null,
                          isActive: true,
                        })
                      }
                      className="text-blue-500 hover:text-blue-700 underline text-xs"
                      disabled={!isEnabled}
                    >
                      Retry
                    </button>
                  )}
                  {threadId && (
                    <>
                      <ButtonToggle
                        isActive={showHistoryModal}
                        initialText="Chat"
                        activeText="Close"
                        className="bg-green-500 text-black"
                        variant="outline"
                        size="xs"
                        width="xs"
                        onToggle={(isActive) => {
                          if (isActive) {
                            viewThreadHistory();
                          } else {
                            setShowHistoryModal(false);
                          }
                        }}
                        disabled={!isEnabled}
                      />
                      <ButtonIconed
                        icon={MdRefresh as React.ComponentType<any>}
                        text="Reset"
                        variant="outline"
                        className="bg-red-500 text-black"
                        size="xs"
                        width="xs"
                        onClick={resetThread}
                        disabled={!isEnabled}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="space-y-2">
                {/* Message Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={userInput || ""}
                    onChange={(e) => {
                      console.log("Input change:", e.target.value);
                      updateNodeData({ userInput: e.target.value });
                    }}
                    placeholder={isActive ? "Message" : "Inactive"}
                    className="w-full pr-8 pl-2 py-1.5 text-xs bg-background border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={false}
                    readOnly={false}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          userInput?.trim() &&
                          isEnabled &&
                          processingState !== PROCESSING_STATE.PROCESSING
                        ) {
                          updateNodeData({
                            isActive: true,
                            processingState: PROCESSING_STATE.IDLE,
                          });
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        userInput?.trim() &&
                        isEnabled &&
                        processingState !== PROCESSING_STATE.PROCESSING
                      ) {
                        updateNodeData({
                          isActive: true,
                          processingState: PROCESSING_STATE.IDLE,
                        });
                      }
                    }}
                    disabled={
                      !userInput?.trim() ||
                      processingState === PROCESSING_STATE.PROCESSING
                    }
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </div>

                {/* AI Response Preview */}
                {output && (
                  <div className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <span className="text-muted-foreground block mb-1">
                      AI Response:
                    </span>
                    <span className="font-mono text-foreground">
                      {output.length > 100
                        ? `${output.substring(0, 100)}...`
                        : output}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Details - Only if error */}
              {processingState === PROCESSING_STATE.ERROR &&
                processingError && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-1.5 rounded border">
                    {processingError.length > 80
                      ? `${processingError.substring(0, 80)}...`
                      : processingError}
                  </div>
                )}
            </div>
          </div>
        ) : (
          <div
            className={`${CONTENT.collapsed} ${isEnabled ? "" : CONTENT.disabled}`}
          >
            <div className="text-2xl">{getProviderIcon()}</div>
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
  (prevProps, nextProps) => {
    // Custom memo comparison - only re-render if essential props change
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.spec?.displayName === nextProps.spec?.displayName
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
const AiAgentNodeWithDynamicSpec = memo(
  (props: NodeProps) => {
    const { nodeData } = useNodeData(props.id, props.data);

    // Recompute spec only when the size keys change
    const dynamicSpec = useMemo(
      () => createDynamicSpec(nodeData as AiAgentData),
      [
        (nodeData as AiAgentData).expandedSize,
        (nodeData as AiAgentData).collapsedSize,
      ]
    );

    // Memoise the scaffolded component to keep focus
    const ScaffoldedNode = useMemo(
      () =>
        withNodeScaffold(dynamicSpec, (p) => (
          <AiAgentNode {...p} spec={dynamicSpec} />
        )),
      [dynamicSpec]
    );

    return <ScaffoldedNode {...props} />;
  },
  (prevProps, nextProps) => {
    // Re-render when essential props change, including selection state for proper glow effects
    return (
      prevProps.id === nextProps.id &&
      prevProps.data === nextProps.data &&
      prevProps.selected === nextProps.selected
    );
  }
);

export default AiAgentNodeWithDynamicSpec;
