# AI Service

Provider-agnostic AI service for generating chat completions with support for multiple AI providers.

## Features

- **OpenAI Integration** - GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Provider-Agnostic Interface** - Easy to extend for Anthropic Claude, Google Gemini, etc.
- **System Instructions** - Support for custom system prompts from presets
- **Conversation History** - Maintains context across messages
- **Graceful Fallback** - Uses mock responses if API key not configured
- **Error Handling** - Proper error messages for API failures

## Setup

### 1. Get OpenAI API Key

1. Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-...`)

### 2. Configure Environment

Add to `/apps/backend/.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Restart Backend

```bash
pnpm --filter @whalli/backend dev
```

## Usage

### Method 1: `generateReply()` (Recommended)

```typescript
// Inject AiService
constructor(private readonly aiService: AiService) {}

// Generate a reply
const reply = await this.aiService.generateReply(
  'gpt-4o',                    // Model
  'You are a helpful assistant',  // System instruction (optional)
  [                             // Conversation history
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help?' },
    { role: 'user', content: 'What is TypeScript?' }
  ]
);

console.log(reply); // AI-generated response
```

### Method 2: `generateCompletion()` (Legacy)

```typescript
const response = await this.aiService.generateCompletion({
  model: 'gpt-4o',
  systemInstruction: 'You are a helpful assistant',
  messages: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help?' },
    { role: 'user', content: 'What is TypeScript?' }
  ]
});

console.log(response.content); // AI-generated response
console.log(response.usage);   // Token usage stats
```

## Supported Models

### OpenAI (Implemented ✅)

| Model ID | Model Name | Context Window | Max Output |
|----------|------------|----------------|------------|
| `gpt-4o` | GPT-4o | 128,000 tokens | 4,096 tokens |
| `gpt-4-turbo` | GPT-4 Turbo | 128,000 tokens | 4,096 tokens |
| `gpt-4` | GPT-4 | 8,192 tokens | 4,096 tokens |
| `gpt-3.5-turbo` | GPT-3.5 Turbo | 16,385 tokens | 4,096 tokens |

### Anthropic Claude (Coming Soon)

| Model ID | Model Name | Context Window | Max Output |
|----------|------------|----------------|------------|
| `claude-3-opus` | Claude 3 Opus | 200,000 tokens | 4,096 tokens |
| `claude-3-sonnet` | Claude 3 Sonnet | 200,000 tokens | 4,096 tokens |
| `claude-3-haiku` | Claude 3 Haiku | 200,000 tokens | 4,096 tokens |

### Google Gemini (Coming Soon)

| Model ID | Model Name | Context Window | Max Output |
|----------|------------|----------------|------------|
| `gemini-1.5-pro` | Gemini 1.5 Pro | 1,000,000 tokens | 8,192 tokens |
| `gemini-1.5-flash` | Gemini 1.5 Flash | 1,000,000 tokens | 8,192 tokens |

## How It Works

### Message Flow

```
User sends message
    ↓
Chat Service stores user message in DB
    ↓
Chat Service builds conversation history (last 50 messages)
    ↓
Chat Service adds preset's system instruction (if any)
    ↓
AI Service routes to appropriate provider (OpenAI/Claude/Gemini)
    ↓
Provider generates completion
    ↓
AI Service returns reply
    ↓
Chat Service stores assistant message in DB
    ↓
Both messages returned to user
```

### Provider Routing

The service automatically routes requests to the correct provider based on the model ID:

- Models starting with `gpt-` → OpenAI
- Models starting with `claude-` → Anthropic (coming soon)
- Models starting with `gemini-` → Google (coming soon)

### Mock Mode

If no API key is configured, the service falls back to mock responses for development:

```typescript
// Without OPENAI_API_KEY in .env
const reply = await aiService.generateReply('gpt-4o', null, messages);
// Returns: "I understand you said: "..." As an AI assistant powered by gpt-4o..."
```

## Error Handling

The service handles various error scenarios:

```typescript
try {
  const reply = await aiService.generateReply('gpt-4o', null, messages);
} catch (error) {
  if (error instanceof ServiceUnavailableException) {
    // API key invalid, rate limit exceeded, or provider error
  }
  if (error instanceof BadRequestException) {
    // Invalid input (e.g., missing model)
  }
}
```

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Invalid API key | 503 | Wrong or expired API key | Check OPENAI_API_KEY in .env |
| Rate limit exceeded | 503 | Too many requests | Wait or upgrade OpenAI plan |
| No response from AI provider | 503 | Empty response | Retry or check provider status |
| Model is required | 400 | Missing model parameter | Provide valid model ID |

## Configuration

### Temperature

Default: `0.7` (balanced creativity)

To customize, edit `ai.service.ts`:

```typescript
const completion = await this.openai.chat.completions.create({
  model: this.mapToOpenAIModel(model),
  messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
  temperature: 0.7,  // 0.0 = deterministic, 1.0 = creative
  max_tokens: 4096,
});
```

### Max Tokens

Default: `4096` tokens

Adjust based on your needs:
- Short responses: 512-1024 tokens
- Medium responses: 1024-2048 tokens
- Long responses: 2048-4096 tokens

## Extending to New Providers

### Add Anthropic Claude

1. Install SDK:
```bash
pnpm --filter @whalli/backend add @anthropic-ai/sdk
```

2. Add to `ai.service.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

private anthropic: Anthropic | null = null;

constructor(private readonly configService: ConfigService) {
  // ... existing OpenAI setup ...
  
  const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
  if (anthropicKey) {
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
  }
}

private isClaudeModel(model: string): boolean {
  return model.startsWith('claude-');
}

private async generateClaudeReply(
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  // Implement Claude API call
}
```

3. Update routing in `generateReply()`:
```typescript
if (this.isClaudeModel(model)) {
  return this.generateClaudeReply(model, fullMessages);
}
```

## Testing

### Test with cURL

```bash
# 1. Register a user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the accessToken from response

# 3. Create a chat
curl -X POST http://localhost:3001/chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat","model":"gpt-4o"}'

# Save the chat id from response

# 4. Send a message (AI-powered)
curl -X POST http://localhost:3001/chat/CHAT_ID/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello! Can you help me learn TypeScript?"}'
```

### Expected Response

```json
{
  "userMessage": {
    "id": "...",
    "role": "USER",
    "content": "Hello! Can you help me learn TypeScript?",
    "chatId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "assistantMessage": {
    "id": "...",
    "role": "ASSISTANT",
    "content": "Of course! TypeScript is a strongly typed programming language...",
    "chatId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

## Performance

### Token Usage

OpenAI charges based on token usage:
- Input tokens (prompt + history)
- Output tokens (generated response)

Track usage via logs:
```
[AiService] OpenAI completion successful. Tokens: 1500
```

### Optimization Tips

1. **Limit conversation history**: Currently limited to last 50 messages
2. **Short system instructions**: Keep presets concise (max 2000 chars)
3. **Use appropriate models**:
   - `gpt-3.5-turbo` for simple tasks (cheaper, faster)
   - `gpt-4o` for complex reasoning (slower, more expensive)

## Security

### API Key Protection

- ✅ Never commit API keys to git
- ✅ Store in `.env` file (already in `.gitignore`)
- ✅ Use environment variables only
- ✅ Rotate keys regularly

### Rate Limiting

The backend has built-in rate limiting:
- 100 requests per 60 seconds per IP
- Configured in `main.ts` with `@nestjs/throttler`

### Input Validation

Messages are validated:
- Content length: 1-50,000 characters
- Role: must be 'USER', 'ASSISTANT', or 'SYSTEM'
- Handled by `class-validator` decorators

## Logs

The service logs key events:

```
[AiService] OpenAI client initialized
[AiService] Generating OpenAI completion with model: gpt-4o
[AiService] OpenAI completion successful. Tokens: 1500
```

Or in mock mode:
```
[AiService] OPENAI_API_KEY not found - AI service will use mock responses
[AiService] Model gpt-4o not yet implemented, using mock response
```

## Troubleshooting

### "OpenAI client not initialized"

**Cause**: No OPENAI_API_KEY in .env  
**Solution**: Add API key and restart backend

### "Invalid API key"

**Cause**: Wrong API key or expired  
**Solution**: Get new key from OpenAI dashboard

### "Rate limit exceeded"

**Cause**: Too many requests to OpenAI  
**Solution**: Wait 60 seconds or upgrade OpenAI plan

### "No response from AI provider"

**Cause**: OpenAI returned empty response  
**Solution**: Retry or check OpenAI status page

## Future Enhancements

- [ ] Streaming responses with Server-Sent Events
- [ ] Token usage tracking per user
- [ ] Cost estimation and budgets
- [ ] Anthropic Claude integration
- [ ] Google Gemini integration
- [ ] Vision support (image inputs)
- [ ] Function calling
- [ ] Conversation memory optimization
- [ ] Custom model parameters per preset
- [ ] A/B testing different models
