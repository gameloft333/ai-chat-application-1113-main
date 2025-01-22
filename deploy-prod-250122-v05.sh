#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region || echo "unknown")
AWS_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id || echo "unknown")

# Pre-deployment checks
pre_deployment_check() {
    echo -e "${GREEN}[STEP 1/7] Pre-deployment Checks${NC}"
    
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
    echo -e "${GREEN}[STEP 2/7] Pulling Latest Code${NC}"
    git pull origin main
}

# Function to check and stop existing containers
stop_existing_containers() {
    echo -e "${GREEN}[PRE-DEPLOYMENT] Checking for existing containers${NC}"
    
    # List of services to check and stop
    local services=("ai-chat-application-1113-main-frontend-1" "nginx")
    
    for service in "${services[@]}"; do
        # Check if container exists
        if docker ps -a --format '{{.Names}}' | grep -q "^${service}$"; then
            echo -e "${YELLOW}Stopping and removing existing ${service} container${NC}"
            
            # Stop the container
            docker stop "${service}" || echo -e "${RED}Failed to stop ${service} container${NC}"
            
            # Remove the container
            docker rm "${service}" || echo -e "${RED}Failed to remove ${service} container${NC}"
        else
            echo -e "${GREEN}No existing ${service} container found${NC}"
        fi
    done
    
    # Optional: Prune unused containers, networks, and volumes
    docker system prune -f || echo -e "${YELLOW}Warning: Docker system prune encountered an issue${NC}"
}

# Create the external network
create_external_network() {
    echo -e "${GREEN}[STEP 3/7] Creating External Network${NC}"
    # Check if network already exists before creating
    if ! docker network inspect saga4v_network &> /dev/null; then
        docker network create saga4v_network || {
            echo -e "${RED}Failed to create saga4v_network${NC}"
            exit 1
        }
    else
        echo -e "${YELLOW}Network saga4v_network already exists${NC}"
    fi
}

# Build Docker images
build_images() {
    echo -e "${GREEN}[STEP 4/7] Building Docker Images${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
}

# Deploy containers
deploy_containers() {
    echo -e "${GREEN}[STEP 5/7] Deploying Containers${NC}"
    # docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    docker-compose -f docker-compose.prod.yml up -d
}

# Health check
check_deployment() {
    echo -e "${GREEN}[STEP 6/7] Checking Deployment Health${NC}"
    docker-compose -f docker-compose.prod.yml ps
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Cleanup
cleanup() {
    echo -e "${GREEN}[STEP 6/7] Cleanup${NC}"
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
    create_external_network  # Add network creation before deployment
    build_images
    deploy_containers
    check_deployment
    cleanup

    echo -e "${GREEN}Deployment Successful!${NC}"
}

# Execute main function
main