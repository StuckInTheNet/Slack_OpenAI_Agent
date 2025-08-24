@echo off
echo.
echo ====================================
echo   SLACK AI BOT - WINDOWS SETUP
echo ====================================
echo.
echo This will set up your Slack AI bot automatically!
echo.

REM Check if we're in the right directory
if not exist "setup-wizard.js" (
    echo ❌ Can't find setup-wizard.js
    echo.
    echo Make sure you're running this from the bot folder!
    echo You should see files like: setup-wizard.js, package.json
    echo.
    echo Current folder: %cd%
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to: https://nodejs.org
    echo 2. Download and install Node.js
    echo 3. Restart this script
    echo.
    echo Need help? Check SETUP-HELP.md
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found!
node --version
echo.

REM Install dependencies
echo 📦 Installing bot dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error installing dependencies
    echo.
    echo Try running this manually:
    echo 1. Open PowerShell in this folder
    echo 2. Type: npm install
    echo 3. Type: node setup-wizard.js
    echo.
    pause
    exit /b 1
)

echo ✅ Dependencies installed!
echo.

REM Run the setup wizard
echo 🧙‍♂️ Starting setup wizard...
echo Follow the prompts to enter your API keys!
echo.
node setup-wizard.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Setup wizard had an error
    echo Try running: node setup-wizard.js
    echo.
)

pause