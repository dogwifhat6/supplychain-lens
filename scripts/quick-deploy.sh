#!/bin/bash

# SupplyChainLens Quick Deploy Script
# This script provides a simple one-command deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Setup environment file
setup_environment() {
    if [ ! -f "$ENV_FILE" ]; then
        print_status "Creating environment file..."
        if [ "$ENVIRONMENT" = "production" ]; then
            cp env.production "$ENV_FILE"
            print_warning "Please edit $ENV_FILE with your production values before continuing."
            read -p "Press Enter to continue after editing the environment file..."
        else
            cp env.example "$ENV_FILE"
            print_status "Using development environment configuration."
        fi
    fi
}

# Deploy application
deploy() {
    print_status "Deploying SupplyChainLens ($ENVIRONMENT environment)..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down 2>/dev/null || true
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check health
    check_health
    
    print_success "Deployment completed successfully!"
    show_access_info
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Check if services are running
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
    
    print_success "All services are running!"
}

# Show access information
show_access_info() {
    print_status "Access Information:"
    echo ""
    echo "🌐 Frontend: http://localhost"
    echo "🔧 Backend API: http://localhost:3001"
    echo "🤖 ML Service: http://localhost:8000"
    echo "📊 Grafana: http://localhost:3000"
    echo "📈 Prometheus: http://localhost:9090"
    echo ""
    print_warning "Default Grafana credentials: admin / admin"
    print_warning "Change default passwords in production!"
    echo ""
    print_status "To view logs: docker-compose logs -f"
    print_status "To stop: docker-compose down"
}

# Main execution
main() {
    print_status "🚀 Starting SupplyChainLens Quick Deploy..."
    echo ""
    
    check_docker
    setup_environment
    deploy
    
    echo ""
    print_success "🎉 SupplyChainLens is now running!"
    print_status "Visit http://localhost to get started."
}

# Show help
show_help() {
    echo "SupplyChainLens Quick Deploy Script"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development (default) - Deploy with development configuration"
    echo "  production           - Deploy with production configuration"
    echo ""
    echo "Examples:"
    echo "  $0                   # Deploy development environment"
    echo "  $0 development       # Deploy development environment"
    echo "  $0 production        # Deploy production environment"
    echo ""
    echo "Commands:"
    echo "  $0 help              # Show this help message"
}

# Handle help command
if [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
