# AI Agent Node Design Document

## Overview

The AI Agent Node integrates Convex AI agents into the AgenitiX workflow platform, providing intelligent text processing capabilities. The node acts as a controlled AI processor that responds to external activation signals and processes user input through large language models. It maintains conversation context across interactions and provides robust error handling for production workflows.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Node                            │
├─────────────────────────────────────────────────────────────┤
│  Input Handles:                                             │
│  • JSON Input (top) - Additional context/configuration     │
│  • Text Input (left) - User context/prompt                 │
│                                                             │
│  Processing Engine:                                         │
│  • Convex AI Agent Integration                              │
│  • Promise-based Processing State                           │
│  • Thread Management                                        │
│  • Internal isActive Management                             │
│                                                             │
│  Output Handle:                                             │
│  • Text Output (right) - AI response or error message      │
└─────────────────────────────────────────────────────────────┘
```

### Integration with Convex AI Agent

The node leverages the `@convex-dev/agent` package to:

- Create and manage conversation threads
- Process text through configured LLM models
- Handle tool calls and context management
- Provide streaming and non-streaming response options

## Components and Interfaces

### Node Data Schema

```typescript
export const AiAgentDataSchema = z
  .object({
    // AI Model Configuration
    selectedProvider: z
      .enum(["openai", "anthropic", "custom"])
      .default("openai"),
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
    conversationHistory: z.array(z.any()).default([]),

    // UI State
    isEnabled: z.boolean().default(true),
    isExpanded: z.boolean().default(false),
    expandedSize: z.string().default("VE2"),
    collapsedSize: z.string().default("C2"),

    // Output
    output: z.string().nullable().default(null),
  })
  .passthrough();
```

### Handle Configuration

```typescript
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
    code: "t",
    position: "left",
    type: "target",
    dataType: "String",
  },
  {
    id: "output",
    code: "o",
    position: "right",
    type: "source",
    dataType: "String",
  },
];
```

### Convex Integration Layer

```typescript
// convex/aiAgent.ts
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";

export const createAiAgent = (config: AiAgentConfig) => {
  return new Agent(components.agent, {
    chat: openai.chat(config.model || "gpt-4o-mini"),
    instructions: config.systemPrompt || "You are a helpful assistant.",
    maxSteps: config.maxSteps || 1,
    maxRetries: 3,
    usageHandler: async (ctx, { usage }) => {
      // Log token usage for monitoring
      console.log("Token usage:", usage);
    },
  });
};

export const processUserMessage = action({
  args: {
    threadId: v.optional(v.string()),
    userInput: v.string(),
    agentConfig: v.object({
      agentName: v.string(),
      systemPrompt: v.string(),
      model: v.string(),
      maxSteps: v.number(),
    }),
  },
  handler: async (ctx, args) => {
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
    const result = await thread.generateText({
      prompt: args.userInput,
    });

    return {
      threadId,
      response: result.text,
      usage: result.usage,
    };
  },
});
```

## Data Models

### Processing State Management

The node uses a Promise-based approach to manage processing states:

```typescript
type ProcessingState =
  | null // No active processing
  | Promise<string> // Processing in progress
  | string // Completed successfully
  | Error; // Failed with error

interface ProcessingContext {
  promise: Promise<string> | null;
  controller: AbortController | null;
  startTime: number | null;
  threadId: string | null;
}
```

### Thread Management

```typescript
interface ThreadContext {
  threadId: string | null;
  messageCount: number;
  lastActivity: Date;
  isActive: boolean;
}
```

## Error Handling

### Error Types and Recovery

```typescript
enum AiAgentErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  MODEL_ERROR = "MODEL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  CANCELLATION_ERROR = "CANCELLATION_ERROR",
}

interface AiAgentError {
  type: AiAgentErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Handling Strategy

1. **Network Errors**: Retry with exponential backoff (max 3 attempts)
2. **Rate Limits**: Wait for specified duration then retry
3. **Authentication**: Report immediately, no retry
4. **Model Errors**: Report immediately, no retry
5. **Cancellation**: Clean up resources, report cancellation

### Graceful Degradation

- When AI processing fails, output the error message instead of crashing
- Maintain thread context even after errors for recovery
- Provide clear error messages for debugging
- Log detailed errors for monitoring while showing user-friendly messages

## Testing Strategy

### Unit Tests

```typescript
describe("AiAgentNode", () => {
  describe("Input Processing", () => {
    it("should accept text input and store as userInput");
    it("should accept JSON input for additional context");
    it("should automatically manage isActive based on internal state");
    it("should ignore processing when isActive is false");
  });

  describe("Processing State", () => {
    it("should set isProcessing to pending Promise when activated");
    it("should resolve Promise with AI response on success");
    it("should reject Promise with error on failure");
    it("should cancel processing when isActive becomes false");
  });

  describe("Output Propagation", () => {
    it("should output AI response when processing succeeds");
    it("should output error message when processing fails");
    it("should output null when processing is pending");
    it("should output null when node is inactive");
  });
});
```

### Integration Tests

```typescript
describe("Convex AI Agent Integration", () => {
  it("should create new thread for first interaction");
  it("should continue existing thread for subsequent interactions");
  it("should handle thread creation failures gracefully");
  it("should process text through configured AI model");
  it("should handle model response streaming");
  it("should manage conversation context properly");
});
```

### End-to-End Tests

```typescript
describe("Workflow Integration", () => {
  it("should integrate with createText node as input source");
  it("should integrate with trigger nodes for activation");
  it("should propagate output to downstream nodes");
  it("should handle complex multi-node workflows");
  it("should maintain state across workflow executions");
});
```

### Performance Tests

- Test processing latency under various loads
- Test memory usage with long conversations
- Test concurrent processing scenarios
- Test thread cleanup and garbage collection

## Implementation Phases

### Phase 1: Core Node Structure

- Basic node component with handles
- Input/output data flow
- Promise-based processing state
- Basic UI with loading states

### Phase 2: Convex Integration

- AI agent configuration
- Thread management
- Basic text processing
- Error handling

### Phase 3: Advanced Features

- Conversation context management
- Streaming responses (future)
- Advanced error recovery
- Performance optimizations

### Phase 4: Production Readiness

- Comprehensive testing
- Monitoring and logging
- Documentation
- Performance tuning

## UI Design Specifications

### Collapsed Mode

- **Size**: C2 (120x120px)
- **Display**: Show selected AI provider icon in center
- **Icon Mapping**:
  - OpenAI: OpenAI logo placeholder (🤖 for now)
  - Anthropic: Anthropic logo placeholder (🧠 for now)
  - Custom: Generic AI/gear icon (⚙️ for now)
- **Status Indicators**: Small processing indicator when active
- **No Text**: Clean icon-only display

### Expanded Mode

- **Size**: VE2 (180px width, auto height)
- **AI Provider Selection**:
  - Dropdown/tabs for provider selection (OpenAI, Anthropic, Custom)
  - Model selection dropdown based on selected provider
  - Visual icons for each provider
- **System Prompt Configuration**:
  - Large textarea for system prompt input
  - Placeholder: "You are a helpful assistant..."
  - Character count indicator
  - Resizable textarea with minimum 3 rows
- **BYOK (Bring Your Own Key) Section**:
  - API Key input field (password type, masked)
  - Custom endpoint input (for custom providers)
  - Validation indicators for key status
  - Test connection button
- **Advanced Settings** (collapsible):
  - Temperature slider (0-2) with labels
  - Max tokens input with validation
  - Max steps input for tool usage
- **Status Display**:
  - Current processing state indicator
  - Last response preview (truncated)
  - Error messages with retry options
  - Token usage statistics (if available)

## Configuration Options

### AI Provider Configuration

- **OpenAI Models**: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
- **Anthropic Models**: claude-3-5-sonnet, claude-3-haiku
- **Custom Provider**: User-defined endpoint and model
- **API Key Management**: Secure storage of custom keys
- **Model Parameters**: Temperature, max tokens, top-p (future)

### Agent Configuration

- **System Prompt**: Large textarea for customizing agent behavior and personality
- **Max Steps**: Control tool usage and processing complexity
- **Context Window**: Manage conversation history length
- **Response Format**: Text, JSON, structured output (future)

### Processing Configuration

- **Timeout**: Maximum processing time before cancellation
- **Retry Policy**: Configure retry attempts and backoff
- **Error Handling**: Configure error reporting verbosity
- **Streaming**: Enable/disable response streaming (future)

### UI Configuration

- **Display Mode**: Collapsed vs expanded view
- **Status Indicators**: Show/hide processing states
- **Debug Mode**: Show detailed processing information
- **Theme Integration**: Respect dark/light mode preferences
