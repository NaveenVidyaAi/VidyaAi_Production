#!/bin/bash
# VidyaAI — Hostinger VPS Deployment Script
# Run this on your VPS after first-time server setup
# Usage: bash deploy.sh

set -e

APP_DIR="/opt/vidyaai"
REPO_URL="https://github.com/YOUR_USERNAME/vidyaai-cgbse.git"   # ← update this

echo "=== VidyaAI Deploy ==="

# Pull latest code
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/4] Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "[1/4] Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Copy .env if not present
if [ ! -f "$APP_DIR/.env" ]; then
  echo "[!] .env not found. Copy .env.example and fill in values:"
  echo "    cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
  exit 1
fi

# Build frontend
echo "[2/4] Building frontend..."
cd "$APP_DIR/frontend"
npm install --silent
VITE_API_URL=/api npm run build

# Start/restart all services
echo "[3/4] Starting Docker services..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml up -d --build

# Health check
echo "[4/4] Health check..."
sleep 5
curl -sf http://localhost:8000/ && echo "Backend OK" || echo "Backend not ready yet"
echo ""
echo "=== Deploy complete ==="
echo "Site available at: http://$(hostname -I | awk '{print $1}')"
