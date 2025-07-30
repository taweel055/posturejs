#!/bin/sh
# Docker entrypoint script for ProPostureFitness

set -e

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting ProPostureFitness container..."

# Check if we're running in production mode
if [ "${NODE_ENV}" = "production" ]; then
    log "Running in production mode"
    
    # Verify nginx configuration
    nginx -t
    if [ $? -ne 0 ]; then
        log "ERROR: Nginx configuration test failed"
        exit 1
    fi
    
    # Check if static files exist
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then
        log "ERROR: Application files not found"
        exit 1
    fi
    
    log "Static files verified"
    
    # Set proper permissions
    chown -R nginx:nginx /usr/share/nginx/html
    
else
    log "Running in development mode"
fi

# Health check function
health_check() {
    if [ "${NODE_ENV}" = "production" ]; then
        curl -f http://localhost:80/health > /dev/null 2>&1
    else
        curl -f http://localhost:3000/ > /dev/null 2>&1
    fi
}

# Wait for application to be ready
log "Waiting for application to be ready..."
for i in $(seq 1 30); do
    if health_check; then
        log "Application is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        log "ERROR: Application failed to start"
        exit 1
    fi
    sleep 1
done

log "ProPostureFitness container started successfully"

# Execute the main command
exec "$@"