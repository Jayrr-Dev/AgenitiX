/**
 * File: features/business-logic-modern/node-domain/ai/tools/webSearch.ts
 * SIMPLE WEB SEARCH TOOL - DuckDuckGo-powered web search for AI agents
 *
 * • Uses DuckDuckGo API (free, no API key required)
 * • Extracts quick answers and search results
 * • Optimized formatting for AI consumption
 * • Simple and reliable implementation
 *
 * Keywords: web-search, ai-tools, duckduckgo, real-time-data, free-search
 */

// Search result interface
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Search response interface
export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  timestamp: number;
}

/**
 * Simple DuckDuckGo web search tool
 */
export class WebSearchTool {
  /**
   * Search the web using DuckDuckGo API
   */
  async search(query: string, maxResults: number = 5): Promise<SearchResponse> {
    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract quick answer
      const answer = data.Answer || data.AbstractText || '';
      
      // Extract search results
      const results: SearchResult[] = [];
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, maxResults).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        });
      }

      return {
        query,
        results,
        answer,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      throw new Error(`Web search failed: ${error}`);
    }
  }

  /**
   * Format search results for AI consumption
   */
  formatForAI(response: SearchResponse): string {
    let formatted = `Search Results for "${response.query}":\n\n`;

    if (response.answer) {
      formatted += `Quick Answer: ${response.answer}\n\n`;
    }

    if (response.results.length > 0) {
      formatted += `Found ${response.results.length} results:\n\n`;
      response.results.forEach((result, index) => {
        formatted += `${index + 1}. **${result.title}**\n`;
        formatted += `   ${result.snippet}\n`;
        formatted += `   Source: ${result.url}\n\n`;
      });
    } else {
      formatted += 'No specific results found. Try rephrasing your search query.\n';
    }

    formatted += `\n*Powered by DuckDuckGo*`;
    return formatted.trim();
  }
}

// Default export
export default WebSearchTool;