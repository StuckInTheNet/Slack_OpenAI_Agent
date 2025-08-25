#  Quick Setup Guide

**Can't figure out how to run the setup wizard? Start here!**

## Step 1: Do you have Node.js?

Open Terminal (Mac) or PowerShell (Windows) and type:
```
node --version
```

- **If you see a version number**: Great! Go to Step 2
- **If you get an error**: Download Node.js from [nodejs.org](https://nodejs.org) → Install it → Try again

## Step 2: Are you in the right folder?

You should see these files:
- `setup-wizard.js`
- `setup-windows.bat` 
- `setup-mac.sh`
- `package.json`

If you don't see these files, you're in the wrong folder!

## Step 3: Run the wizard

### Windows (3 ways to try):
1. **Double-click** `setup-windows.bat`
2. **Right-click** `setup-windows.bat` → "Run as administrator"
3. **Hold Shift + Right-click** in folder → "Open PowerShell" → Type: `node setup-wizard.js`

### Mac (3 ways to try):
1. **Double-click** `setup-mac.sh`
2. **Right-click** `setup-mac.sh` → "Open" → Click "Open" again  
3. **Open Terminal** → Type `cd ` → **Drag the folder** into Terminal → Press Enter → Type: `node setup-wizard.js`

### Linux:
```bash
cd /path/to/Slack_OpenAI_Agent-master
chmod +x setup-mac.sh
./setup-mac.sh
```

## Still not working?

### Try the manual method:

1. **Open Terminal/PowerShell in the bot folder**
2. **Install dependencies**: `npm install`
3. **Run wizard**: `node setup-wizard.js`

### Get help:
- Read the full instructions: [README.md](./README.md)
- Ask for help: [Open an issue](https://github.com/StuckInTheNet/Slack_OpenAI_Agent/issues)

---

**The wizard is interactive - it will guide you step by step once it starts!**

## ⚠️ Important Security Step

The wizard will ask for your **Slack User ID** to keep the bot private to only you.

**How to find your Slack User ID:**
1. Click your profile picture in Slack
2. Click "View profile"  
3. Click "..." → "Copy member ID"
4. It looks like: U1234567890

**Without this, anyone in your company can use your bot and access sensitive information!**