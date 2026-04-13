#!/bin/bash
set -e

# Read API key from .env.local
APIKEY=$(grep ANTHROPIC_API_KEY /root/SIOS/.env.local | cut -d= -f2)

# Write PM2 ecosystem config
cat > /root/SIOS/ecosystem.config.js << INNEREOF
module.exports = {
  apps: [{
    name: 'sios',
    script: '/root/SIOS/.next/standalone/server.js',
    args: '-p 3000',
    cwd: '/root/SIOS/.next/standalone',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: 3000,
      ANTHROPIC_BASE_URL: 'https://api.minimaxi.com/anthropic',
      ANTHROPIC_API_KEY: '${APIKEY}',
      ANTHROPIC_MODEL: 'MiniMax-M2.7-highspeed',
    },
  }],
};
INNEREOF

echo "ecosystem.config.js written"

# Copy static assets for standalone
cp -r /root/SIOS/public /root/SIOS/.next/standalone/public 2>/dev/null || true
cp -r /root/SIOS/.next/static /root/SIOS/.next/standalone/.next/static 2>/dev/null || true

echo "Static assets copied"

# Restart PM2 with ecosystem config
cd /root/SIOS
pm2 delete sios 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "PM2 restarted with env vars"
sleep 3
pm2 status
