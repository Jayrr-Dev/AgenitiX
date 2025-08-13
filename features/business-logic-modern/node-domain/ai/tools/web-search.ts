/**
 * Web Search Tool
 * 
 * Allows AI to search the web for information.
 * Currently a placeholder - can be integrated with search APIs like:
 * - Google Custom Search API
 * - Bing Search API
 * - DuckDuckGo API
 * - Serper API
 */

import type { ToolImplementation } from "./types";

/**
 * Web search result interface
 */
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
  date?: string;
}

/**
 * SerpAPI response interface
 */
interface SerpApiResponse {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet: string;
    displayed_link?: string;
    date?: string;
  }>;
  answer_box?: {
    answer: string;
    title: string;
    link: string;
  };
  knowledge_graph?: {
    title: string;
    description: string;
  };
  error?: string;
}

/**
 * Fallback search using DuckDuckGo Instant Answer API (free, no API key required)
 */
const performDuckDuckGoSearch = async (query: string): Promise<SearchResult[]> => {
  try {
    // DuckDuckGo Instant Answer API - free and doesn't require API key
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    const results: SearchResult[] = [];
    
    // Add abstract if available
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: data.AbstractText,
        displayUrl: data.AbstractSource || "DuckDuckGo",
      });
    }
    
    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text,
            displayUrl: new URL(topic.FirstURL).hostname,
          });
        }
      });
    }
    
    // If no results, add a search link
    if (results.length === 0) {
      results.push({
        title: `Search results for "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `Click to search for "${query}" on DuckDuckGo`,
        displayUrl: "duckduckgo.com",
      });
    }
    
    return results;
  } catch (error) {
    console.error("DuckDuckGo search error:", error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Premium search using SerpAPI (requires API key)
 */
const performSerpApiSearch = async (query: string, maxResults: number = 5): Promise<SearchResult[]> => {
  const apiKey = process.env.SERPAPI_KEY;
  
  if (!apiKey) {
    throw new Error("SERPAPI_KEY environment variable not set");
  }
  
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${maxResults}&hl=en&gl=us`
    );
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }
    
    const data: SerpApiResponse = await response.json();
    
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }
    
    const results: SearchResult[] = [];
    
    // Add answer box if available
    if (data.answer_box) {
      results.push({
        title: data.answer_box.title,
        url: data.answer_box.link,
        snippet: data.answer_box.answer,
        displayUrl: "Featured Answer",
      });
    }
    
    // Add knowledge graph if available
    if (data.knowledge_graph && results.length === 0) {
      results.push({
        title: data.knowledge_graph.title,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: data.knowledge_graph.description,
        displayUrl: "Knowledge Graph",
      });
    }
    
    // Add organic results
    if (data.organic_results) {
      data.organic_results.slice(0, maxResults - results.length).forEach(result => {
        results.push({
          title: result.title,
          url: result.link,
          snippet: result.snippet,
          displayUrl: result.displayed_link,
          date: result.date,
        });
      });
    }
    
    return results;
  } catch (error) {
    console.error("SerpAPI search error:", error);
    throw error;
  }
};

/**
 * Main web search function with fallback strategy
 */
const performWebSearch = async (query: string, maxResults: number = 5): Promise<string> => {
  try {
    // Validate input
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }
    
    if (query.length > 200) {
      throw new Error("Search query too long (max 200 characters)");
    }
    
    const cleanQuery = query.trim();
    let results: SearchResult[] = [];
    
    // Try SerpAPI first (premium, more accurate)
    try {
      if (process.env.SERPAPI_KEY) {
        results = await performSerpApiSearch(cleanQuery, maxResults);
      } else {
        throw new Error("No SerpAPI key available");
      }
    } catch (serpError) {
      // Fallback to DuckDuckGo (free)
      results = await performDuckDuckGoSearch(cleanQuery);
    }
    
    // Format results
    if (results.length === 0) {
      return `No search results found for "${cleanQuery}". Try rephrasing your query or being more specific.`;
    }
    
    let response = `🔍 **Web Search Results for "${cleanQuery}"**\n\n`;
    
    results.slice(0, maxResults).forEach((result, index) => {
      response += `**${index + 1}. ${result.title}**\n`;
      response += `🔗 ${result.url}\n`;
      if (result.displayUrl && result.displayUrl !== result.url) {
        response += `📍 ${result.displayUrl}\n`;
      }
      if (result.date) {
        response += `📅 ${result.date}\n`;
      }
      response += `📝 ${result.snippet}\n\n`;
    });
    
    response += `Found ${results.length} result${results.length === 1 ? '' : 's'} • Powered by ${process.env.SERPAPI_KEY ? 'SerpAPI' : 'DuckDuckGo'}`;
    
    return response;
    
  } catch (error) {
    console.error("Web search error:", error);
    
    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return `❌ **Search Error**\n\nSorry, I couldn't search for "${query}" right now.\n\n**Error**: ${errorMessage}\n\n**Suggestions**:\n• Check your internet connection\n• Try a different search query\n• Try again in a moment`;
  }
};

export const webSearchTool: ToolImplementation = {
  definition: {
    name: "Web Search",
    description: "Search the web for current information, news, facts, and answers",
    icon: "LuSearch",
    category: "research",
  },

  convexHandler: async (args: { query: string; maxResults?: number }) => {
    try {
      const { query, maxResults = 5 } = args;

      // Input validation
      if (!query || typeof query !== 'string') {
        return "❌ **Search Error**: Query must be a non-empty string";
      }

      if (query.trim().length === 0) {
        return "❌ **Search Error**: Search query cannot be empty";
      }

      if (maxResults && (maxResults < 1 || maxResults > 10)) {
        return "❌ **Search Error**: maxResults must be between 1 and 10";
      }

      // Perform search with error handling
      const results = await performWebSearch(query.trim(), maxResults || 5);
      return results;
      
    } catch (error) {
      console.error("Web search tool error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `❌ **Search Failed**\n\nCouldn't search for "${args.query}"\n\n**Error**: ${errorMessage}`;
    }
  },
};