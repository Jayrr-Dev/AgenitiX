# AI Tools Documentation

This directory contains tools that can be used by AI agents to extend their capabilities beyond their training data.

## Available Tools

### 1. Calculator Tool
**File:** `calculator.ts`
**Purpose:** Perform mathematical calculations and return numerical results.

**Usage:**
- Simple arithmetic: `2 + 3 * 4`
- Complex expressions: `(10 + 5) / 3`
- Scientific calculations: `sin(30) * pi`

### 2. Web Search Tool
**File:** `webSearch.ts`
**Purpose:** Search the web for current information, news, and real-time data.

**Features:**
- **100% Free** - No API keys required
- Privacy-focused DuckDuckGo search
- Quick answers extraction
- Structured result formatting for AI
- Simple and reliable implementation

**Usage Examples:**
- Current events: `"latest AI developments 2025"`
- Real-time data: `"Bitcoin price today"`
- Weather: `"weather in New York"`
- General information: `"how to bake bread"`
- News: `"latest tech news"`

**Search Provider:**

**DuckDuckGo API** (Free & Privacy-focused)
- ✅ No registration required
- ✅ No API keys needed
- ✅ No rate limits for reasonable usage
- ✅ Privacy-focused (no tracking)
- ✅ Works out of the box

## Configuration

**No configuration required!** The web search tool works out of the box with DuckDuckGo's free API.

### Adding New Tools

1. Create a new tool file in this directory
2. Follow the existing pattern (see `calculator.ts` for reference)
3. Add the tool to `TOOL_DEFINITIONS` in `../tools-config.ts`
4. Implement the tool handler in `../../../../convex/aiAgent.ts`

## Best Practices

1. **Error Handling:** Always provide graceful fallbacks
2. **Rate Limiting:** Respect API rate limits
3. **Caching:** Consider caching frequent requests
4. **Security:** Never expose API keys in client-side code
5. **User Experience:** Provide clear error messages and suggestions

## Testing

Test your tools using the AI Agent node in the flow editor:

1. Add an AI Tools node to your flow
2. Enable the desired tools
3. Connect to an AI Agent node
4. Test with relevant queries

## Examples

### Basic Web Search
```
Query: "What's the weather like in London today?"
Result: Current weather conditions, temperature, and forecast
```

### Current Events
```
Query: "Latest news about OpenAI"
Result: Recent news articles and developments
```

### Real-time Data
```
Query: "Current Bitcoin price"
Result: Live Bitcoin price and market data
```

## Troubleshooting

### Common Issues

1. **No search results:**
   - Check internet connectivity
   - Verify API keys if using premium providers
   - Try rephrasing the query

2. **API key errors:**
   - Ensure environment variables are set correctly
   - Check API key validity
   - Verify account status with the provider

3. **Rate limiting:**
   - Implement request throttling
   - Consider upgrading API plan
   - Use caching for frequent queries

### Debug Mode

Enable debug logging by setting the console log level to see detailed operation logs.