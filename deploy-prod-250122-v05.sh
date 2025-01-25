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

# 检查并安装 Docker
check_and_install_docker() {
    echo -e "${GREEN}[CHECK] 检查 Docker 环境...${NC}"
    
    # 检查 Docker 是否已安装
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker 未安装，是否要安装 Docker？[Y/n]${NC}"
        read -r install_docker
        if [[ ! "$install_docker" =~ ^[Nn]$ ]]; then
            echo -e "${GREEN}正在安装 Docker...${NC}"
            sudo yum install -y docker
        else
            echo -e "${RED}Docker 是必需的，无法继续部署${NC}"
            exit 1
        fi
    fi
    
    # 检查 Docker 服务状态
    if ! systemctl is-active --quiet docker; then
        echo -e "${YELLOW}Docker 服务未运行，正在启动...${NC}"
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # 检查当前用户是否在 docker 组中
    if ! groups | grep -q docker; then
        echo -e "${YELLOW}将当前用户添加到 docker 组...${NC}"
        sudo usermod -aG docker $USER
        echo -e "${GREEN}请注意：您需要重新登录以使组成员身份生效${NC}"
        echo -e "${YELLOW}是否现在就重新登录？[Y/n]${NC}"
        read -r relogin
        if [[ ! "$relogin" =~ ^[Nn]$ ]]; then
            echo -e "${GREEN}执行 newgrp docker 来更新组成员身份...${NC}"
            exec newgrp docker
        fi
    fi
    
    echo -e "${GREEN}Docker 环境检查完成${NC}"
    return 0
}

# 修改 pre_deployment_check 函数
pre_deployment_check() {
    echo -e "${GREEN}[STEP 1/7] Pre-deployment Checks${NC}"
    
    # 检查并安装 Docker
    if ! check_and_install_docker; then
        error "Docker 环境配置失败"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Docker Compose 未安装，是否要安装？[Y/n]${NC}"
        read -r install_compose
        if [[ ! "$install_compose" =~ ^[Nn]$ ]]; then
            echo -e "${GREEN}正在安装 Docker Compose...${NC}"
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        else
            echo -e "${RED}Docker Compose 是必需的，无法继续部署${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}所有必要组件检查完成${NC}"
    return 0
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
    local services=("ai-chat-application-1113-main-frontend-1" "ai-chat-application-1113-main-payment-server-1")
    
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

check_env_variables() {
    echo -e "${GREEN}[CHECK] 验证环境变量配置${NC}"
    
    # 检查必要的环境变量
    required_vars=(
        "STRIPE_SECRET_KEY"
        "STRIPE_PUBLISHABLE_KEY"
        "STRIPE_WEBHOOK_SECRET"
    )
    
    missing_vars=0
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.production; then
            echo -e "${RED}错误: 缺少环境变量 ${var}${NC}"
            missing_vars=1
        fi
    done
    
    if [ $missing_vars -eq 1 ]; then
        exit 1
    fi
}

check_payment_service() {
    echo -e "${GREEN}[CHECK] 验证支付服务状态${NC}"
    
    # 等待服务启动
    sleep 10
    
    # 检查服务健康状态
    if curl -s http://localhost:4242/health > /dev/null; then
        echo -e "${GREEN}支付服务运行正常${NC}"
        return 0
    else
        echo -e "${RED}支付服务异常${NC}"
        docker-compose -f docker-compose.prod.yml logs payment
        return 1
    fi
}