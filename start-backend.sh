#!/bin/bash
# ProPostureFitness Backend Startup Script

set -e

echo "🚀 Starting ProPostureFitness Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Initialize database
echo "🗄️ Initializing database..."
npm run db:migrate

# Seed database with demo data
echo "🌱 Seeding database with demo data..."
npm run db:seed

# Start the server
echo "🚀 Starting backend server..."
echo "📊 API will be available at: http://localhost:5000"
echo "🔌 WebSocket will be available at: http://localhost:5000"
echo "💡 Demo account: demo@proposturefitness.com / demo123456"
echo ""

# Start with nodemon for development
npm run dev