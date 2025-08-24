# Slack-OpenAI Agent 🤖

An intelligent Slack bot that integrates with OpenAI's GPT models to provide context-aware responses, analytics, and automated insights for your Slack workspace.

## ✨ Features

### Core Capabilities
- **AI-Powered Responses**: Uses OpenAI GPT-3.5/GPT-4 for intelligent conversation
- **Message History**: Stores and searches through Slack conversation history
- **Context Awareness**: Provides relevant context from past messages
- **User Analytics**: Track user activity and engagement metrics
- **Smart Search**: Advanced message search with relevance scoring

### Enhanced Features (v2.0)
- **Intent Detection**: Automatically understands query types
- **Natural Language Time Parsing**: "last 3 hours", "yesterday", etc.
- **Slash Commands**: Quick access to summaries, search, and reports
- **Scheduled Reports**: Automated daily channel summaries
- **Sentiment Analysis**: Track channel mood and tone
- **Thread Tracking**: Better conversation threading support
- **Data Export**: Export conversation data as CSV or JSON
- **Performance Caching**: 5-minute cache for frequently accessed data

## Setup Instructions

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app and select your workspace

### 2. Configure OAuth & Permissions

1. Go to "OAuth & Permissions" in the sidebar
2. Add these Bot Token Scopes:
   - `app_mentions:read` - Read messages that mention your app
   - `chat:write` - Send messages
   - `channels:history` - View messages in public channels
   - `groups:history` - View messages in private channels
   - `im:history` - View direct messages
   - `mpim:history` - View group direct messages

3. Install the app to your workspace
4. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 3. Enable Socket Mode

1. Go to "Socket Mode" in the sidebar
2. Enable Socket Mode
3. Generate an app-level token with `connections:write` scope
4. Copy the token (starts with `xapp-`)

### 4. Configure Event Subscriptions

1. Go to "Event Subscriptions" in the sidebar
2. Enable Events
3. Subscribe to bot events:
   - `app_mention` - When someone mentions your bot
   - `message.channels` - Messages in public channels
   - `message.groups` - Messages in private channels
   - `message.im` - Direct messages
   - `message.mpim` - Group direct messages

### 5. Get Your Signing Secret

1. Go to "Basic Information" in the sidebar
2. Copy the "Signing Secret"

### 6. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key

### 7. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials:
   - `SLACK_BOT_TOKEN`: Your bot token (xoxb-...)
   - `SLACK_SIGNING_SECRET`: Your signing secret
   - `SLACK_APP_TOKEN`: Your app token (xapp-...)
   - `OPENAI_API_KEY`: Your OpenAI API key (sk-...)

### 8. Run the Bot

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

## 💬 Usage

### Slash Commands
- `/ai-summary [hours]` - Get channel activity summary
- `/ai-search <query>` - Search through message history
- `/ai-report [type]` - Generate analytics report
- `/ai-help` - Show available commands

### Mention the Bot
- **Ask questions**: `@YourBot who talked the most today?`
- **Get summaries**: `@YourBot summarize the last 3 hours`
- **Search messages**: `@YourBot find messages about the project`
- **Analyze sentiment**: `@YourBot what's the mood in the channel?`

### API Endpoints
The bot includes a REST API on port 3001:
- `GET /api/search?query=<term>` - Search messages
- `GET /api/recent?hours=24` - Get recent messages
- `GET /api/analytics?channel=<id>` - Channel analytics
- `GET /api/export?format=csv` - Export data
- `GET /api/health` - System health check

## 🔒 Security Notes

⚠️ **Important Security Considerations:**
- Never commit `.env` files to version control
- Rotate API keys regularly
- Use environment variables for all secrets
- The bot stores message data - ensure compliance with your organization's data policies
- Enable rate limiting in production environments

## 🛠️ Development

### Running Different Versions
```bash
npm start              # Enhanced v2.0 with all features
npm run start:original # Original v1.0 basic version
```

### Customization

You can modify the OpenAI parameters in `.env`:
- `OPENAI_MODEL`: Use "gpt-4-turbo-preview" or "gpt-3.5-turbo"

In the code (`index-enhanced.js`):
- `max_tokens`: Adjust response length (default: 1500)
- `temperature`: Control creativity (0-1, default: 0.7)
- `CACHE_TTL`: Cache duration in seconds (default: 300)

## Troubleshooting

- Make sure all environment variables are set correctly
- Ensure the bot is invited to channels where you want to use it
- Check console logs for error messages
- Verify your OpenAI API key has credits available