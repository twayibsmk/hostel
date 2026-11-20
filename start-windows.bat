@echo off
cd /d "%~dp0"
title Hostel Management

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed or not found.
  echo 1. Install the LTS version from https://nodejs.org
  echo 2. Close this window, then double-click this file again.
  start https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing server packages, please wait...
  call npm install
  if errorlevel 1 ( echo Install failed. & pause & exit /b 1 )
)

if not exist server\.env (
  node setup.js
  if errorlevel 1 ( pause & exit /b 1 )
)

if not exist client\dist (
  echo Building the website, please wait...
  call npm run build
  if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
)

echo.
echo Starting... the website will open at http://localhost:5000
echo Keep this window open. Close it to stop.
echo.
start "" http://localhost:5000
node server\server.js
pause
