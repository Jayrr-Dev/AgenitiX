// convex/aiAgent.ts
import { v } from "convex/values";
import { action } from "./_generated/server";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "./_generated/api";

/**
 * Configuration interface for AI Agent
 */
export interface AiAgentConfig {
  selectedProvider: "openai" | "anthropic" | "custom";
  selectedModel: string;
  systemPrompt: string;
  maxSteps: number;
  temperature: number;
  customApiKey?: string;
  customEndpoint?: string;
}

/**
 * Create AI Agent with configuration
 */
export const createAiAgent = (config: AiAgentConfig) => {
  let chatModel;

  switch (config.selectedProvider) {
    case "openai":
      chatModel = openai.chat(config.selectedModel || "gpt-4o-mini", {
        apiKey: process.env.OPENAI_API_KEY,
      });
      break;
    case "anthropic":
      chatModel = anthropic.chat(config.selectedModel || "claude-3-5-sonnet-20241022", {
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      break;
    case "custom":
      if (!config.customApiKey || !config.customEndpoint) {
        throw new Error("Custom API key and endpoint are required for custom provider");
      }
      // For custom providers, we'll use OpenAI format as default
      chatModel = openai.chat(config.selectedModel || "gpt-4o-mini", {
        apiKey: config.customApiKey,
        baseURL: config.customEndpoint,
      });
      break;
    default:
      throw new Error(`Unsupported provider: ${config.selectedProvider}`);
  }

  return new Agent(components.agent, {
    chat: chatModel,
    instructions: config.systemPrompt || "You are a helpful assistant.",
    maxSteps: config.maxSteps || 1,
    maxRetries: 3,
    usageHandler: async (ctx, { usage }) => {
      // Log token usage for monitoring
      console.log("Token usage:", usage);
    },
  });
};

/**
 * Process user message through AI agent
 */
export const processUserMessage = action({
  args: {
    threadId: v.optional(v.string()),
    userInput: v.string(),
    jsonInput: v.optional(v.any()),
    agentConfig: v.object({
      selectedProvider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("custom")),
      selectedModel: v.string(),
      systemPrompt: v.string(),
      maxSteps: v.number(),
      temperature: v.number(),
      customApiKey: v.optional(v.string()),
      customEndpoint: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const agent = createAiAgent(args.agentConfig);

      let threadId = args.threadId;
      if (!threadId) {
        const { _id } = await ctx.runMutation(
          components.agent.threads.createThread,
          {
            userId: "workflow-user", // Or get from context
            title: "AI Agent Conversation",
          }
        );
        threadId = _id;
      }

      const { thread } = await agent.continueThread(ctx, { threadId });

      // Prepare the prompt with JSON context if provided
      let fullPrompt = args.userInput;
      if (args.jsonInput) {
        fullPrompt += `\n\nAdditional Context (JSON): ${JSON.stringify(args.jsonInput, null, 2)}`;
      }

      const result = await thread.generateText({
        prompt: fullPrompt,
      });

      return {
        threadId,
        response: result.text,
        usage: result.usage,
      };
    } catch (error) {
      // Log error for debugging
      console.error("AI Agent processing error:", error);

      // Re-throw with more user-friendly message if needed
      if (error.message?.includes("API key")) {
        throw new Error("Invalid API key. Please check your configuration.");
      } else if (error.message?.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      } else if (error.message?.includes("quota")) {
        throw new Error("API quota exceeded. Please check your billing.");
      }

      throw error;
    }
  },
});

/**
 * Create a new AI agent thread
 */
export const createThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { _id } = await ctx.runMutation(
      components.agent.threads.createThread,
      {
        userId: args.userId || "workflow-user",
        title: args.title || "AI Agent Conversation",
        summary: args.summary,
      }
    );
    return { threadId: _id };
  },
});

/**
 * Get thread messages
 */
export const getThreadMessages = action({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.runQuery(
      components.agent.messages.list,
      {
        threadId: args.threadId,
        limit: args.limit || 50,
      }
    );
    return messages;
  },
});