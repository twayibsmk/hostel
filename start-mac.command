#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js is not installed or not found."
  echo "Install the LTS version from https://nodejs.org , then close this window and run this file again."
  open https://nodejs.org
  read -p "Press Enter to close"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing server packages, please wait..."
  npm install || { read -p "Install failed. Press Enter"; exit 1; }
fi

if [ ! -f server/.env ]; then
  node setup.js || { read -p "Press Enter"; exit 1; }
fi

if [ ! -d client/dist ]; then
  echo "Building the website, please wait..."
  npm run build || { read -p "Build failed. Press Enter"; exit 1; }
fi

echo ""
echo "Starting... the website will open at http://localhost:5000"
echo "Keep this window open. Press Ctrl+C to stop."
echo ""
(sleep 2; open http://localhost:5000) &
node server/server.js
