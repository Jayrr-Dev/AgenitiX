// File: convex/aiAgent.ts
// Convex actions – now with typed helpers and shared retry logic.

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { Agent, createTool } from "@convex-dev/agent";
import { v } from "convex/values";
import { z } from "zod";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

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
	enabledTools?: Array<{
		type: string;
		name: string;
		config: any;
	}>;
}

const getChatModel = (cfg: AiAgentConfig, _ctx?: unknown) => {
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
				throw new Error(
					"Custom provider requires API key - please set it via Convex environment variables"
				);
			}
			return openai.chat(cfg.selectedModel);
		default:
			throw new Error(`Unsupported provider: ${cfg.selectedProvider}`);
	}
};

const retryWithExponentialBackoff = async <T>(
	fn: () => Promise<T>,
	attempts = 3,
	base = 1_000
): Promise<T> => {
	try {
		return await fn();
	} catch (err) {
		if (attempts <= 1) {
			throw err;
		}
		await new Promise((r) => setTimeout(r, base));
		return retryWithExponentialBackoff(fn, attempts - 1, base * 2);
	}
};

/* -------------------------------------------------------------------------- */
/*  3. agent factory                                                          */
/* -------------------------------------------------------------------------- */

const createAiAgent = (cfg: AiAgentConfig, ctx?: unknown) => {
	try {
		const chatModel = getChatModel(cfg, ctx);
		
		// Convert enabled tools to Convex Agent tools
		console.log("Creating agent with tools:", cfg.enabledTools);
		const tools = getEnabledTools(cfg.enabledTools || []);
		console.log("Processed tools for agent:", Object.keys(tools));
		console.log("Tools object:", tools);
		
		// Create agent configuration with enhanced instructions for tool usage
		const baseInstructions = cfg.systemPrompt;
		const toolInstructions = Object.keys(tools).length > 0 
			? `\n\nIMPORTANT: You have access to the following tools: ${Object.keys(tools).join(', ')}. ALWAYS use these tools when they can help answer the user's question. For example:
- Use webSearch for ANY information requests, current events, prices, news, weather, or facts
- Use calculator for mathematical calculations
Do not say you don't have access to information if you have tools that can get that information. Use the tools first, then provide a helpful response based on the results.`
			: '';
		
		const agentConfig: any = {
			name: `AI Agent (${cfg.selectedProvider})`,
			chat: chatModel,
			instructions: baseInstructions + toolInstructions,
			maxSteps: cfg.maxSteps,
		};
		
		// Only add tools if we have any configured
		if (Object.keys(tools).length > 0) {
			console.log("Adding tools to agent:", Object.keys(tools));
			agentConfig.tools = tools;
		}
		
		console.log("Creating agent with config:", agentConfig);
		return new Agent(components.agent, agentConfig);
	} catch (error: unknown) {
		console.error("Failed to create AI agent:", error);
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to create AI agent: ${errorMessage}`);
	}
};

/* -------------------------------------------------------------------------- */
/*  3. Tools Configuration                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Safe calculator function that doesn't use eval
 * Supports basic arithmetic operations: +, -, *, /, (, )
 */
const safeCalculate = (expression: string): number => {
	// Remove whitespace and validate characters
	const cleanExpr = expression.replace(/\s/g, '');
	
	// Only allow numbers, operators, and parentheses
	if (!/^[0-9+\-*/().]+$/.test(cleanExpr)) {
		throw new Error("Invalid characters in expression");
	}
	
	// Simple recursive descent parser for basic arithmetic
	let pos = 0;
	
	const parseNumber = (): number => {
		let num = '';
		while (pos < cleanExpr.length && /[0-9.]/.test(cleanExpr[pos])) {
			num += cleanExpr[pos++];
		}
		if (num === '') throw new Error("Expected number");
		return parseFloat(num);
	};
	
	const parseFactor = (): number => {
		if (pos < cleanExpr.length && cleanExpr[pos] === '(') {
			pos++; // skip '('
			const result = parseExpression();
			if (pos >= cleanExpr.length || cleanExpr[pos] !== ')') {
				throw new Error("Missing closing parenthesis");
			}
			pos++; // skip ')'
			return result;
		}
		
		if (pos < cleanExpr.length && cleanExpr[pos] === '-') {
			pos++; // skip '-'
			return -parseFactor();
		}
		
		if (pos < cleanExpr.length && cleanExpr[pos] === '+') {
			pos++; // skip '+'
			return parseFactor();
		}
		
		return parseNumber();
	};
	
	const parseTerm = (): number => {
		let result = parseFactor();
		
		while (pos < cleanExpr.length && (cleanExpr[pos] === '*' || cleanExpr[pos] === '/')) {
			const op = cleanExpr[pos++];
			const right = parseFactor();
			if (op === '*') {
				result *= right;
			} else {
				if (right === 0) throw new Error("Division by zero");
				result /= right;
			}
		}
		
		return result;
	};
	
	const parseExpression = (): number => {
		let result = parseTerm();
		
		while (pos < cleanExpr.length && (cleanExpr[pos] === '+' || cleanExpr[pos] === '-')) {
			const op = cleanExpr[pos++];
			const right = parseTerm();
			if (op === '+') {
				result += right;
			} else {
				result -= right;
			}
		}
		
		return result;
	};
	
	const result = parseExpression();
	
	if (pos < cleanExpr.length) {
		throw new Error("Unexpected characters at end of expression");
	}
	
	return result;
};

/**
 * Perform web search using Tavily API with DuckDuckGo and Wikipedia fallbacks
 */
const performWebSearch = async (query: string, options: { maxResults?: number; includeAnswer?: boolean } = {}): Promise<string> => {
	const maxResults = options.maxResults || 5;
	const includeAnswer = options.includeAnswer !== false;
	
	// Get API key from environment variables
	const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

	try {
		console.log(`Searching for: "${query}"`);
		
		// Strategy 1: Try Tavily Search API first (most reliable)
		if (TAVILY_API_KEY) {
			try {
				console.log('Attempting Tavily search...');
				const tavilyResponse = await fetch('https://api.tavily.com/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${TAVILY_API_KEY}`
				},
				body: JSON.stringify({
					query: query,
					search_depth: "advanced",
					include_answer: includeAnswer,
					include_raw_content: false,
					max_results: maxResults,
					include_domains: [],
					exclude_domains: []
				})
			});

			if (tavilyResponse.ok) {
				const tavilyData = await tavilyResponse.json();
				console.log('Tavily search completed successfully');
				
				let result = `Search Results for "${query}":\n\n`;
				let hasResults = false;

				// Add Tavily's answer if available
				if (includeAnswer && tavilyData.answer) {
					result += `Answer: ${tavilyData.answer}\n\n`;
					hasResults = true;
				}

				// Process Tavily search results
				if (tavilyData.results && Array.isArray(tavilyData.results) && tavilyData.results.length > 0) {
					result += `Found ${tavilyData.results.length} results:\n\n`;
					tavilyData.results.forEach((item: any, index: number) => {
						result += `${index + 1}. **${item.title}**\n`;
						result += `   ${item.content}\n`;
						result += `   URL: ${item.url}\n`;
						if (item.score) {
							result += `   Relevance: ${Math.round(item.score * 100)}%\n`;
						}
						result += `\n`;
					});
					hasResults = true;
				}

				if (hasResults) {
					result += `\n*Search powered by Tavily*`;
					console.log('Returning Tavily search results');
					return result;
				}
			} else {
				console.log(`Tavily API error: ${tavilyResponse.status}, falling back to DuckDuckGo`);
			}
		} catch (tavilyError) {
			console.log('Tavily search failed, falling back to DuckDuckGo:', tavilyError);
		}
		} else {
			console.log('Tavily API key not found in environment variables, skipping to DuckDuckGo');
		}
		
		// Strategy 2: Fallback to DuckDuckGo Instant Answer API
		try {
			console.log('Attempting DuckDuckGo search...');
			const duckGoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
			
			const duckGoResponse = await fetch(duckGoUrl);
			if (duckGoResponse.ok) {
				const duckGoData = await duckGoResponse.json();
				console.log('DuckDuckGo search completed');
				
				let result = `Search Results for "${query}":\n\n`;
				let hasResults = false;
				
				// Check for instant answers or abstracts
				if (includeAnswer && (duckGoData.Answer || duckGoData.AbstractText)) {
					const answer = duckGoData.Answer || duckGoData.AbstractText;
					result += `Quick Answer: ${answer}\n\n`;
					hasResults = true;
				}
				
				// Extract results from RelatedTopics
				const relatedResults: Array<{ title: string; url: string; snippet: string }> = [];
				
				if (duckGoData.RelatedTopics && Array.isArray(duckGoData.RelatedTopics)) {
					duckGoData.RelatedTopics.slice(0, maxResults).forEach((topic: any) => {
						if (topic.Text && topic.FirstURL) {
							relatedResults.push({
								title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
								url: topic.FirstURL,
								snippet: topic.Text
							});
						}
					});
				}
				
				if (relatedResults.length > 0) {
					result += `Found ${relatedResults.length} related topics:\n\n`;
					relatedResults.forEach((item, index) => {
						result += `${index + 1}. **${item.title}**\n`;
						result += `   ${item.snippet}\n`;
						result += `   URL: ${item.url}\n\n`;
					});
					hasResults = true;
				}

				if (hasResults) {
					result += `\n*Search powered by DuckDuckGo*`;
					console.log('Returning DuckDuckGo search results');
					return result;
				}
			}
		} catch (duckGoError) {
			console.log('DuckDuckGo search failed, trying Wikipedia:', duckGoError);
		}
		
		// Strategy 3: Fallback to Wikipedia API for factual/informational queries
		try {
			console.log('Attempting Wikipedia search...');
			
			// Determine if this is a good candidate for Wikipedia
			const isFactualQuery = query.toLowerCase().match(/(what is|who is|when was|where is|how does|definition|meaning|history|bitcoin|cryptocurrency|climate|science|technology|medicine|geography|biography)/);
			
			if (isFactualQuery) {
				// Extract main topic from query for Wikipedia search
				const searchTerm = query
					.replace(/what is|who is|when was|where is|how does|definition of|meaning of|history of/gi, '')
					.trim()
					.split(' ')[0]; // Take first significant word
				
				const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
				const wikiResponse = await fetch(wikiUrl);
				
				if (wikiResponse.ok) {
					const wikiData = await wikiResponse.json();
					let result = `Search Results for "${query}":\n\n`;
					result += `Wikipedia Summary:\n`;
					result += `**${wikiData.title}**\n`;
					result += `${wikiData.extract}\n\n`;
					
					if (wikiData.content_urls && wikiData.content_urls.desktop) {
						result += `Full article: ${wikiData.content_urls.desktop.page}\n\n`;
					}
					
					// Add specific guidance based on query type
					if (query.toLowerCase().includes('price') || query.toLowerCase().includes('bitcoin') || query.toLowerCase().includes('stock')) {
						result += `For current pricing information:\n`;
						result += `• CoinMarketCap: https://coinmarketcap.com\n`;
						result += `• Yahoo Finance: https://finance.yahoo.com\n`;
						result += `• Google Finance: https://www.google.com/finance\n\n`;
					}
					
					result += `\n*Search powered by Wikipedia*`;
					console.log('Returning Wikipedia search results');
					return result;
				}
			}
		} catch (wikiError) {
			console.log('Wikipedia search failed:', wikiError);
		}
		
		// Strategy 4: If all searches fail, provide helpful guidance
		console.log('All search strategies failed, providing guidance');
		let result = `Unable to find specific results for "${query}" at this time.\n\n`;
		
		// Provide helpful guidance based on query type
		if (query.toLowerCase().includes('price') || query.toLowerCase().includes('stock') || query.toLowerCase().includes('bitcoin')) {
			result += `For current prices and financial data, try:\n`;
			result += `• Yahoo Finance: https://finance.yahoo.com\n`;
			result += `• CoinMarketCap: https://coinmarketcap.com (for cryptocurrencies)\n`;
			result += `• Google Finance: https://www.google.com/finance\n`;
		} else if (query.toLowerCase().includes('weather')) {
			result += `For current weather, try:\n`;
			result += `• Weather.com: https://weather.com\n`;
			result += `• AccuWeather: https://www.accuweather.com\n`;
		} else if (query.toLowerCase().includes('news') || query.toLowerCase().includes('latest')) {
			result += `For latest news, try:\n`;
			result += `• BBC: https://www.bbc.com/news\n`;
			result += `• Reuters: https://www.reuters.com\n`;
			result += `• AP News: https://apnews.com\n`;
		} else {
			result += `For immediate access to information, try:\n`;
			result += `• Google: https://www.google.com/search?q=${encodeURIComponent(query)}\n`;
			result += `• DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(query)}\n`;
			result += `• Bing: https://www.bing.com/search?q=${encodeURIComponent(query)}\n`;
		}
		
		result += `\n*Search attempt made using multiple sources*`;
		return result;
		
	} catch (error) {
		console.error('All web search strategies failed:', error);
		
		return `Unable to perform web search for "${query}" at this time.\n\n` +
			   `Reason: ${error}\n\n` +
			   `For immediate access to information, try:\n` +
			   `• Google: https://www.google.com/search?q=${encodeURIComponent(query)}\n` +
			   `• DuckDuckGo: https://duckduckgo.com/?q=${encodeURIComponent(query)}\n` +
			   `• Bing: https://www.bing.com/search?q=${encodeURIComponent(query)}`;
	}
};

const getEnabledTools = (enabledTools: Array<{ type: string; name: string; config: any }>) => {
	const tools: any = {};
	
	// Handle empty or undefined tools array
	if (!enabledTools || enabledTools.length === 0) {
		return tools;
	}
	
	console.log("Processing enabled tools:", enabledTools);
	
	for (const tool of enabledTools) {
		try {
			switch (tool.type) {
				case "calculator":
					console.log("Creating calculator tool...");
					// Calculator tool using Convex Agent createTool format
					tools.calculator = createTool({
						description: "Calculate mathematical expressions using the built-in calculator. ALWAYS use this tool instead of writing code when the user asks for calculations. This tool will compute the result directly.",
						args: z.object({
							expression: z.string().describe("Mathematical expression to evaluate (e.g., '2 + 3 * 4', '(10 + 5) / 3', '123456789 * 987654321')")
						}),
						handler: async (ctx, args) => {
							console.log("Calculator tool called with:", args);
							try {
								// Safe calculator implementation without eval
								const result = safeCalculate(args.expression);
								console.log("Calculator result:", result);
								// Return the numerical result directly
								return `The answer is ${result}`;
							} catch (error) {
								console.error("Calculator error:", error);
								return `Error calculating ${args.expression}: ${error}`;
							}
						},
					});
					console.log("Calculator tool created successfully");
					break;
					
				case "webSearch":
					console.log("Creating web search tool...");
					// Web search tool using Convex Agent createTool format
					tools.webSearch = createTool({
						description: "Search the web for ANY information, including current news, facts, Wikipedia articles, recent events, prices, weather, and general knowledge. This tool can find information from all websites including Wikipedia, news sites, and other sources. Use this whenever you need to look up information that might not be in your training data or when the user asks for current/recent information.",
						args: z.object({
							query: z.string().describe("Search query to find information on the web (e.g., 'latest AI trends 2025', 'Bitcoin price today', 'weather in New York')"),
							maxResults: z.number().optional().describe("Maximum number of search results to return (1-10, default: 5)"),
							includeAnswer: z.boolean().optional().describe("Whether to include a quick answer if available (default: true)")
						}),
						handler: async (ctx, args) => {
							console.log("Web search tool called with:", args);
							try {
								const result = await performWebSearch(args.query, {
									maxResults: Math.min(Math.max(args.maxResults || 5, 1), 10),
									includeAnswer: args.includeAnswer !== false
								});
								console.log("Web search completed successfully");
								return result;
							} catch (error) {
								console.error("Web search error:", error);
								return `Error searching for "${args.query}": ${error}`;
							}
						},
					});
					console.log("Web search tool created successfully");
					break;
					
				default:
					console.warn(`Unknown tool type: ${tool.type}`);
			}
		} catch (error) {
			console.error(`Error creating tool ${tool.type}:`, error);
		}
	}
	
	console.log("Final tools object:", Object.keys(tools));
	return tools;
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
				v.literal("custom")
			),
			selectedModel: v.string(),
			systemPrompt: v.string(),
			maxSteps: v.number(),
			temperature: v.number(),
			customApiKey: v.optional(v.string()),
			customEndpoint: v.optional(v.string()),
			enabledTools: v.optional(v.array(v.object({
				type: v.string(),
				name: v.string(),
				config: v.any(),
			}))),
		}),
	},
	handler: async (ctx, args): Promise<AiAgentMessage> => {
		try {
			console.log("Processing user message with config:", {
				provider: args.agentConfig.selectedProvider,
				model: args.agentConfig.selectedModel,
				hasCustomKey: !!args.agentConfig.customApiKey,
				userInput: `${args.userInput.substring(0, 50)}...`,
			});

			const agent = createAiAgent(args.agentConfig, ctx);
			const threadId = args.threadId;

			console.log("Managing thread:", threadId);

			// Check if we have a valid Convex thread ID to continue, otherwise create new
			let thread: {
				threadId: string;
				generateText: (options: { prompt: string; temperature: number }) => Promise<{
					text: string;
					usage: AiUsage;
				}>;
			};

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
				})
			);

			console.log("AI response received:", res.text.substring(0, 100));

			return {
				threadId: thread.threadId,
				text: res.text,
				usage: res.usage as AiUsage,
			};
		} catch (error: unknown) {
			console.error("Detailed AI processing error:", error);

			const errorMessage = error instanceof Error ? error.message : String(error);

			// Provide more specific error messages
			if (errorMessage.includes("API key")) {
				throw new Error(
					`API Key Error: ${errorMessage}. Please check your ${args.agentConfig.selectedProvider.toUpperCase()} API key configuration.`
				);
			}
			if (errorMessage.includes("model")) {
				throw new Error(
					`Model Error: Invalid model "${args.agentConfig.selectedModel}" for ${args.agentConfig.selectedProvider}. Please check the model name.`
				);
			}
			if (errorMessage.includes("auth") || errorMessage.includes("401")) {
				throw new Error(
					`Authentication Error: Invalid API key for ${args.agentConfig.selectedProvider}. Please verify your API key.`
				);
			}
			if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
				throw new Error(
					`Rate Limit Error: ${args.agentConfig.selectedProvider} rate limit exceeded. Please try again later.`
				);
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
		} catch (error: unknown) {
			console.error("Failed to create thread:", error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to create thread: ${errorMessage}`);
		}
	},
});

export const getThreadMessages = action({
	args: { threadId: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { threadId, limit = 50 }) =>
		ctx.runQuery(components.agent.messages.listMessagesByThreadId, { 
			threadId, 
			order: "desc", // Most recent first
			paginationOpts: { 
				cursor: null, // Start from beginning
				numItems: limit 
			}
		}),
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
			const testModel =
				args.model ||
				(args.provider === "openai"
					? "gpt-3.5-turbo"
					: args.provider === "anthropic"
						? "claude-3-5-haiku-20241022"
						: "gemini-1.5-flash-8b");

			// Test with environment API key (same for both custom and env keys in Convex)
			let chatModel:
				| ReturnType<typeof openai.chat>
				| ReturnType<typeof anthropic.chat>
				| ReturnType<typeof google.chat>;
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
				model: testModel,
			};
		} catch (error: unknown) {
			console.error("Configuration validation failed:", error);
			const errorMessage = error instanceof Error ? error.message : String(error);

			return {
				success: false,
				error: errorMessage,
				provider: args.provider,
				details: `Failed to validate ${args.provider} configuration. Check API keys and model availability.`,
			};
		}
	},
});
