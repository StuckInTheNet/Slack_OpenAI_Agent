# Dual-Interface Slack-OpenAI Setup Guide

## Overview
This enhanced bot provides **two ways** to interact with your Slack data:
1. **In Slack**: `@bot What happened in #engineering today?`
2. **In OpenAI**: Custom GPT that queries your Slack data via API

## Architecture
```
Slack Messages → SQLite Database ← API Server ← OpenAI Custom GPT
                      ↑
                 Slack Bot (continuous monitoring)
```

## Setup Instructions

### 1. Slack Bot Setup (Enhanced Permissions)
Follow the original README.md setup, but add these additional Bot Token Scopes:
- `channels:read` - Read public channel information
- `groups:read` - Read private channel information  
- `users:read` - Read user information
- `channels:history` - Read message history from public channels
- `groups:history` - Read message history from private channels

### 2. Run the Enhanced Bot
```bash
# Copy environment file
cp .env.example .env

# Add your tokens to .env
# SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN, OPENAI_API_KEY

# Install and start
npm install
npm start
```

The bot now runs TWO servers:
- **Port 3000**: Slack bot (WebSocket)
- **Port 3001**: API server for OpenAI

### 3. Let the Bot Collect Data
- Invite the bot to channels: `/invite @yourbotname`
- Let it run for a few hours to collect message history
- The bot automatically stores all messages it can see

### 4. Test the API Endpoints
```bash
# Search for messages
curl "http://localhost:3001/api/search?query=deployment"

# Get recent messages
curl "http://localhost:3001/api/recent?hours=24&limit=10"

# Get channel summary (need channel ID)
curl "http://localhost:3001/api/summary?channel=C1234567890&hours=24"

# Health check
curl "http://localhost:3001/api/health"
```

### 5. Create OpenAI Custom GPT

#### Option A: Using OpenAI Web Interface
1. Go to [chat.openai.com](https://chat.openai.com)
2. Click your profile → "My GPTs" → "Create a GPT"
3. Use the configuration from `openai-gpt-config.json`
4. Set the API base URL to your server (e.g., `http://localhost:3001`)

#### Option B: Using OpenAI API (Programmatic)
```bash
# Create assistant via API (requires OpenAI API key)
curl -X POST "https://api.openai.com/v1/assistants" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d @openai-gpt-config.json
```

### 6. Usage Examples

#### In Slack:
- `@bot What's been discussed in #engineering today?`
- `@bot Summarize the conversation about the new feature`
- `@bot Who was talking about deployment issues?`

#### In OpenAI Custom GPT:
- "What happened in my Slack workspace today?"
- "Search for discussions about our product launch"
- "Show me activity in #general this week"
- "Find messages mentioning 'bug' or 'issue'"

## API Endpoints Reference

### GET /api/search
Search messages containing specific text
- `query` (required): Text to search for
- `hours` (optional): Hours to look back (default: 24)
- `limit` (optional): Max results (default: 50)

### GET /api/recent  
Get recent messages from channels
- `channel` (optional): Specific channel ID
- `hours` (optional): Hours to look back (default: 24)
- `limit` (optional): Max messages (default: 100)

### GET /api/summary
Get channel activity summary
- `channel` (required): Channel ID to summarize
- `hours` (optional): Hours to summarize (default: 24)

### GET /api/context
Get enhanced context for queries
- `query` (required): Query to get context for
- `channel` (optional): Focus on specific channel

## Database Schema
The bot stores data in `slack_data.db` (SQLite):
- **messages**: All Slack messages with metadata
- **channels**: Channel information
- **users**: User profiles

## Security Notes
- API server has no authentication (localhost only)
- For production, add API authentication
- Database contains sensitive Slack data
- Consider data retention policies

## Troubleshooting

### Bot not storing messages:
- Check bot has correct permissions
- Ensure bot is invited to channels
- Check console logs for errors

### API endpoints not working:
- Verify API server is running on port 3001
- Check `npm start` output for errors
- Test with curl commands

### OpenAI Custom GPT not connecting:
- Ensure API server is accessible to OpenAI
- For local development, use ngrok or similar tunnel
- Check API endpoint URLs in GPT configuration

## Production Deployment
For production use:
1. Deploy to cloud service (AWS, Google Cloud, etc.)
2. Add API authentication
3. Use managed database (PostgreSQL)
4. Set up proper logging and monitoring
5. Configure HTTPS for API endpoints