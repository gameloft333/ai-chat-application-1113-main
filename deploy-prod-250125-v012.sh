#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="development_log/deployment_$(date +%Y%m%d_%H%M%S).log"
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
        echo -e "${RED}重要：您需要重新登录以使 docker 组成员身份生效${NC}"
        echo -e "${YELLOW}请在脚本执行完成后，执行以下操作：${NC}"
        echo -e "1. 退出当前会话：exit"
        echo -e "2. 重新登录"
        echo -e "3. 重新运行部署脚本"
        
        # 询问是否继续
        read -p "是否继续执行部署？[y/N] " continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消，请重新登录后再次运行脚本${NC}"
            exit 0
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
    echo -e "${GREEN}[PRE-DEPLOYMENT] 检查现有容器${NC}"
    
    # List of services to check and stop
    local services=("ai-chat-application-1113-main-frontend-1" "ai-chat-application-1113-main-payment-server-1")
    local found_containers=false
    
    for service in "${services[@]}"; do
        # Check if container exists and is running
        if docker ps -a --format '{{.Names}}' | grep -q "^${service}$"; then
            found_containers=true
            echo -e "${YELLOW}发现运行中的容器: ${service}${NC}"
            
            # Ask user for confirmation before stopping
            read -p "是否停止并移除该容器？[Y/n] " stop_container
            if [[ ! "$stop_container" =~ ^[Nn]$ ]]; then
                echo -e "${YELLOW}正在停止并移除容器 ${service}...${NC}"
                # Stop the container
                docker stop "${service}" || echo -e "${RED}停止 ${service} 失败${NC}"
                # Remove the container
                docker rm "${service}" || echo -e "${RED}移除 ${service} 失败${NC}"
                echo -e "${GREEN}容器 ${service} 已成功停止和移除${NC}"
            else
                echo -e "${YELLOW}跳过停止容器 ${service}${NC}"
            fi
        else
            echo -e "${GREEN}未发现运行中的容器: ${service}${NC}"
        fi
    done
    
    if [ "$found_containers" = true ]; then
        # Optional: Prune unused containers, networks, and volumes
        read -p "是否清理未使用的 Docker 资源？[Y/n] " prune_resources
        if [[ ! "$prune_resources" =~ ^[Nn]$ ]]; then
            echo -e "${YELLOW}正在清理未使用的 Docker 资源...${NC}"
            docker system prune -f || echo -e "${YELLOW}警告: Docker 资源清理遇到问题${NC}"
            echo -e "${GREEN}Docker 资源清理完成${NC}"
        fi
    else
        echo -e "${GREEN}没有需要停止的容器，继续部署流程${NC}"
    fi
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

# 生成部署报告
generate_deployment_report() {
    echo -e "\n${GREEN}[部署报告] 生成部署信息报告...${NC}"
    
    # 创建报告文件
    local report_file="deployment_report_$(date +%Y%m%d_%H%M%S).log"
    
    {
        echo "==================== 部署报告 ===================="
        echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "部署环境: $(uname -a)"
        echo "AWS实例ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id || echo 'N/A')"
        echo "AWS区域: $(curl -s http://169.254.169.254/latest/meta-data/placement/region || echo 'N/A')"
        echo -e "\n---------- Docker 容器状态 ----------"
        docker ps --format "表格: {{.Names}}\n状态: {{.Status}}\n端口: {{.Ports}}\n镜像: {{.Image}}\n"
        
        echo -e "\n---------- 系统资源使用情况 ----------"
        echo "CPU使用率:"
        top -bn1 | grep "Cpu(s)" | awk '{print $2}'
        echo "内存使用情况:"
        free -h
        echo "磁盘使用情况:"
        df -h
        
        echo -e "\n---------- Docker 资源使用情况 ----------"
        echo "Docker镜像大小:"
        docker images --format "{{.Repository}}:{{.Tag}} - {{.Size}}"
        echo -e "\nDocker容器资源使用:"
        docker stats --no-stream --format "容器: {{.Name}}\nCPU使用率: {{.CPUPerc}}\n内存使用: {{.MemUsage}}"
        
        echo -e "\n---------- 网络状态 ----------"
        echo "Docker网络列表:"
        docker network ls
        echo -e "\n已暴露的端口:"
        netstat -tulpn | grep LISTEN
        
        echo -e "\n---------- 环境检查 ----------"
        echo "Docker版本: $(docker --version)"
        echo "Docker Compose版本: $(docker-compose --version)"
        
        echo -e "\n---------- 部署配置信息 ----------"
        echo "项目名称: ${PROJECT_NAME}"
        echo "Git仓库: ${REPO_URL}"
        echo "部署分支: $(git rev-parse --abbrev-ref HEAD)"
        echo "最新提交: $(git log -1 --pretty=format:'%h - %s (%cr)')"
        
        echo -e "\n---------- 健康检查结果 ----------"
        for service in $(docker ps --format "{{.Names}}"); do
            echo "服务: $service"
            docker inspect --format "{{.State.Health.Status}}" $service 2>/dev/null || echo "无健康检查配置"
        done
        
        echo -e "\n---------- 重要提醒 ----------"
        echo "1. 请检查所有服务是否正常运行"
        echo "2. 确认所有端口是否正确暴露"
        echo "3. 验证服务间网络连接是否正常"
        echo "4. 检查日志中是否有异常信息"
        
        echo -e "\n==================== 报告结束 ===================="
    } | tee -a "$report_file"
    
    echo -e "${GREEN}部署报告已生成: ${report_file}${NC}"
    
    # 可选：将报告保存到特定位置或发送到指定邮箱
    if [ -n "${REPORT_EMAIL}" ]; then
        echo -e "${YELLOW}正在发送报告到 ${REPORT_EMAIL}...${NC}"
        # 添加发送邮件的逻辑（需要配置邮件服务）
    fi
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

    # 生成部署报告
    generate_deployment_report

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