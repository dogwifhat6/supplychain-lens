#!/bin/bash

# SupplyChainLens Production Deployment Script
# This script deploys the application to production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE="env.production"

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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found. Please create it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Generate secure secrets
generate_secrets() {
    print_status "Generating secure secrets..."
    
    # Generate JWT secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 16)
    
    # Update environment file
    sed -i.bak "s/your_super_secure_jwt_secret_here_minimum_32_characters/$JWT_SECRET/g" "$ENV_FILE"
    sed -i.bak "s/your_super_secure_refresh_secret_here_minimum_32_characters/$JWT_REFRESH_SECRET/g" "$ENV_FILE"
    sed -i.bak "s/your_session_secret_here/$SESSION_SECRET/g" "$ENV_FILE"
    sed -i.bak "s/your_secure_password_here/$POSTGRES_PASSWORD/g" "$ENV_FILE"
    sed -i.bak "s/your_redis_password_here/$REDIS_PASSWORD/g" "$ENV_FILE"
    sed -i.bak "s/admin/$GRAFANA_PASSWORD/g" "$ENV_FILE"
    
    # Clean up backup files
    rm -f "$ENV_FILE.bak"
    
    print_success "Secrets generated and updated"
}

# Build and deploy
deploy() {
    print_status "Starting deployment to $ENVIRONMENT environment..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down || true
    
    # Build images
    print_status "Building Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
    
    print_success "Deployment completed successfully!"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Check backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check ML service
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "ML service is healthy"
    else
        print_error "ML service health check failed"
        exit 1
    fi
    
    # Check Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Nginx is healthy"
    else
        print_error "Nginx health check failed"
        exit 1
    fi
}

# Show deployment information
show_info() {
    print_status "Deployment Information:"
    echo "Environment: $ENVIRONMENT"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost:3001"
    echo "ML Service: http://localhost:8000"
    echo "Grafana: http://localhost:3000"
    echo "Prometheus: http://localhost:9090"
    echo ""
    print_warning "Default Grafana credentials: admin / $GRAFANA_PASSWORD"
    print_warning "Please change default passwords in production!"
}

# Main execution
main() {
    print_status "Starting SupplyChainLens deployment..."
    
    check_prerequisites
    generate_secrets
    deploy
    show_info
    
    print_success "Deployment completed successfully!"
    print_status "You can now access the application at http://localhost"
}

# Run main function
main "$@"
