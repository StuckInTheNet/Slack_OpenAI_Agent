# Slack-OpenAI Agent 🤖

**Your team's AI assistant that keeps your data private and under YOUR control**

## Why This Bot? The Problem It Solves 🎯

Ever wished you could:
- Find that important message from 3 months ago? 
- Know what happened in Slack while you were on vacation?
- Get instant answers about your team's discussions?
- Have an AI assistant WITHOUT sending your private conversations to some company?

**This bot solves all of that - and your data never leaves your control.**

## 🔒 Privacy First: Your Data Stays YOURS

### What Makes This Different:

**❌ Other AI Slack Bots:**
- Your messages go to their servers
- They can read your private conversations
- Monthly subscriptions ($99-500/month)
- They control your data
- If they shut down, you lose everything

**✅ This Bot:**
- **Runs on YOUR computer/server**
- **Data stored locally in YOUR database**
- **You control everything**
- **One-time setup, no monthly fees**
- **Only pay for OpenAI API usage (~$1-5/month for most teams)**
- **Delete anytime and all data is gone**

## What Does This Bot Do? 🤔

Think of it as your team's **photographic memory** + **smart assistant**:

### 📊 **Analytics & Insights**
- "Who's our most active team member?"
- "What was our team sentiment this week?"
- "Show me our peak collaboration hours"

### 🔍 **Intelligent Search**
- "Find all messages about the Q3 budget"
- "What did Sarah say about the new feature?"
- "Show me all messages with links from last month"

### 📝 **Smart Summaries**
- "Summarize yesterday's discussion"
- "What did I miss while I was out?"
- "Give me the key decisions from this week"

### 💡 **Context-Aware Help**
- "What was the conclusion about the API redesign?"
- "Who's working on the mobile app?"
- "What are the current blockers?"

## The Money Talk 💰

### Traditional Slack AI Bots:
- **Slack AI**: $10/user/month (for 100 users = $1,000/month!)
- **Other SaaS bots**: $99-500/month
- **Enterprise solutions**: $1000+/month

### This Bot:
- **Setup**: FREE (your time)
- **Running costs**: 
  - OpenAI API: ~$1-5/month for normal usage
  - Server (optional): $0 if on your computer, $5-20/month for cloud
- **Total**: Under $25/month for UNLIMITED users

**Save $11,000+ per year for a 100-person team!**

## For Busy Managers: 3 Options to Get This Running 🎯

**🟢 OPTION 1 - Have Your IT Person Do It (30 minutes)**
- Send them this link: https://github.com/Stuckinthenet/slack-openai-agent
- They run the [setup wizard](#setup-wizard-method-recommended) 
- Total time: 30 minutes, Cost: $0

**🟡 OPTION 2 - Hire Someone ($100-300)**
- Post on Upwork/Fiverr: "Set up Node.js Slack bot from GitHub"
- Send them this repository link
- They handle everything remotely

**🔴 OPTION 3 - We Do It For You ($299)**
- [Contact us](#professional-setup-service-optional) for white-glove setup
- Includes security configuration and team training
- 30 days of support included

## What You Need Before Starting 📋

1. **A Slack workspace** (free or paid)
2. **Node.js** (free - download from nodejs.org)
3. **An OpenAI API account** (pay-as-you-go, ~$1-5/month)
4. **A computer or server** to run the bot

## Quick Start (15 Minutes) ⚡

### Choose Your Installation Method:

**🟢 SUPER EASY - No Technical Knowledge Required:**
- [One-Click Installer](#one-click-installer-easiest) (Windows/Mac app)
- [Download ZIP Method](#download-zip-method) (just download and double-click)

**🟡 EASY - Copy & Paste:**
- [Terminal Commands](#terminal-method-copy--paste) (what's shown below)

**🔴 ADVANCED - For Developers:**
- [Docker Container](#docker-method) 
- [Manual Build](#manual-installation)

---

## One-Click Installer (Easiest) 🎯

### For People Who Just Want It to Work:

**Download the ready-to-run app:**

**Windows:** [Download Slack-AI-Bot-Windows.exe](https://github.com/Stuckinthenet/slack-openai-agent/releases/latest/download/slack-ai-bot-windows.exe) (Coming Soon)

**Mac:** [Download Slack-AI-Bot-Mac.app](https://github.com/Stuckinthenet/slack-openai-agent/releases/latest/download/slack-ai-bot-mac.app) (Coming Soon)

1. **Download** the app for your system
2. **Double-click** to run it
3. **Follow the setup wizard** (it walks you through getting your Slack and OpenAI keys)
4. **Done!** The bot starts automatically

*The installer apps are currently in development. Use the ZIP method below for now.*

---

## Download ZIP Method 📦

### No Git, No Terminal, No Problem:

1. **Download:** Click here → [Download ZIP](https://github.com/Stuckinthenet/slack-openai-agent/archive/refs/heads/master.zip)

2. **Unzip:** Double-click the downloaded ZIP file

3. **Install Node.js** (if you don't have it):
   - **Windows:** Download from [nodejs.org](https://nodejs.org) → Run the installer
   - **Mac:** Download from [nodejs.org](https://nodejs.org) → Run the installer

4. **Open the folder** (the unzipped `slack-openai-agent-master` folder)

5. **Windows users:** Hold Shift + Right-click in the folder → "Open PowerShell window here"
   **Mac users:** Double-click `Terminal` in Applications → type `cd ` then drag the folder into Terminal

6. **Install dependencies:** Copy and paste this:
   ```bash
   npm install
   ```

7. **Continue to Step 2** (Create Your Slack App) below

---

## Setup Wizard Method (Recommended) 🧙‍♂️

### The Easiest Way - Interactive Setup:

After downloading (using any method above), run the setup wizard:

**Windows:** Double-click `setup-windows.bat`

**Mac/Linux:** Double-click `setup-mac.sh` (or run `./setup-mac.sh` in Terminal)

**Any system:** Run `node setup-wizard.js`

The wizard will:
- ✅ Check if everything is installed correctly
- ✅ Walk you through getting your API keys
- ✅ Create your configuration file automatically
- ✅ Test that everything works
- ✅ Start the bot for you

**This is the recommended method for non-technical users!**

---

## Terminal Method (Copy & Paste) 💻

### Step 1: Get the Bot Code (2 minutes)

```bash
# Copy and paste this into Terminal (Mac) or Command Prompt (Windows)
git clone https://github.com/Stuckinthenet/slack-openai-agent.git
cd slack-openai-agent
npm install
```

### Step 2: Create Your Slack App (5 minutes)

1. **Open**: https://api.slack.com/apps
2. **Click**: "Create New App" → "From scratch"
3. **Name it**: Something like "Team Assistant"
4. **Select**: Your workspace

### Step 3: Configure Permissions (3 minutes)

1. **Click**: "OAuth & Permissions" (left sidebar)
2. **Scroll to**: "Bot Token Scopes"
3. **Add ALL these** (just click "Add" and type each one):
   ```
   app_mentions:read
   channels:history
   channels:read
   chat:write
   commands
   users:read
   ```
4. **Click**: "Install to Workspace" (top of page)
5. **Copy**: The token starting with `xoxb-` (save this!)

### Step 4: Enable Real-time Connection (2 minutes)

1. **Click**: "Socket Mode" (left sidebar)
2. **Toggle**: Turn ON
3. **Click**: "Generate Token"
4. **Name**: "socket"
5. **Copy**: Token starting with `xapp-` (save this!)

### Step 5: Setup Events (2 minutes)

1. **Click**: "Event Subscriptions"
2. **Toggle**: Turn ON
3. **Add these bot events**:
   - `app_mention`
   - `message.channels`
4. **Save Changes**

### Step 6: Get OpenAI Key (1 minute)

1. **Go to**: https://platform.openai.com/api-keys
2. **Click**: "Create new secret key"
3. **Copy**: The key starting with `sk-`

### Step 7: Connect Everything (2 minutes)

```bash
# In the bot folder, run:
cp .env.example .env
```

Edit `.env` file and paste your tokens:
```
SLACK_BOT_TOKEN=xoxb-(your token)
SLACK_SIGNING_SECRET=(from Basic Information page)
SLACK_APP_TOKEN=xapp-(your token)
OPENAI_API_KEY=sk-(your key)
```

### Step 8: Start! 🚀

```bash
npm start
```

You'll see: "⚡️ Slack bot is running!"

### Step 9: Use It!

In Slack:
1. Invite bot to a channel: `/invite @YourBot`
2. Ask something: `@YourBot who talked most today?`

---

## Docker Method (One Command) 🐳

### For People Who Know Docker:

**Option 1: Docker Compose (Recommended)**
```bash
# Download the project
git clone https://github.com/Stuckinthenet/slack-openai-agent.git
cd slack-openai-agent

# Copy and edit your environment file
cp .env.example .env
# Edit .env with your keys

# Start with docker-compose
docker-compose up -d
```

**Option 2: Docker Run**
```bash
# Create a folder for your bot data
mkdir slack-bot && cd slack-bot

# Create your .env file
curl -o .env.example https://raw.githubusercontent.com/Stuckinthenet/slack-openai-agent/master/.env.example
cp .env.example .env

# Edit .env with your keys, then run:
docker run -d --name slack-bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -p 3001:3001 \
  stuckinthenet/slack-openai-agent
```

---

## For Non-Technical Teams: We Can Set It Up For You! 🤝

### Professional Setup Service (Optional)

If your team wants this bot but doesn't want to deal with the technical setup:

**What we offer:**
- ✅ Complete setup on your server/computer
- ✅ Security configuration 
- ✅ Custom training for your team
- ✅ 30 days of support
- ✅ Documentation for your IT team

**Cost:** $299 one-time setup fee

**Contact:** [Open an issue](https://github.com/Stuckinthenet/slack-openai-agent/issues) with "Setup Service" in the title

### Alternative: Hire a Local Developer

Search for "Node.js developer" in your area and show them this repository. Most developers can set this up in 1-2 hours (cost: $100-300).

---

## Video Tutorials (Coming Soon) 📹

We're creating video walkthrough tutorials:

- [ ] **"Complete Setup in 15 Minutes"** - Step-by-step screen recording
- [ ] **"Windows Installation Guide"** - Specific to Windows users  
- [ ] **"Mac Installation Guide"** - Specific to Mac users
- [ ] **"First 10 Questions to Ask Your Bot"** - Getting the most value
- [ ] **"Advanced Configuration"** - Custom prompts and settings

*Subscribe to repo notifications to get notified when these are ready!*

## Power User Features 💪

### Slash Commands
- `/ai-summary 24` - Last 24 hours summary
- `/ai-search project deadline` - Search everything
- `/ai-report weekly` - Generate analytics report
- `/ai-help` - Show all commands

### Natural Language Queries
```
@Bot "What did we decide about the pricing?"
@Bot "Summarize #general from yesterday"
@Bot "Find all messages about bugs"
@Bot "What's the team mood today?"
@Bot "Who hasn't participated this week?"
```

### API Access (for developers)
```javascript
// Get analytics
GET http://localhost:3001/api/analytics

// Export data
GET http://localhost:3001/api/export?format=csv

// Search programmatically  
GET http://localhost:3001/api/search?query=important
```

## Data Storage & Privacy 🔐

### Where Your Data Lives:
- **Local SQLite database** (`slack_data.db` file)
- **On YOUR machine/server only**
- **Never sent to external servers** (except OpenAI for processing)
- **You can delete it anytime**

### What Gets Stored:
- Message text and metadata
- User names and IDs
- Channel information
- Timestamps
- Thread relationships

### What DOESN'T Happen:
- ❌ No data mining
- ❌ No selling to advertisers
- ❌ No tracking
- ❌ No mysterious "training" on your data
- ❌ No backdoors

### GDPR/Compliance Ready:
- ✅ Data stays in your country
- ✅ Full control over deletion
- ✅ Audit trail available
- ✅ Export capabilities
- ✅ No third-party data processors (except OpenAI for queries)

## Advanced Setup Options 🛠️

### Run 24/7 on a Server

**Option 1: Your Office Computer**
```bash
# Keep running even when logged out
npm install -g pm2
pm2 start index-enhanced.js
pm2 save
pm2 startup
```

**Option 2: Cloud Server ($5-20/month)**
- DigitalOcean Droplet
- AWS EC2 t2.micro (free tier)
- Google Cloud f1-micro
- Your company's existing server

### Use Different AI Models

In `.env`:
```bash
# Cheaper, faster ($0.002/1K tokens)
OPENAI_MODEL=gpt-3.5-turbo

# Smarter, better understanding ($0.01/1K tokens)
OPENAI_MODEL=gpt-4-turbo-preview

# Latest and greatest
OPENAI_MODEL=gpt-4o
```

### Customize Behavior

Edit `index-enhanced.js`:
```javascript
// Change how creative responses are
temperature: 0.3  // More focused
temperature: 0.9  // More creative

// Change response length
max_tokens: 500   // Shorter
max_tokens: 2000  // Longer

// Change cache time
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
```

## Real ROI Examples 💵

### Small Startup (10 people)
- **Time saved**: 2 hours/week finding information
- **Value**: 20 hours × $50/hour = $1,000/week
- **Cost**: ~$5/month
- **ROI**: 200x

### Medium Company (100 people)
- **Before**: Slack AI at $10/user = $1,000/month
- **Now**: This bot = ~$20/month
- **Savings**: $980/month = $11,760/year

### Enterprise (1000+ people)
- **Enterprise Slack AI quote**: $50,000/year
- **This solution**: ~$100/month = $1,200/year
- **Savings**: $48,800/year

## Security Best Practices 🛡️

### Must Do:
1. **Rotate API keys monthly**
2. **Never commit `.env` to GitHub**
3. **Use read-only database backups**
4. **Limit bot to necessary channels only**
5. **Review access logs regularly**

### Optional but Recommended:
1. **Encrypt database at rest**
2. **Use environment-specific configs**
3. **Set up alerts for unusual activity**
4. **Implement rate limiting**
5. **Regular security audits**

## Troubleshooting Guide 🔧

### "Bot not responding"
```bash
# Check if running
ps aux | grep node

# Check logs
npm start

# Restart
npm start
```

### "Invalid token"
- Regenerate token in Slack app settings
- Make sure no extra spaces in `.env`
- Check token starts with correct prefix

### "OpenAI error"
- Check API key has credits
- Verify billing is set up
- Try GPT-3.5 instead of GPT-4

### "Database error"
```bash
# Reset database (warning: loses history)
rm slack_data.db
npm start
```

## Frequently Asked Questions ❓

**Q: Can my boss see what I ask the bot?**
A: Only if they have access to the server running the bot.

**Q: Does it work with private channels?**
A: Yes, if you invite the bot to them.

**Q: How much OpenAI API cost?**
A: Most teams use $1-5/month. Heavy use might be $10-20.

**Q: Can I run multiple workspaces?**
A: Yes, run separate instances with different `.env` files.

**Q: Is this legal for my company?**
A: Yes, but check your company's AI and data policies.

**Q: Can I customize what it says?**
A: Yes! Edit the system prompts in the code.

**Q: What if OpenAI goes down?**
A: The bot stops answering but your data is safe.

## Contributing & Support 🤝

### Need Help?
1. Check the FAQ above
2. Open an issue on GitHub
3. Read the troubleshooting guide

### Want to Contribute?
- Fork the repo
- Add your feature
- Submit a pull request

### Feature Requests?
Open an issue with your idea!

## Legal Stuff 📜

- **License**: ISC (use it however you want)
- **No Warranty**: This is free software, use at your own risk
- **Your Responsibility**: Comply with your company's policies
- **OpenAI Terms**: You're bound by OpenAI's terms for API usage

## The Bottom Line 📌

**You get**:
- ✅ Full control of your data
- ✅ 95% cost savings vs SaaS alternatives  
- ✅ Customizable to your needs
- ✅ No vendor lock-in
- ✅ Privacy and security
- ✅ Unlimited users
- ✅ All the features of expensive alternatives

**You avoid**:
- ❌ Monthly subscriptions
- ❌ Data leaving your control
- ❌ Per-user pricing
- ❌ Vendor lock-in
- ❌ Privacy concerns
- ❌ Usage limits

---

**Built for teams who value privacy, control, and saving money.**

*Your Slack. Your data. Your AI. Your way.*

🌟 **Star this repo if it saved your team money!**