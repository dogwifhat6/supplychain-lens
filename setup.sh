#!/bin/bash

# SupplyChainLens Setup Script
# This script sets up the complete SupplyChainLens application with frontend and backend

set -e

echo "🚀 Setting up SupplyChainLens Application"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker is available"
    else
        print_warning "Docker is not installed. You can install it for easier deployment."
    fi
    
    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is available"
    else
        print_warning "Docker Compose is not installed. You can install it for easier deployment."
    fi
    
    print_success "System requirements check completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build frontend
    print_status "Building frontend..."
    npm run build
    
    print_success "Frontend setup completed"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npm run db:generate
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp env.example .env
        print_warning "Please edit backend/.env with your configuration before running the application"
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Setup ML service
setup_ml_service() {
    print_status "Setting up ML service..."
    
    cd ml-service
    
    # Create virtual environment
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing ML service dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create necessary directories
    print_status "Creating ML service directories..."
    mkdir -p models logs temp data
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/supplychain_lens
REDIS_URL=redis://localhost:6379
ENABLE_GPU=false
LOG_LEVEL=INFO
EOF
        print_warning "Please edit ml-service/.env with your configuration before running the application"
    fi
    
    cd ..
    print_success "ML service setup completed"
}

# Setup database with Docker
setup_database_docker() {
    print_status "Setting up database with Docker..."
    
    # Start PostgreSQL and Redis
    print_status "Starting PostgreSQL and Redis containers..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec -T backend npm run db:migrate
    
    # Seed database
    print_status "Seeding database with sample data..."
    docker-compose exec -T backend npm run db:seed
    
    print_success "Database setup completed"
}

# Setup database without Docker
setup_database_local() {
    print_status "Setting up database locally..."
    
    print_warning "Please ensure PostgreSQL and Redis are running locally"
    print_warning "Update backend/.env with your local database credentials"
    
    # Run database migrations
    print_status "Running database migrations..."
    cd backend
    npm run db:migrate
    
    # Seed database
    print_status "Seeding database with sample data..."
    npm run db:seed
    
    cd ..
    print_success "Database setup completed"
}

# Start development servers
start_development() {
    print_status "Starting development servers..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 5
    
    # Start frontend
    print_status "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    print_success "Development servers started!"
    print_status "Frontend: http://localhost:5173"
    print_status "Backend API: http://localhost:3001"
    print_status "API Health: http://localhost:3001/health"
    
    # Keep script running
    print_status "Press Ctrl+C to stop all servers"
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Stopping servers..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Servers stopped"
        exit 0
    }
    
    # Set trap to cleanup on script exit
    trap cleanup SIGINT SIGTERM
    
    # Wait for processes
    wait
}

# Main setup function
main() {
    echo
    print_status "Starting SupplyChainLens setup..."
    echo
    
    # Check requirements
    check_requirements
    echo
    
    # Setup frontend
    setup_frontend
    echo
    
    # Setup backend
    setup_backend
    echo
    
    # Setup ML service
    setup_ml_service
    echo
    
    # Ask user about database setup
    echo "Database Setup Options:"
    echo "1) Use Docker (recommended - easier setup)"
    echo "2) Use local PostgreSQL and Redis"
    echo "3) Skip database setup (manual setup required)"
    echo
    read -p "Choose an option (1-3): " db_option
    
    case $db_option in
        1)
            setup_database_docker
            ;;
        2)
            setup_database_local
            ;;
        3)
            print_warning "Skipping database setup. Please set up PostgreSQL and Redis manually."
            ;;
        *)
            print_error "Invalid option. Skipping database setup."
            ;;
    esac
    
    echo
    print_success "Setup completed successfully!"
    echo
    
    # Ask if user wants to start development servers
    read -p "Do you want to start the development servers now? (y/n): " start_servers
    
    if [[ $start_servers =~ ^[Yy]$ ]]; then
        echo
        start_development
    else
        echo
        print_status "To start the development servers later, run:"
        print_status "  Frontend: npm run dev"
        print_status "  Backend: cd backend && npm run dev"
        echo
        print_status "Or use Docker Compose:"
        print_status "  docker-compose up"
    fi
}

# Run main function
main "$@"
