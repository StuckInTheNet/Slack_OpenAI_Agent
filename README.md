# Slack-OpenAI Agent 🤖

A smart bot that lives in your Slack workspace and can answer questions about your team's conversations!

## What Does This Bot Do? 🤔

Imagine having a super-smart assistant in your Slack that:
- **Remembers everything**: It saves all the messages in your channels (like taking notes in class)
- **Answers questions**: Ask it "Who talked the most today?" and it knows!
- **Makes summaries**: It can tell you what happened while you were away
- **Searches old messages**: Like Google, but for your Slack conversations

## What You Need Before Starting 📋

Think of these as ingredients for a recipe:
1. **A Slack workspace** (your team's Slack)
2. **Node.js** (this runs the bot - like having electricity to power a robot)
3. **An OpenAI account** (this is the bot's brain)
4. **A computer** to run the bot on

## Step-by-Step Setup Guide 🚀

### Step 1: Download the Bot

First, get the bot's code on your computer:

```bash
# This is like downloading an app
git clone https://github.com/Stuckinthenet/slack-openai-agent.git

# Go into the bot's folder
cd slack-openai-agent

# Install what the bot needs to work
npm install
```

### Step 2: Create Your Slack Bot

1. **Go to Slack's bot creation page**: https://api.slack.com/apps
2. **Click the big green "Create New App" button**
3. **Choose "From scratch"** (we're building from zero!)
4. **Name your bot** (like "Office Assistant" or "Team Helper")
5. **Pick your workspace** (where your team chats)

### Step 3: Give Your Bot Permissions

Your bot needs permission to read and send messages (like giving someone a key to your office).

1. **In the left sidebar, click "OAuth & Permissions"**
2. **Scroll down to "Scopes"**
3. **Add these permissions** (copy exactly):
   - `app_mentions:read` (so it knows when someone talks to it)
   - `channels:history` (so it can read channel messages)
   - `channels:read` (so it knows what channels exist)
   - `chat:write` (so it can reply)
   - `commands` (so slash commands work)
   - `users:read` (so it knows who's who)
4. **Click "Install to Workspace"** at the top
5. **Copy the token that starts with `xoxb-`** (this is like your bot's password)

### Step 4: Turn on Socket Mode

This lets your bot connect to Slack in real-time (like turning on notifications).

1. **Click "Socket Mode" in the sidebar**
2. **Turn it ON** (toggle the switch)
3. **Click "Generate" to create an app token**
4. **Name it anything** (like "socket-token")
5. **Copy the token that starts with `xapp-`**

### Step 5: Set Up Events

This tells your bot what to listen for.

1. **Click "Event Subscriptions" in the sidebar**
2. **Turn it ON**
3. **Under "Subscribe to bot events", click "Add Bot User Event"**
4. **Add these events**:
   - `app_mention` (when someone @mentions your bot)
   - `message.channels` (messages in public channels)
5. **Click "Save Changes"**

### Step 6: Add Slash Commands (Optional but Cool!)

These are quick commands that start with `/`

1. **Click "Slash Commands" in the sidebar**
2. **Click "Create New Command"**
3. **Add these commands** (one at a time):
   - Command: `/ai-summary` | Description: Get a summary of recent chat
   - Command: `/ai-search` | Description: Search for messages
   - Command: `/ai-help` | Description: Get help using the bot

### Step 7: Get Your OpenAI Key

This gives your bot its intelligence.

1. **Go to**: https://platform.openai.com/api-keys
2. **Sign up or log in**
3. **Click "Create new secret key"**
4. **Copy the key that starts with `sk-`** (SAVE THIS! You can't see it again)

### Step 8: Connect Everything Together

Now we tell the bot all these passwords and tokens.

1. **In the bot's folder, copy the example file**:
```bash
cp .env.example .env
```

2. **Open `.env` in any text editor** (like Notepad)

3. **Replace the fake values with your real ones**:
```
SLACK_BOT_TOKEN=xoxb-(paste your bot token here)
SLACK_SIGNING_SECRET=(find this in Basic Information on Slack)
SLACK_APP_TOKEN=xapp-(paste your socket token here)
OPENAI_API_KEY=sk-(paste your OpenAI key here)
```

### Step 9: Start Your Bot! 🎉

```bash
npm start
```

If you see "⚡️ Slack bot is running!" - YOU DID IT! 🎊

### Step 10: Talk to Your Bot

1. **Go to your Slack workspace**
2. **Invite the bot to a channel**: Type `/invite @YourBotName`
3. **Say hi**: Type `@YourBotName hello!`

## How to Use Your Bot 💬

### Ask It Questions
- `@YourBot who sent the most messages today?`
- `@YourBot what did John say about the project?`
- `@YourBot summarize the last 2 hours`

### Use Slash Commands
- `/ai-summary` - Get a quick summary
- `/ai-search pizza` - Find all messages about pizza
- `/ai-help` - Get help

## Common Problems and Fixes 🔧

### Bot Doesn't Reply?
- ✅ Make sure you invited it to the channel
- ✅ Check if the bot is running (you should see messages in terminal)
- ✅ Make sure you @mention the bot

### "Invalid Token" Error?
- ✅ Double-check you copied the tokens correctly
- ✅ Make sure there are no extra spaces
- ✅ Regenerate the token if needed

### Bot Seems Dumb?
- ✅ It needs time to collect messages first
- ✅ Make sure your OpenAI key has credits
- ✅ Try being more specific with questions

## Understanding the Files 📁

- **index-enhanced.js** - The bot's main brain (the new, smarter version)
- **index.js** - The bot's simple brain (the original version)
- **database-enhanced.js** - Where the bot saves messages (like its memory)
- **.env** - Your secret passwords (NEVER share this file!)
- **package.json** - List of things the bot needs to work

## Want to Change Something? 🛠️

### Make the Bot Smarter or Dumber
In your `.env` file, change:
- `OPENAI_MODEL=gpt-3.5-turbo` (faster, cheaper)
- `OPENAI_MODEL=gpt-4-turbo-preview` (smarter, costs more)

### Run the Simple Version
If the enhanced version is too complex:
```bash
npm run start:original
```

## Safety Rules 🔒

1. **NEVER share your `.env` file** - It has your passwords!
2. **NEVER commit `.env` to GitHub** - Bad people could use your keys
3. **The bot saves messages** - Make sure your team is OK with this
4. **Rotate keys regularly** - Like changing passwords

## Need Help? 🆘

1. **Check if the bot is running** - You should see text in your terminal
2. **Make sure all tokens are correct** - One wrong character breaks everything
3. **The bot needs to be invited** - It can't read channels it's not in
4. **OpenAI needs credits** - Free accounts have limits

## Fun Things to Try 🎮

Once your bot is working:
- Ask it to find the funniest message from last week
- Get a morning summary of overnight messages
- Search for all messages with links
- Ask who's been most active
- Get the "vibe" of the channel (is everyone happy? stressed?)

## The Technical Stuff (If You're Curious) 🤓

- **Database**: SQLite (a simple file that stores data)
- **Cache**: Remembers recent searches for 5 minutes (faster responses)
- **API**: Has web endpoints if you want to connect other tools
- **Scheduled Reports**: Can send daily summaries automatically

---

**Remember**: This bot is like a helpful intern - it gets smarter the more messages it sees, but always double-check important information!

**Made with ❤️ for teams who want a smarter Slack**