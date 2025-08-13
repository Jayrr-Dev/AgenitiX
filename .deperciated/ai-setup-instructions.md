# AI Agent Setup Instructions

## 1. Install Required Packages

```bash
pnpm add @ai-sdk/openai @ai-sdk/anthropic
```

## 2. Get Your API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)

## 3. Update Your .env.local File

Replace the placeholder values in `.env.local`:

```bash
# Replace these with your actual API keys
OPENAI_API_KEY=sk-your-actual-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
```

## 4. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
pnpm dev
```

## 5. Test the AI Agent Node

1. Add an AI Agent node to your canvas
2. Connect a createText node to the text input
3. Expand the AI Agent node
4. Configure your preferred AI provider
5. Enter a system prompt
6. The node should now process with real AI!

## Troubleshooting

- **"Invalid API key"**: Check that your API key is correct and has billing enabled
- **"Rate limit exceeded"**: You're making too many requests, wait a moment
- **"Quota exceeded"**: Check your API billing and usage limits
- **Network errors**: Check your internet connection

## Security Notes

- Never commit API keys to version control
- Keep your `.env.local` file in `.gitignore`
- Consider using environment-specific keys for production