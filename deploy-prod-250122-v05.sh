#!/bin/bash

# Strict mode
set -euo pipefail

# Logging
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Deployment Configuration
PROJECT_NAME=$(basename $(git rev-parse --show-toplevel))
REPO_URL=$(git config --get remote.origin.url)
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
AWS_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

# Pre-deployment checks
pre_deployment_check() {
    echo -e "${GREEN}[STEP 1/6] Pre-deployment Checks${NC}"
    
    # Check Docker installation
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose.${NC}"
        exit 1
    fi
}

# Pull latest code
pull_latest_code() {
    echo -e "${GREEN}[STEP 2/6] Pulling Latest Code${NC}"
    git pull origin main
}

# Function to check and stop existing containers
stop_existing_containers() {
    echo -e "${GREEN}[PRE-DEPLOYMENT] Checking for existing containers${NC}"
    
    # List of services to check and stop
    local services=("companion-app" "nginx")
    
    for service in "${services[@]}"; do
        # Check if container exists
        if docker ps -a --format '{{.Names}}' | grep -q "^${service}$"; then
            echo -e "${YELLOW}Stopping and removing existing ${service} container${NC}"
            
            # Stop the container
            docker stop "${service}" || true
            
            # Remove the container
            docker rm "${service}" || true
        else
            echo -e "${GREEN}No existing ${service} container found${NC}"
        fi
    done
    
    # Optional: Prune unused containers, networks, and volumes
    docker system prune -f
}

# Build Docker images
build_images() {
    echo -e "${GREEN}[STEP 3/6] Building Docker Images${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
}

# Deploy containers
deploy_containers() {
    echo -e "${GREEN}[STEP 4/6] Deploying Containers${NC}"
    docker-compose -f docker-compose.prod.yml up -d
}

# Health check
check_deployment() {
    echo -e "${GREEN}[STEP 5/6] Checking Deployment Health${NC}"
    docker-compose -f docker-compose.prod.yml ps
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Cleanup
cleanup() {
    echo -e "${GREEN}[STEP 6/6] Cleanup${NC}"
    docker system prune -f
}

# Rollback function
rollback() {
    echo -e "${RED}Deployment failed. Rolling back...${NC}"
    docker-compose -f docker-compose.prod.yml down
    # Optional: Restore from backup
}

# Main deployment function
main() {
    trap rollback ERR

    # Add container stop check before deployment
    stop_existing_containers

    pre_deployment_check
    pull_latest_code
    build_images
    deploy_containers
    check_deployment
    cleanup

    echo -e "${GREEN}Deployment Successful!${NC}"
}

# Execute main function
main