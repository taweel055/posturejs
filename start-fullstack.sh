#!/bin/bash
# ProPostureFitness Full-Stack Startup Script

set -e

echo "🚀 Starting ProPostureFitness Full-Stack Application..."

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker to continue."
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Navigate to deployment directory
cd "$(dirname "$0")/deployment"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
$COMPOSE_CMD down -v --remove-orphans 2>/dev/null || true

# Build and start the full-stack application
echo "🏗️ Building and starting services..."
$COMPOSE_CMD up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "🔍 Checking $service_name health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is healthy!"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start properly"
    return 1
}

# Check backend health
if ! check_service "Backend API" "http://localhost:5000/health"; then
    echo "❌ Backend failed to start. Checking logs..."
    $COMPOSE_CMD logs proposturefitness-backend
    exit 1
fi

# Check frontend health
if ! check_service "Frontend App" "http://localhost:3000"; then
    echo "❌ Frontend failed to start. Checking logs..."
    $COMPOSE_CMD logs proposturefitness-app
    exit 1
fi

echo ""
echo "🎉 ProPostureFitness Full-Stack Application is now running!"
echo ""
echo "📱 Frontend Application:"
echo "   URL: http://localhost:3000"
echo "   Posture analysis with MediaPipe"
echo "   Real-time WebSocket updates"
echo ""
echo "🔧 Backend API:"
echo "   URL: http://localhost:5000"
echo "   Health Check: http://localhost:5000/health"
echo "   API Documentation: http://localhost:5000/api"
echo ""
echo "👤 Demo Account:"
echo "   Email: demo@proposturefitness.com"
echo "   Password: demo123456"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: $COMPOSE_CMD logs -f"
echo "   Stop services: $COMPOSE_CMD down"
echo "   Restart: $COMPOSE_CMD restart"
echo "   View status: $COMPOSE_CMD ps"
echo ""
echo "📊 Database:"
echo "   SQLite database with demo data"
echo "   User accounts, posture sessions, analytics"
echo "   Real-time data storage via WebSocket"
echo ""

# Optional: Follow logs
read -p "Would you like to follow the logs? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Following logs (Ctrl+C to exit)..."
    $COMPOSE_CMD logs -f
fi