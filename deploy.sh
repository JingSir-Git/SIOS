#!/bin/bash
###############################################################################
# SIOS One-Click Deploy Script
# Usage: bash deploy.sh
#
# Strategy: Build locally (server only has 1.8GB RAM — not enough for
# Next.js build), then upload the standalone output + static assets.
#
# Steps:
#   1. Build locally with webpack
#   2. Pack standalone + static + public into a tar
#   3. Upload to server via scp
#   4. Extract, write ecosystem.config.js with env vars, restart PM2
###############################################################################
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SERVER="root@39.108.112.161"
REMOTE_DIR="/root/SIOS"
ARCHIVE_NAME="sios-standalone.tar.gz"
LOCAL_ARCHIVE="/tmp/${ARCHIVE_NAME}"
REMOTE_ARCHIVE="/tmp/${ARCHIVE_NAME}"
SCP_OPTS="-o ConnectTimeout=15 -o ServerAliveInterval=30 -o ServerAliveCountMax=5"
SSH_OPTS="-o ConnectTimeout=15 -o ServerAliveInterval=30"
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "═══════════════════════════════════════════════════════"
echo "  SIOS Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════"

# Step 1: Local build
echo ""
echo "🏗️  [1/4] Building locally..."
cd "$SCRIPT_DIR"
npx next build --webpack 2>&1 | tail -5
echo "   ✓ Build complete"

# Step 2: Pack standalone output
echo ""
echo "📦 [2/4] Packing standalone output..."
# standalone dir contains server.js + node_modules subset
# We also need .next/static (hashed assets) and public (icons, manifest, etc.)
tar -czf "$LOCAL_ARCHIVE" \
    -C "$SCRIPT_DIR/.next/standalone" . \
    -C "$SCRIPT_DIR/.next" static \
    -C "$SCRIPT_DIR" public
SIZE=$(du -h "$LOCAL_ARCHIVE" | cut -f1)
echo "   ✓ Archive: ${SIZE}"

# Step 3: Upload
echo ""
echo "🚀 [3/4] Uploading to server..."
scp $SCP_OPTS "$LOCAL_ARCHIVE" "${SERVER}:${REMOTE_ARCHIVE}"
echo "   ✓ Upload complete"

# Step 4: Extract & restart on server
echo ""
echo "� [4/4] Deploying on server..."
ssh $SSH_OPTS "$SERVER" bash -s << 'REMOTE_SCRIPT'
set -euo pipefail

REMOTE_DIR="/root/SIOS"
REMOTE_ARCHIVE="/tmp/sios-standalone.tar.gz"

# Stop current process to free memory
pm2 stop sios 2>/dev/null || true

# Clean and extract
rm -rf "${REMOTE_DIR}/.next/standalone"
mkdir -p "${REMOTE_DIR}/.next/standalone"
tar -xzf "$REMOTE_ARCHIVE" -C "${REMOTE_DIR}/.next/standalone"

# Move static assets to correct location
mkdir -p "${REMOTE_DIR}/.next/standalone/.next"
if [ -d "${REMOTE_DIR}/.next/standalone/static" ]; then
  mv "${REMOTE_DIR}/.next/standalone/static" "${REMOTE_DIR}/.next/standalone/.next/static"
fi

echo "   ✓ Files extracted"

# Read API key and write ecosystem.config.js
APIKEY=$(grep ANTHROPIC_API_KEY "${REMOTE_DIR}/.env.local" | cut -d= -f2)
BASEURL=$(grep ANTHROPIC_BASE_URL "${REMOTE_DIR}/.env.local" | cut -d= -f2)
MODEL=$(grep ANTHROPIC_MODEL "${REMOTE_DIR}/.env.local" | cut -d= -f2)

cat > "${REMOTE_DIR}/ecosystem.config.js" << ECOEOF
module.exports = {
  apps: [{
    name: 'sios',
    script: '${REMOTE_DIR}/.next/standalone/server.js',
    args: '-p 3000',
    cwd: '${REMOTE_DIR}/.next/standalone',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: 3000,
      ANTHROPIC_BASE_URL: '${BASEURL}',
      ANTHROPIC_API_KEY: '${APIKEY}',
      ANTHROPIC_MODEL: '${MODEL}',
    },
  }],
};
ECOEOF

# Restart PM2
pm2 delete sios 2>/dev/null || true
cd "${REMOTE_DIR}"
pm2 start ecosystem.config.js
pm2 save --force

sleep 3

# Verify
STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/)
if [ "$STATUS" = "200" ]; then
  echo "   ✓ Server is live (HTTP ${STATUS})"
else
  echo "   ⚠ Server returned HTTP ${STATUS}"
fi

pm2 status sios
REMOTE_SCRIPT

# Cleanup local archive
rm -f "$LOCAL_ARCHIVE"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Deploy complete!"
echo "  🌐 https://jch.ac.cn/"
echo "═══════════════════════════════════════════════════════"
