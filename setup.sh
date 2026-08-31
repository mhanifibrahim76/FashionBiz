#!/bin/bash
set -e

echo "========================================"
echo "FashionBiz AI - Setup Script"
echo "========================================"
echo ""

echo "[1/4] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running"
    exit 1
fi
echo "Docker detected."

echo ""
echo "[2/4] Building Docker images..."
docker-compose build

echo ""
echo "[3/4] Starting containers..."
docker-compose up -d

echo ""
echo "[4/4] Setting up database..."
sleep 5
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed

echo ""
echo "========================================"
echo "Setup completed!"
echo "========================================"
echo ""
echo "Access the app at: http://localhost:3000"
echo "Demo account: demo@fashionbiz.ai / demo123"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f    : View logs"
echo "  docker-compose down       : Stop containers"
echo "  docker-compose up -d      : Start again"
echo ""
