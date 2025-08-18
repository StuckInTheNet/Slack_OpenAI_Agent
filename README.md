# Slack-OpenAI Bot

A Slack bot that integrates with OpenAI's GPT API to provide AI-powered responses in your Slack workspace.

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

## Usage

- **Mention the bot**: `@YourBotName What is the weather like?`
- **Direct message**: Send a DM to the bot
- **In channels**: The bot will respond when mentioned

## Features

- Responds to mentions and direct messages
- Uses GPT-3.5-turbo for responses
- Thread support for conversations
- Error handling

## Customization

You can modify the OpenAI parameters in `index.js`:
- `model`: Change to use different GPT models (e.g., "gpt-4")
- `max_tokens`: Adjust response length
- `temperature`: Control creativity (0-1, higher = more creative)

## Troubleshooting

- Make sure all environment variables are set correctly
- Ensure the bot is invited to channels where you want to use it
- Check console logs for error messages
- Verify your OpenAI API key has credits available