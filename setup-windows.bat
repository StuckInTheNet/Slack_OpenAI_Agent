@echo off
echo.
echo ====================================
echo   SLACK AI BOT - WINDOWS SETUP
echo ====================================
echo.
echo This will set up your Slack AI bot automatically!
echo.

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
    pause
    exit /b 1
)

echo ✅ Node.js found!
echo.

REM Install dependencies
echo 📦 Installing bot dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error installing dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed!
echo.

REM Run the setup wizard
echo 🧙‍♂️ Starting setup wizard...
echo.
node setup-wizard.js

pause