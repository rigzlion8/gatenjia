#!/bin/bash

# Gatenjia Production Deployment Script
# This script handles production deployment to Railway or similar platforms

set -e  # Exit on any error

echo "🚀 Starting Gatenjia Production Deployment..."

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

# Check if .env.production exists
check_env_file() {
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        print_status "Please copy .env.production.example to .env.production and fill in your values"
        exit 1
    fi
    print_success "Environment file found"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Build production images
build_production_images() {
    print_status "Building production Docker images..."
    
    # Build backend
    print_status "Building backend image..."
    docker build -f Dockerfile.backend -t gatenjia-backend:prod .
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -f Dockerfile.frontend -t gatenjia-frontend:prod .
    
    print_success "Production images built successfully"
}

# Deploy with production compose
deploy_production() {
    print_status "Deploying with production configuration..."
    
    # Load environment variables
    export $(cat .env.production | xargs)
    
    # Deploy using production compose file
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Production deployment completed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    if docker exec gatenjia_db pg_isready -U postgres >/dev/null 2>&1; then
        print_status "Database is ready, running migrations..."
        
        # Run migrations
        docker exec gatenjia_backend npm run db:migrate || {
            print_warning "Migrations failed, but continuing deployment"
        }
        
        print_success "Migrations completed"
    else
        print_error "Database is not ready"
        exit 1
    fi
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend
    if curl -s "http://localhost:4000/health" >/dev/null 2>&1; then
        print_success "Backend: Healthy"
    else
        print_error "Backend: Unhealthy"
        return 1
    fi
    
    # Check frontend
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
        return 1
    fi
    
    # Check database
    if docker exec gatenjia_db pg_isready -U postgres >/dev/null 2>&1; then
        print_success "Database: Healthy"
    else
        print_error "Database: Unhealthy"
        return 1
    fi
    
    print_success "All services are healthy!"
}

# Show deployment info
show_deployment_info() {
    echo ""
    print_success "🎉 Production Deployment Complete!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:4000"
    echo "📊 Health:   http://localhost:4000/health"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure your domain/load balancer"
    echo "2. Set up SSL certificates"
    echo "3. Configure monitoring and logging"
    echo "4. Set up backup strategies"
    echo ""
    echo "📚 Documentation:"
    echo "- Railway: https://railway.app/docs"
    echo "- Render: https://render.com/docs"
    echo "- DigitalOcean: https://docs.digitalocean.com"
}

# Main deployment function
main() {
    print_status "Starting production deployment process..."
    
    check_env_file
    check_prerequisites
    build_production_images
    deploy_production
    run_migrations
    health_check
    show_deployment_info
}

# Run main function
main "$@"
