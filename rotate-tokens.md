# 🚨 URGENT: Rotate Your Exposed Tokens

Since your tokens were exposed in this conversation, follow these steps immediately:

## 1. Rotate Slack Tokens
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your app
3. **Bot Token**: OAuth & Permissions → Reinstall app → Copy new token
4. **Signing Secret**: Basic Information → Regenerate signing secret
5. **App Token**: Basic Information → App-Level Tokens → Regenerate

## 2. Rotate OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Delete the exposed key
3. Create a new API key
4. Copy immediately (won't be shown again)

## 3. Update Your .env File

Add these to your `.env` file:

```
# Slack Configuration (NEW TOKENS)
SLACK_BOT_TOKEN=xoxb-your-new-bot-token
SLACK_SIGNING_SECRET=your-new-signing-secret
SLACK_APP_TOKEN=xapp-your-new-app-token

# OpenAI Configuration (NEW KEY)
OPENAI_API_KEY=sk-your-new-openai-key

# Port Configuration
PORT=3000
API_PORT=3001

# Security Configuration (ADD THIS!)
API_SECRET_KEY=22f3d402979ef05308544ca3d38f19eea306b32f5f3a5f8a8b066f57074f670e
ALLOWED_ORIGINS=http://localhost:3000
```

## 4. Secure the Database

```bash
# Set restrictive permissions on database
chmod 600 slack_data.db

# Create backup
cp slack_data.db slack_data.backup.db
```

## 5. Test the Secure Version

```bash
# Stop current bot
# Start secure version
node index-secure.js
```

## 6. Test API with Authentication

```bash
# Without auth (should fail)
curl http://localhost:3001/api/recent

# With auth (should work)
curl -H "X-API-Key: 22f3d402979ef05308544ca3d38f19eea306b32f5f3a5f8a8b066f57074f670e" \
     http://localhost:3001/api/recent
```

## 7. Monitor for Unauthorized Access

Check your Slack app's activity logs regularly:
- api.slack.com/apps → Your App → Activity

## Remember:
- NEVER commit `.env` to Git
- NEVER share API keys in chat/email
- Rotate keys regularly (monthly)
- Use different keys for dev/prod