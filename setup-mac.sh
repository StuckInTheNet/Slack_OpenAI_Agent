#!/bin/bash

echo ""
echo "===================================="
echo "  SLACK AI BOT - MAC/LINUX SETUP"
echo "===================================="
echo ""
echo "This will set up your Slack AI bot automatically!"
echo ""

# Check if we're in the right directory
if [ ! -f "setup-wizard.js" ]; then
    echo "❌ Can't find setup-wizard.js"
    echo ""
    echo "Make sure you're running this from the bot folder!"
    echo "You should see files like: setup-wizard.js, package.json"
    echo ""
    echo "Current folder: $(pwd)"
    echo ""
    echo "Need help? Check SETUP-HELP.md"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to: https://nodejs.org"
    echo "2. Download and install Node.js"
    echo "3. Restart this script"
    echo ""
    echo "Need help? Check SETUP-HELP.md"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Node.js found!"
node --version
echo ""

# Install dependencies
echo "📦 Installing bot dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies"
    echo ""
    echo "Try running this manually:"
    echo "1. Open Terminal in this folder"
    echo "2. Type: npm install"
    echo "3. Type: node setup-wizard.js"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✅ Dependencies installed!"
echo ""

# Make sure the wizard is executable
chmod +x setup-wizard.js

# Run the setup wizard
echo "🧙‍♂️ Starting setup wizard..."
echo "Follow the prompts to enter your API keys!"
echo ""
node setup-wizard.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Setup wizard had an error"
    echo "Try running: node setup-wizard.js"
    echo ""
    read -p "Press Enter to exit..."
fi