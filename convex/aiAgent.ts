// File: convex/aiAgent.ts
// Convex actions – now with typed helpers and shared retry logic.

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { components } from "./_generated/api";

/* -------------------------------------------------------------------------- */
/*  1. Types                                                                  */
/* -------------------------------------------------------------------------- */

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiAgentMessage {
  threadId: string;
  text: string;
  usage: AiUsage;
}

/* -------------------------------------------------------------------------- */
/*  2. helpers                                                                */
/* -------------------------------------------------------------------------- */

interface AiAgentConfig {
  selectedProvider: "openai" | "anthropic" | "google" | "custom";
  selectedModel: string;
  systemPrompt: string;
  maxSteps: number;
  temperature: number;
  customApiKey?: string;
  customEndpoint?: string;
}

const getChatModel = (cfg: AiAgentConfig, ctx?: any) => {
  switch (cfg.selectedProvider) {
    case "openai":
      // Use custom API key if provided
      if (cfg.customApiKey) {
        // Note: Custom API keys need to be set via environment or passed differently
        // For now, we'll use the environment key
        console.log("Using custom OpenAI key (via environment)");
      }
      return openai.chat(cfg.selectedModel);
    case "anthropic":
      // Use custom API key if provided
      if (cfg.customApiKey) {
        // Note: Custom API keys need to be set via environment or passed differently
        // For now, we'll use the environment key
        console.log("Using custom Anthropic key (via environment)");
      }
      return anthropic.chat(cfg.selectedModel);
    case "google":
      // Use custom API key if provided
      if (cfg.customApiKey) {
        // Note: Custom API keys need to be set via environment or passed differently
        // For now, we'll use the environment key
        console.log("Using custom Google key (via environment)");
      }
      return google.chat(cfg.selectedModel);
    case "custom":
      // For custom provider, require API key
      if (!cfg.customApiKey) {
        throw new Error("Custom provider requires API key - please set it via Convex environment variables");
      }
      return openai.chat(cfg.selectedModel);
    default:
      throw new Error(`Unsupported provider: ${cfg.selectedProvider}`);
  }
};

const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  attempts = 3,
  base = 1_000,
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    if (attempts <= 1) throw err;
    await new Promise((r) => setTimeout(r, base));
    return retryWithExponentialBackoff(fn, attempts - 1, base * 2);
  }
};

/* -------------------------------------------------------------------------- */
/*  3. agent factory                                                          */
/* -------------------------------------------------------------------------- */

const createAiAgent = (cfg: AiAgentConfig, ctx?: any) => {
  try {
    const chatModel = getChatModel(cfg, ctx);
    return new Agent(components.agent, {
      name: `AI Agent (${cfg.selectedProvider})`,
      chat: chatModel,
      instructions: cfg.systemPrompt,
      maxSteps: cfg.maxSteps,
    });
  } catch (error: any) {
    console.error("Failed to create AI agent:", error);
    throw new Error(`Failed to create AI agent: ${error?.message || error}`);
  }
};

/* -------------------------------------------------------------------------- */
/*  4. actions                                                                */
/* -------------------------------------------------------------------------- */

export const processUserMessage = action({
  args: {
    threadId: v.string(),
    userInput: v.string(),
    agentConfig: v.object({
      selectedProvider: v.union(
        v.literal("openai"),
        v.literal("anthropic"),
        v.literal("google"),
        v.literal("custom"),
      ),
      selectedModel: v.string(),
      systemPrompt: v.string(),
      maxSteps: v.number(),
      temperature: v.number(),
      customApiKey: v.optional(v.string()),
      customEndpoint: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<AiAgentMessage> => {
    try {
      console.log("Processing user message with config:", {
        provider: args.agentConfig.selectedProvider,
        model: args.agentConfig.selectedModel,
        hasCustomKey: !!args.agentConfig.customApiKey,
        userInput: args.userInput.substring(0, 50) + "..."
      });

             const agent = createAiAgent(args.agentConfig, ctx);
      const threadId = args.threadId;

      console.log("Managing thread:", threadId);
      
      let thread;
      // Check if we have a valid Convex thread ID to continue, otherwise create new
      if (threadId && threadId.length > 10 && !threadId.includes("_")) {
        try {
          // Try to continue existing thread with valid Convex document ID
          console.log("Continuing existing thread:", threadId);
          const threadResult = await agent.continueThread(ctx, { threadId });
          thread = threadResult.thread;
        } catch (error) {
          console.log("Failed to continue thread, creating new one:", error);
          // If continuation fails, create a new thread
          const threadResult = await agent.createThread(ctx, { 
            userId: "workflow-user",
            title: "AI Agent Conversation",
          });
          thread = threadResult.thread;
        }
      } else {
        // Create a new thread for invalid or missing thread IDs
        console.log("Creating new thread");
        const threadResult = await agent.createThread(ctx, { 
          userId: "workflow-user",
          title: "AI Agent Conversation",
        });
        thread = threadResult.thread;
      }

      console.log("Generating text with prompt:", args.userInput.substring(0, 100));
      const res = await retryWithExponentialBackoff(() =>
        thread.generateText({
          prompt: args.userInput,
          temperature: args.agentConfig.temperature,
        }),
      );

      console.log("AI response received:", res.text.substring(0, 100));

      return {
        threadId: thread.threadId,
        text: res.text,
        usage: res.usage as AiUsage,
      };
    } catch (error: any) {
      console.error("Detailed AI processing error:", error);
      
      const errorMessage = error?.message || String(error);
      
      // Provide more specific error messages
      if (errorMessage.includes("API key")) {
        throw new Error(`API Key Error: ${errorMessage}. Please check your ${args.agentConfig.selectedProvider.toUpperCase()} API key configuration.`);
      }
      if (errorMessage.includes("model")) {
        throw new Error(`Model Error: Invalid model "${args.agentConfig.selectedModel}" for ${args.agentConfig.selectedProvider}. Please check the model name.`);
      }
      if (errorMessage.includes("auth") || errorMessage.includes("401")) {
        throw new Error(`Authentication Error: Invalid API key for ${args.agentConfig.selectedProvider}. Please verify your API key.`);
      }
      if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        throw new Error(`Rate Limit Error: ${args.agentConfig.selectedProvider} rate limit exceeded. Please try again later.`);
      }
      
      throw new Error(`AI Processing Error: ${errorMessage}`);
    }
  },
});

export const createThread = action({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const agent = new Agent(components.agent, { chat: openai.chat("gpt-3.5-turbo") });
      const { threadId } = await agent.createThread(ctx, { 
        userId: args.userId || "workflow-user",
        title: args.title || "AI Agent Conversation",
      });
      return { threadId };
    } catch (error: any) {
      console.error("Failed to create thread:", error);
      throw new Error(`Failed to create thread: ${error?.message || error}`);
    }
  },
});

export const getThreadMessages = action({
  args: { threadId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { threadId, limit = 50 }) =>
    ctx.runAction(components.agent.messages.searchMessages, { threadId, limit }),
});

// Add a validation action to check if API keys are working
export const validateConfiguration = action({
  args: {
    provider: v.union(v.literal("openai"), v.literal("anthropic"), v.literal("google")),
    model: v.optional(v.string()),
    customApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const testModel = args.model || (
        args.provider === "openai" ? "gpt-3.5-turbo" : 
        args.provider === "anthropic" ? "claude-3-5-haiku-20241022" :
        "gemini-1.5-flash-8b"
      );
      
      // Test with environment API key (same for both custom and env keys in Convex)
      let chatModel;
      if (args.provider === "openai") {
        chatModel = openai.chat(testModel);
      } else if (args.provider === "anthropic") {
        chatModel = anthropic.chat(testModel);
      } else {
        chatModel = google.chat(testModel);
      }

      // Create a simple agent for testing
      const testAgent = new Agent(components.agent, {
        name: `Test Agent (${args.provider})`,
        chat: chatModel,
        instructions: "You are a test agent. Respond with 'OK' to test messages.",
        maxSteps: 1,
      });

      // Create a test thread
      const { thread } = await testAgent.createThread(ctx, { userId: "test-user" });
      
      // Try to generate a simple response
      const result = await thread.generateText({
        prompt: "test",
        temperature: 0.1,
      });

      return {
        success: true,
        message: `${args.provider} API is working correctly with model ${testModel}`,
        testResponse: result.text.substring(0, 50),
        model: testModel
      };
    } catch (error: any) {
      console.error("Configuration validation failed:", error);
      
      return {
        success: false,
        error: error?.message || String(error),
        provider: args.provider,
        details: `Failed to validate ${args.provider} configuration. Check API keys and model availability.`
      };
    }
  },
});
