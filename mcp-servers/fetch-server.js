#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server(
  {
    name: 'fetch-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add fetch tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'fetch',
        description: 'Fetch content from a URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch',
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'DELETE'],
              default: 'GET',
              description: 'HTTP method',
            },
            headers: {
              type: 'object',
              description: 'HTTP headers',
            },
            body: {
              type: 'string',
              description: 'Request body for POST/PUT requests',
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name !== 'fetch') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { url, method = 'GET', headers = {}, body } = request.params.arguments;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? body : undefined,
    });

    const text = await response.text();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: text,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching ${url}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fetch MCP server running on stdio');
}

runServer().catch(console.error);