#!/bin/bash
# ProPostureFitness Deployment Script
# Supports multiple environments: development, staging, production

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="proposturefitness"
REGISTRY="your-registry.com"  # Update with your container registry

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
ProPostureFitness Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment  
    production      Deploy to production environment

OPTIONS:
    -h, --help      Show this help message
    -v, --version   Set version tag (default: latest)
    -b, --build     Force rebuild of Docker image
    -t, --test      Run tests before deployment
    -s, --skip-git  Skip git checks
    --dry-run       Show what would be deployed without doing it

EXAMPLES:
    $0 development
    $0 production --version v1.2.3 --test
    $0 staging --build --dry-run

EOF
}

# Default values
ENVIRONMENT=""
VERSION="latest"
FORCE_BUILD=false
RUN_TESTS=false
SKIP_GIT=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -b|--build)
            FORCE_BUILD=true
            shift
            ;;
        -t|--test)
            RUN_TESTS=true
            shift
            ;;
        -s|--skip-git)
            SKIP_GIT=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

# Validate environment values
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Must be one of: development, staging, production"
        exit 1
        ;;
esac

log_info "Starting deployment to $ENVIRONMENT environment"
log_info "Version: $VERSION"

# Git checks
if [[ "$SKIP_GIT" != true ]]; then
    log_info "Checking git status..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes in production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if ! git diff-index --quiet HEAD --; then
            log_error "Uncommitted changes detected. Commit or stash changes before production deployment."
            exit 1
        fi
        
        # Check if we're on main/master branch
        CURRENT_BRANCH=$(git branch --show-current)
        if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
            log_warning "Not on main/master branch. Current branch: $CURRENT_BRANCH"
            read -p "Continue deployment? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Deployment cancelled"
                exit 0
            fi
        fi
    fi
    
    log_success "Git checks passed"
fi

# Run tests if requested
if [[ "$RUN_TESTS" == true ]]; then
    log_info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if node_modules doesn't exist
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    # Run linting
    log_info "Running linter..."
    npm run lint
    
    # Run tests
    log_info "Running test suite..."
    npm test -- --run --coverage
    
    # Check build
    log_info "Testing build process..."
    npm run build
    
    log_success "All tests passed"
fi

# Build Docker image
IMAGE_TAG="${REGISTRY}/${IMAGE_NAME}:${VERSION}-${ENVIRONMENT}"

if [[ "$FORCE_BUILD" == true ]] || ! docker image inspect "$IMAGE_TAG" >/dev/null 2>&1; then
    log_info "Building Docker image: $IMAGE_TAG"
    
    cd "$PROJECT_ROOT"
    
    # Build for the appropriate target
    case $ENVIRONMENT in
        development)
            TARGET="development"
            ;;
        staging|production)
            TARGET="production"
            ;;
    esac
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would build: docker build --target $TARGET -t $IMAGE_TAG ."
    else
        docker build --target "$TARGET" -t "$IMAGE_TAG" .
        log_success "Docker image built successfully"
    fi
else
    log_info "Using existing Docker image: $IMAGE_TAG"
fi

# Deploy based on environment
case $ENVIRONMENT in
    development)
        log_info "Deploying to development environment..."
        
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would run: docker-compose -f docker-compose.yml --profile dev up -d"
        else
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.yml --profile dev up -d
            log_success "Development environment deployed"
        fi
        ;;
        
    staging)
        log_info "Deploying to staging environment..."
        
        # Push to registry for staging
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would push: $IMAGE_TAG"
            log_info "[DRY RUN] Would deploy to staging cluster"
        else
            docker push "$IMAGE_TAG"
            # Add your staging deployment commands here
            # kubectl apply -f k8s/staging/ --set image.tag=$VERSION-$ENVIRONMENT
            log_success "Staging deployment completed"
        fi
        ;;
        
    production)
        log_info "Deploying to production environment..."
        
        # Extra confirmation for production
        log_warning "You are about to deploy to PRODUCTION"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^yes$ ]]; then
            log_info "Production deployment cancelled"
            exit 0
        fi
        
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would push: $IMAGE_TAG"
            log_info "[DRY RUN] Would deploy to production cluster"
        else
            # Push to registry
            docker push "$IMAGE_TAG"
            
            # Deploy to production (update with your production deployment method)
            cd "$PROJECT_ROOT"
            docker-compose -f docker-compose.yml --profile production up -d
            
            # Health check
            log_info "Performing health check..."
            sleep 10
            
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                log_success "Production deployment completed successfully"
                log_success "Application is healthy and running"
            else
                log_error "Health check failed after deployment"
                exit 1
            fi
        fi
        ;;
esac

# Post-deployment tasks
if [[ "$DRY_RUN" != true ]]; then
    log_info "Running post-deployment tasks..."
    
    # Tag the git commit for production deployments
    if [[ "$ENVIRONMENT" == "production" && "$SKIP_GIT" != true ]]; then
        COMMIT_HASH=$(git rev-parse --short HEAD)
        TAG_NAME="deploy-${ENVIRONMENT}-${VERSION}-${COMMIT_HASH}"
        
        if ! git tag -l | grep -q "^${TAG_NAME}$"; then
            git tag "$TAG_NAME"
            log_success "Created git tag: $TAG_NAME"
        fi
    fi
    
    # Cleanup old images (keep last 5)
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    
    log_success "Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Image: $IMAGE_TAG"
else
    log_info "[DRY RUN] Deployment simulation completed"
fi