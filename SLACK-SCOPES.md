# Required Slack Scopes

When setting up your Slack app, you need to add these **Bot Token Scopes**:

## ✅ Required Scopes
- **app_mentions:read** - So the bot knows when you mention it
- **channels:history** - So the bot can read channel messages
- **channels:read** - So the bot knows what channels exist
- **chat:write** - So the bot can send messages

## 🔧 Optional Scopes (add if available)
- **commands** - For slash commands like /ai-summary
- **users:read** - To get user names (bot works without this)

## 📍 Where to Add Scopes

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your app
3. Click **"OAuth & Permissions"** in the sidebar
4. Scroll to **"Bot Token Scopes"** 
5. Click **"Add an OAuth Scope"**
6. Add each scope from the required list above

## ⚠️ If a Scope Doesn't Exist

If you can't find `users:read` or another scope:
- **Skip it** - the bot will still work
- The bot just won't be able to get user display names
- It will use user IDs instead

## 🚨 Common Issues

**"Can't find users:read scope"**
→ Skip it - not required for basic functionality

**"Bot doesn't respond to mentions"**
→ Make sure you have `app_mentions:read`

**"Bot can't read messages"**
→ Make sure you have `channels:history`

**"Bot can't send messages"**
→ Make sure you have `chat:write`

After adding scopes, click **"Install to Workspace"** to update your bot's permissions.

## 🔌 Socket Mode Setup (Step 3)

After setting up scopes, you need to enable Socket Mode:

1. Click **"Socket Mode"** in the left sidebar
2. **Toggle it ON** (you'll see "Enable Socket Mode" switch)
3. After enabling, you'll see **"App-Level Tokens"** section appear
4. Click **"Generate Token"** button in that section
5. In the popup:
   - Name: `socket` (or any name you want)
   - Scopes: Add `connections:write`
   - Click **"Generate"**
6. **Copy the token** (starts with `xapp-`)

## 📸 What You'll See:

**Before enabling Socket Mode:**
- Just a toggle switch that says "Enable Socket Mode"

**After enabling Socket Mode:**
- The toggle is ON
- A new section appears: "App-Level Tokens"
- A "Generate Token" button in that section

**After clicking "Generate Token":**
- A popup asking for token name and scopes
- Another "Generate" button in the popup