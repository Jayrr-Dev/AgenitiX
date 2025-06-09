import { BaseNodeData } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { Position } from "@xyflow/react";
import { useState } from "react";
import { z } from "zod";
import {
  defineNode,
  NodeExecutionContext,
  NodeRenderContext,
} from "../../node-creation";

// AI Processing Node - Level 4 Complex Example
interface AIProcessingData extends BaseNodeData {
  model: "gpt-4" | "claude-3" | "llama-2" | "custom";
  prompt: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;

  // Advanced AI features
  fineTuning: {
    enabled: boolean;
    dataset?: string;
    epochs: number;
  };

  multiModal: {
    enabled: boolean;
    imageInput?: string;
    audioInput?: string;
  };

  chainOfThought: {
    enabled: boolean;
    steps: string[];
  };

  // Response data
  lastResponse?: {
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    streamChunks?: string[];
    reasoning?: string[];
  };
  isProcessing: boolean;
  lastError?: string;
}

const AIProcessingSchema = z.object({
  model: z.enum(["gpt-4", "claude-3", "llama-2", "custom"]),
  prompt: z.string().min(1, "Prompt is required"),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(4000),
  streaming: z.boolean(),
});

// Mock AI processing with advanced features
async function processAIRequest(
  context: NodeExecutionContext<AIProcessingData>
): Promise<void> {
  const { data, updateNodeData, emitEvent } = context;

  updateNodeData({ isProcessing: true, lastError: undefined });
  emitEvent("ai:processing-start", { model: data.model, prompt: data.prompt });

  try {
    // Simulate AI processing with streaming
    if (data.streaming) {
      const chunks = [
        "AI",
        " response",
        " generated",
        " with",
        " advanced",
        " features.",
      ];
      let content = "";

      for (const chunk of chunks) {
        content += chunk;
        updateNodeData({
          lastResponse: {
            content,
            usage: {
              promptTokens: 100,
              completionTokens: content.length,
              totalTokens: 100 + content.length,
            },
            model: data.model,
            streamChunks: chunks.slice(0, chunks.indexOf(chunk) + 1),
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 200));
        emitEvent("ai:stream-chunk", { chunk, model: data.model });
      }
    } else {
      // Non-streaming response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      updateNodeData({
        lastResponse: {
          content:
            "Complete AI response with advanced processing capabilities.",
          usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
          model: data.model,
          reasoning: data.chainOfThought.enabled
            ? [
                "Step 1: Analyze input prompt",
                "Step 2: Generate response structure",
                "Step 3: Apply reasoning chain",
                "Step 4: Validate output",
              ]
            : undefined,
        },
        isProcessing: false,
      });
    }

    emitEvent("ai:processing-success", {
      model: data.model,
      tokensUsed: 300,
      duration: 1000,
    });
  } catch (error) {
    updateNodeData({
      lastError:
        error instanceof Error ? error.message : "AI processing failed",
      isProcessing: false,
    });

    emitEvent("ai:processing-failed", { model: data.model, error });
  }
}

export const AIProcessingNode = defineNode<AIProcessingData>({
  metadata: {
    nodeType: "aiProcessing",
    category: "transform",
    displayName: "AI Processing",
    description:
      "Advanced AI processing with streaming, multi-modal input, and chain-of-thought reasoning",
    icon: "brain",
    folder: "main",
    order: 30,
    version: "2.0.0",
    author: "V2U System",
    tags: ["ai", "llm", "processing", "advanced", "streaming"],
    experimental: true,
  },

  handles: [
    {
      id: "prompt",
      type: "target",
      position: Position.Left,
      dataType: "string",
      description: "Input prompt for AI processing",
    },
    {
      id: "image",
      type: "target",
      position: Position.Top,
      dataType: "image",
      description: "Image input for multi-modal processing",
    },
    {
      id: "response",
      type: "source",
      position: Position.Right,
      dataType: "string",
      description: "AI generated response",
    },
    {
      id: "tokens",
      type: "source",
      position: Position.Bottom,
      dataType: "object",
      description: "Token usage statistics",
    },
  ],

  defaultData: {
    model: "gpt-4",
    prompt: "Generate a creative response about the future of AI.",
    temperature: 0.7,
    maxTokens: 1000,
    streaming: true,

    fineTuning: {
      enabled: false,
      epochs: 3,
    },

    multiModal: {
      enabled: false,
    },

    chainOfThought: {
      enabled: true,
      steps: [],
    },

    isProcessing: false,
  },

  size: {
    collapsed: { width: 320, height: 160 },
    expanded: { width: 600, height: 450 },
  },

  processLogic: processAIRequest,

  lifecycle: {
    onMount: async (context) => {
      context.emitEvent("ai:node-mounted", { nodeId: context.nodeId });
    },

    onValidation: (data) => {
      try {
        AIProcessingSchema.parse(data);
        return true;
      } catch (error) {
        return error instanceof Error ? error.message : "Validation failed";
      }
    },
  },

  security: {
    requiresAuth: true,
    permissions: ["ai:process", "ai:advanced"],
    maxExecutionsPerMinute: 20,
    dataAccessLevel: "read",
  },

  performance: {
    timeout: 120000, // 2 minutes for AI processing
    maxMemoryMB: 500,
    priority: "high",
    retryAttempts: 1,
    cacheable: true,
  },

  renderCollapsed: ({ data }: NodeRenderContext<AIProcessingData>) => {
    const statusColor = data.isProcessing
      ? "text-blue-600"
      : data.lastError
        ? "text-red-600"
        : data.lastResponse
          ? "text-green-600"
          : "text-gray-600";

    return (
      <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI Processing
          </h3>
          <div className="flex items-center gap-2">
            <div className={`text-xs font-medium ${statusColor}`}>
              {data.isProcessing
                ? "Processing..."
                : data.lastError
                  ? "Error"
                  : data.lastResponse
                    ? "Complete"
                    : "Ready"}
            </div>
            <div className="text-xs bg-purple-100 text-purple-700 px-1 rounded">
              {data.model}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
          {data.prompt.slice(0, 60)}...
        </div>

        {data.streaming && data.lastResponse?.streamChunks && (
          <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-1 rounded mb-2">
            🔄 Streaming: {data.lastResponse.streamChunks.length} chunks
          </div>
        )}

        {data.isProcessing && (
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-purple-600 h-1 rounded-full animate-pulse w-1/2"></div>
          </div>
        )}

        {data.lastResponse && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✅ {data.lastResponse.usage.totalTokens} tokens used
          </div>
        )}
      </div>
    );
  },

  renderExpanded: ({
    data,
    updateNodeData,
    context,
  }: NodeRenderContext<AIProcessingData>) => {
    const [activeTab, setActiveTab] = useState<
      "prompt" | "config" | "response"
    >("prompt");

    return (
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            AI Processing
          </h3>
          <button
            onClick={() => processAIRequest(context)}
            disabled={data.isProcessing}
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {data.isProcessing ? "Processing..." : "Process"}
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-600 mb-3">
          {["prompt", "config", "response"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 text-sm capitalize ${
                activeTab === tab
                  ? "border-b-2 border-purple-500 text-purple-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "prompt" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">AI Model</label>
              <select
                value={data.model}
                onChange={(e) =>
                  updateNodeData({ model: e.target.value as any })
                }
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3">Claude 3</option>
                <option value="llama-2">Llama 2</option>
                <option value="custom">Custom Model</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <textarea
                value={data.prompt}
                onChange={(e) => updateNodeData({ prompt: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                rows={6}
                placeholder="Enter your AI prompt here..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  value={data.temperature}
                  onChange={(e) =>
                    updateNodeData({ temperature: parseFloat(e.target.value) })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={data.maxTokens}
                  onChange={(e) =>
                    updateNodeData({ maxTokens: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="1"
                  max="4000"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={data.streaming}
                    onChange={(e) =>
                      updateNodeData({ streaming: e.target.checked })
                    }
                  />
                  Streaming
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Chain of Thought</h4>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.chainOfThought.enabled}
                  onChange={(e) =>
                    updateNodeData({
                      chainOfThought: {
                        ...data.chainOfThought,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                Enable reasoning steps
              </label>
            </div>

            <div>
              <h4 className="font-medium mb-2">Multi-Modal</h4>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.multiModal.enabled}
                  onChange={(e) =>
                    updateNodeData({
                      multiModal: {
                        ...data.multiModal,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                Enable image/audio input
              </label>
            </div>

            <div>
              <h4 className="font-medium mb-2">Fine-Tuning</h4>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.fineTuning.enabled}
                  onChange={(e) =>
                    updateNodeData({
                      fineTuning: {
                        ...data.fineTuning,
                        enabled: e.target.checked,
                      },
                    })
                  }
                />
                Use fine-tuned model
              </label>
            </div>
          </div>
        )}

        {activeTab === "response" && (
          <div className="space-y-3">
            {data.lastResponse ? (
              <div>
                <div className="mb-2">
                  <strong>Response:</strong>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm max-h-40 overflow-auto">
                  {data.lastResponse.content}
                </div>

                {data.lastResponse.reasoning && (
                  <div className="mt-3">
                    <strong>Reasoning Steps:</strong>
                    <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                      {data.lastResponse.reasoning.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-600">
                  Tokens: {data.lastResponse.usage.totalTokens} | Model:{" "}
                  {data.lastResponse.model}
                </div>
              </div>
            ) : data.lastError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm text-red-700 dark:text-red-400">
                {data.lastError}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No AI response yet. Process a prompt to see results.
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

export default AIProcessingNode;
