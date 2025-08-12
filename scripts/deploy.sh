#!/bin/bash

# Gatenjia Deployment Script
# This script handles the complete deployment process including database migrations,
# container restarts, and health checks.

set -e  # Exit on any error

echo "🚀 Starting Gatenjia deployment..."

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# Function to check database connection
check_database() {
    print_status "Checking database connection..."
    
    if docker exec gatenjia_db pg_isready -U postgres >/dev/null 2>&1; then
        print_success "Database is ready"
        return 0
    else
        print_error "Database is not ready"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if docker exec gatenjia_backend npm run db:migrate; then
        print_success "Database migrations completed successfully"
    else
        print_error "Database migrations failed"
        return 1
    fi
}

# Function to regenerate Prisma client
regenerate_prisma() {
    print_status "Regenerating Prisma client..."
    
    if docker exec gatenjia_backend npm run db:generate; then
        print_success "Prisma client regenerated successfully"
    else
        print_error "Prisma client regeneration failed"
        return 1
    fi
}

# Function to check if migrations are needed
check_migrations_needed() {
    print_status "Checking if migrations are needed..."
    
    # Check if there are pending migrations
    if docker exec gatenjia_backend npx prisma migrate status | grep -q "Pending"; then
        print_warning "Pending migrations detected"
        return 0
    else
        print_success "No pending migrations"
        return 1
    fi
}

# Function to check if Prisma client needs regeneration
check_prisma_client() {
    print_status "Checking Prisma client..."
    
    # Try to run a simple Prisma command to see if client is working
    if docker exec gatenjia_backend npx prisma --version >/dev/null 2>&1; then
        print_success "Prisma client is working"
        return 0
    else
        print_warning "Prisma client may need regeneration"
        return 1
    fi
}

# Main deployment function
deploy() {
    print_status "Starting deployment process..."
    
    # Stop all services
    print_status "Stopping all services..."
    docker-compose down
    
    # Start database first
    print_status "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    if ! check_database; then
        print_error "Database failed to start"
        exit 1
    fi
    
    # Wait a bit more for database to fully initialize
    sleep 5
    
    # Start backend
    print_status "Starting backend..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    if ! wait_for_service "Backend" 4000; then
        print_error "Backend failed to start"
        docker-compose logs backend
        exit 1
    fi
    
    # Check if migrations are needed
    if check_migrations_needed; then
        print_status "Running database migrations..."
        if ! run_migrations; then
            print_error "Migrations failed, stopping deployment"
            docker-compose down
            exit 1
        fi
    fi
    
    # Check if Prisma client needs regeneration
    if ! check_prisma_client; then
        print_status "Regenerating Prisma client..."
        if ! regenerate_prisma; then
            print_error "Prisma client regeneration failed, stopping deployment"
            docker-compose down
            exit 1
        fi
        
        # Restart backend after Prisma regeneration
        print_status "Restarting backend after Prisma regeneration..."
        docker-compose restart backend
        
        if ! wait_for_service "Backend" 4000; then
            print_error "Backend failed to restart after Prisma regeneration"
            exit 1
        fi
    fi
    
    # Start frontend
    print_status "Starting frontend..."
    docker-compose up -d frontend
    
    # Wait for frontend to be ready
    if ! wait_for_service "Frontend" 3000; then
        print_error "Frontend failed to start"
        docker-compose logs frontend
        exit 1
    fi
    
    print_success "All services are running!"
}

# Function to show deployment status
show_status() {
    print_status "Current deployment status:"
    echo ""
    
    # Show running containers
    docker-compose ps
    
    echo ""
    
    # Show service health
    if curl -s "http://localhost:4000/health" >/dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
    fi
    
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    if docker exec gatenjia_db pg_isready -U postgres >/dev/null 2>&1; then
        print_success "Database: Healthy"
    else
        print_error "Database: Unhealthy"
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-"all"}
    
    case $service in
        "backend")
            docker-compose logs backend
            ;;
        "frontend")
            docker-compose logs frontend
            ;;
        "db")
            docker-compose logs db
            ;;
        "all")
            docker-compose logs
            ;;
        *)
            print_error "Invalid service: $service. Use: backend, frontend, db, or all"
            exit 1
            ;;
    esac
}

# Function to restart service
restart_service() {
    local service=${1:-"all"}
    
    case $service in
        "backend")
            print_status "Restarting backend..."
            docker-compose restart backend
            wait_for_service "Backend" 4000
            ;;
        "frontend")
            print_status "Restarting frontend..."
            docker-compose restart frontend
            wait_for_service "Frontend" 3000
            ;;
        "db")
            print_status "Restarting database..."
            docker-compose restart db
            check_database
            ;;
        "all")
            print_status "Restarting all services..."
            docker-compose restart
            ;;
        *)
            print_error "Invalid service: $service. Use: backend, frontend, db, or all"
            exit 1
            ;;
    esac
}

# Function to show help
show_help() {
    echo "Gatenjia Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Full deployment (default)"
    echo "  status          Show current deployment status"
    echo "  logs [SERVICE]  Show logs (backend, frontend, db, or all)"
    echo "  restart [SERVICE] Restart service (backend, frontend, db, or all)"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Run full deployment"
    echo "  $0 status       # Show status"
    echo "  $0 logs backend # Show backend logs"
    echo "  $0 restart all  # Restart all services"
}

# Main script logic
main() {
    local command=${1:-"deploy"}
    
    # Change to the infra directory
    cd "$(dirname "$0")/../infra" || {
        print_error "Failed to change to infra directory"
        exit 1
    }
    
    case $command in
        "deploy")
            check_prerequisites
            deploy
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "restart")
            restart_service "$2"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
