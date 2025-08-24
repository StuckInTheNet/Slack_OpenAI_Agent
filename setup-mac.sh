#!/bin/bash

echo ""
echo "===================================="
echo "  SLACK AI BOT - MAC/LINUX SETUP"
echo "===================================="
echo ""
echo "This will set up your Slack AI bot automatically!"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Go to: https://nodejs.org"
    echo "2. Download and install Node.js"
    echo "3. Restart this script"
    echo ""
    exit 1
fi

echo "✅ Node.js found!"
echo ""

# Install dependencies
echo "📦 Installing bot dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies"
    exit 1
fi

echo "✅ Dependencies installed!"
echo ""

# Make sure the wizard is executable
chmod +x setup-wizard.js

# Run the setup wizard
echo "🧙‍♂️ Starting setup wizard..."
echo ""
node setup-wizard.js