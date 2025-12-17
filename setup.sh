#!/bin/bash

# StockScope Setup Script
# This script helps you set up the StockScope project quickly

echo "🚀 StockScope Setup Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed: $(npm --version)${NC}"

echo ""
echo -e "${BLUE}📦 Setting up Backend...${NC}"
echo "=========================="

# Backend setup
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your API keys!${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}📱 Setting up Frontend...${NC}"
echo "=========================="

# Frontend setup
cd frontend

echo "Installing frontend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "=========================="
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Configure API Keys:"
echo "   - Edit backend/.env"
echo "   - Add your Finnhub API key"
echo "   - Add your NewsAPI key"
echo ""
echo "2. Configure Firebase:"
echo "   - Edit frontend/src/utils/firebase.js"
echo "   - Add your Firebase config"
echo ""
echo "3. Start the backend:"
echo "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "4. Start the frontend (in a new terminal):"
echo "   ${YELLOW}cd frontend && npm start${NC}"
echo ""
echo "5. Run the app:"
echo "   - Press 'i' for iOS Simulator"
echo "   - Press 'a' for Android Emulator"
echo "   - Press 'w' for Web"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - Quick Start: QUICKSTART.md"
echo "   - Full Docs: README.md"
echo "   - Features: FEATURES.md"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"



