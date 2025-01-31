#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查并创建必要的目录
for dir in "development_log" "deployment_reports"; do
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}[INIT] 目录不存在，创建: ${dir}${NC}"
        mkdir -p "$dir"
        echo -e "${GREEN}[INIT] 目录创建成功: ${dir}${NC}"
    else
        echo -e "${GREEN}[INIT] 目录已存在: ${dir}${NC}"
    fi
done

# Logging
LOG_FILE="development_log/deployment_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${GREEN}[INIT] 创建日志目录: development_log${NC}"
echo -e "${GREEN}[INIT] 创建部署报告目录: deployment_reports${NC}"

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
    echo -e "${GREEN}[STEP 2/7] 代码更新检查${NC}"
    
    # 显示当前分支和提交信息
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    local current_commit=$(git rev-parse --short HEAD)
    local current_message=$(git log -1 --pretty=%B)
    
    echo -e "${YELLOW}当前分支: ${current_branch}${NC}"
    echo -e "${YELLOW}当前提交: ${current_commit} - ${current_message}${NC}"
    
    # 检查是否有远程更新
    git fetch origin main
    local updates=$(git rev-list HEAD..origin/main --count)
    
    if [ "$updates" -gt 0 ]; then
        echo -e "${YELLOW}发现 ${updates} 个新的提交${NC}"
        echo -e "${YELLOW}是否拉取最新代码？[Y/n] ${NC}"
    else
        echo -e "${GREEN}代码已是最新版本${NC}"
        echo -e "${YELLOW}是否强制拉取代码？[y/N] ${NC}"
    fi
    
    read -r pull_code
    if [[ "$updates" -gt 0 && ! "$pull_code" =~ ^[Nn]$ ]] || \
       [[ "$updates" -eq 0 && "$pull_code" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}正在拉取最新代码...${NC}"
        git pull origin main
        
        # 显示更新后的信息
        local new_commit=$(git rev-parse --short HEAD)
        local new_message=$(git log -1 --pretty=%B)
        echo -e "${GREEN}更新完成: ${new_commit} - ${new_message}${NC}"
    else
        echo -e "${YELLOW}跳过代码更新，使用当前版本继续部署${NC}"
    fi
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
            
            # 直接停止并移除容器，无需用户确认
            echo -e "${YELLOW}正在停止并移除容器 ${service}...${NC}"
            # Stop the container
            docker stop "${service}" || echo -e "${RED}停止 ${service} 失败${NC}"
            # Remove the container
            docker rm "${service}" || echo -e "${RED}移除 ${service} 失败${NC}"
            echo -e "${GREEN}容器 ${service} 已成功停止和移除${NC}"
        else
            echo -e "${GREEN}未发现运行中的容器: ${service}${NC}"
        fi
    done
    
    if [ "$found_containers" = true ]; then
        # 自动执行资源清理，无需用户确认
        echo -e "${YELLOW}正在清理未使用的 Docker 资源...${NC}"
        docker system prune -f || echo -e "${YELLOW}警告: Docker 资源清理遇到问题${NC}"
        echo -e "${GREEN}Docker 资源清理完成${NC}"
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
    echo -e "${GREEN}[DEPLOY] 部署容器...${NC}"
    
    # 定义日志文件路径
    local deploy_log="development_log/deployment_$(date +%Y%m%d_%H%M%S).log"
    local build_log="development_log/build_$(date +%Y%m%d_%H%M%S).log"
    local app_log="development_log/app_$(date +%Y%m%d_%H%M%S).log"
    local payment_log="development_log/payment_$(date +%Y%m%d_%H%M%S).log"
    
    # 生成新的版本标签
    local current_tag="v$(date +%Y%m%d_%H%M%S)"
    
    # 尝试一键部署并保存日志
    if docker-compose -f docker-compose.prod.yml up -d --build > "$deploy_log" 2>&1; then
        echo -e "${GREEN}一键部署成功${NC}"
        
        # 为成功部署的镜像添加标签
        docker tag ai-chat-application-1113-main-app:latest ai-chat-application-1113-main-app:$current_tag
        docker tag ai-chat-application-1113-main-payment:latest ai-chat-application-1113-main-payment:$current_tag
        
        # 记录成功部署的版本
        echo "$current_tag" > "deployment_reports/last_successful_deploy.txt"
        
        echo -e "${GREEN}已保存部署版本: ${current_tag}${NC}"
        docker-compose -f docker-compose.prod.yml logs >> "$deploy_log" 2>&1
        return 0
    else
        echo -e "${RED}一键部署失败。错误日志如下：${NC}"
        cat "$deploy_log"
        
        echo -e "${RED}尝试分步部署...${NC}"
        
        # 分步构建并保存日志
        echo -e "${YELLOW}1. 重新构建镜像...${NC}"
        docker-compose -f docker-compose.prod.yml build --no-cache > "$build_log" 2>&1 || {
            echo -e "${RED}构建失败。错误日志：${NC}"
            cat "$build_log"
            return 1
        }
        
        echo -e "${YELLOW}2. 启动前端服务...${NC}"
        docker-compose -f docker-compose.prod.yml up app -d > "$app_log" 2>&1 || {
            echo -e "${RED}前端服务启动失败。错误日志：${NC}"
            cat "$app_log"
            return 1
        }
        
        echo -e "${YELLOW}3. 启动支付服务...${NC}"
        docker-compose -f docker-compose.prod.yml up payment -d > "$payment_log" 2>&1 || {
            echo -e "${RED}支付服务启动失败。错误日志：${NC}"
            cat "$payment_log"
            return 1
        }
        
        echo -e "${YELLOW}4. 检查容器状态...${NC}"
        docker ps
        
        # 检查容器是否都启动成功
        if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
            echo -e "${GREEN}分步部署成功${NC}"
            
            # 为成功部署的镜像添加标签
            docker tag ai-chat-application-1113-main-app:latest ai-chat-application-1113-main-app:$current_tag
            docker tag ai-chat-application-1113-main-payment:latest ai-chat-application-1113-main-payment:$current_tag
            
            # 记录成功部署的版本
            echo "$current_tag" > "deployment_reports/last_successful_deploy.txt"
            
            echo -e "${GREEN}已保存部署版本: ${current_tag}${NC}"
            return 0
        else
            echo -e "${RED}分步部署失败${NC}"
            return 1
        fi
    fi
}

# Health check
check_deployment() {
    echo -e "${GREEN}[STEP 6/7] Checking Deployment Health${NC}"
    docker-compose -f docker-compose.prod.yml ps
    docker-compose -f docker-compose.prod.yml logs --tail=50
}

# Cleanup
cleanup() {
    echo -e "${GREEN}[STEP 7/7] Cleanup${NC}"
    docker system prune -f
}

# 回滚函数
rollback() {
    echo -e "${RED}部署失败，开始回滚...${NC}"
    
    # 保存当前时间戳的日志
    local rollback_log="development_log/rollback_$(date +%Y%m%d_%H%M%S).log"
    
    # 读取上一次成功部署的版本
    if [ -f "deployment_reports/last_successful_deploy.txt" ]; then
        local last_successful_tag=$(cat "deployment_reports/last_successful_deploy.txt")
        echo -e "${YELLOW}找到上一个稳定版本: ${last_successful_tag}${NC}" | tee -a "$rollback_log"
        
        # 2. 停止当前运行的容器
        echo -e "${YELLOW}停止当前容器...${NC}" | tee -a "$rollback_log"
        docker-compose -f docker-compose.prod.yml down
        
        # 3. 使用上一个稳定版本的镜像启动服务
        echo -e "${YELLOW}使用版本 ${last_successful_tag} 启动服务...${NC}" | tee -a "$rollback_log"
        
        # 修改镜像标签
        export IMAGE_TAG=$last_successful_tag
        
        # 尝试启动上一个版本
        if docker-compose -f docker-compose.prod.yml up -d >> "$rollback_log" 2>&1; then
            echo -e "${GREEN}回滚成功，服务已恢复到版本 ${last_successful_tag}${NC}" | tee -a "$rollback_log"
            
            # 检查服务状态
            echo -e "${YELLOW}检查服务状态...${NC}" | tee -a "$rollback_log"
            docker-compose -f docker-compose.prod.yml ps >> "$rollback_log"
            return 0
        else
            echo -e "${RED}回滚失败，请手动检查服务状态${NC}" | tee -a "$rollback_log"
            return 1
        fi
    else
        echo -e "${RED}未找到可回滚的版本记录${NC}" | tee -a "$rollback_log"
        return 1
    fi
}

# 生成部署报告
generate_deployment_report() {
    echo -e "\n${GREEN}[部署报告] 生成部署信息报告...${NC}"
    
    # 创建报告文件
    local report_file="deployment_reports/deployment_report_$(date +%Y%m%d_%H%M%S).log"
    
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
        
        echo -e "\n---------- 支付服务验证结果 ----------"
        echo "支付服务健康检查: $(curl -s https://payment.saga4v.com/health)"
        echo "支付服务 CORS 配置: $(curl -s -X OPTIONS -H 'Origin: https://love.saga4v.com' -I https://payment.saga4v.com/api/stripe/create-payment-intent | grep -i 'access-control')"
        echo "Docker 网络状态: $(docker network inspect saga4v_network --format '{{.Name}} - {{.Driver}}')"
        
        echo -e "\n${YELLOW}---------- 容器状态列表 ----------${NC}"
        # 使用更详细但兼容的格式显示容器信息
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | while read -r line; do
            if [[ $line == *"healthy"* ]]; then
                echo -e "${GREEN}$line${NC}"
            elif [[ $line == *"unhealthy"* ]]; then
                echo -e "${RED}$line${NC}"
            else
                echo -e "${YELLOW}$line${NC}"
            fi
        done

        echo -e "\n${YELLOW}---------- 服务健康状态 ----------${NC}"
        for container in $(docker ps --format "{{.Names}}"); do
            health_status=$(docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}无健康检查{{end}}" "$container")
            status=$(docker ps --format "{{.Status}}" --filter "name=$container")
            ports=$(docker ps --format "{{.Ports}}" --filter "name=$container")
            
            echo -e "容器: $container"
            echo -e "状态: $status"
            echo -e "健康检查: $health_status"
            echo -e "端口: $ports"
            echo -e "----------------------------------------"
        done

        # 特别检查我们关心的容器
        echo -e "\n${YELLOW}---------- 核心服务状态 ----------${NC}"
        for container in "ai-chat-application-1113-main-frontend" "ai-chat-application-1113-main-payment-server"; do
            status=$(docker ps -f name=$container --format "{{.Status}}")
            if [ -n "$status" ]; then
                echo -e "${GREEN}✓ $container: $status${NC}"
            else
                echo -e "${RED}✗ $container: 未运行${NC}"
            fi
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

# 将函数定义移到脚本开头
check_env_variables() {
    echo -e "${GREEN}[CHECK] 验证环境变量配置${NC}"
    
    # 检查 .env.production 文件是否存在
    if [ ! -f ".env.production" ]; then
        echo -e "${YELLOW}警告: .env.production 文件不存在${NC}"
        return 1
    fi
    
    # 从文件中读取 Stripe 相关的变量
    stripe_vars=($(grep -E "^(VITE_)?STRIPE_" .env.production | cut -d'=' -f1))
    
    if [ ${#stripe_vars[@]} -eq 0 ]; then
        echo -e "${YELLOW}警告: 未找到任何 Stripe 相关配置${NC}"
        return 1
    fi
    
    missing_vars=0
    for var in "${stripe_vars[@]}"; do
        value=$(grep "^${var}=" .env.production | cut -d'=' -f2)
        if [ -z "$value" ]; then
            echo -e "${YELLOW}警告: 环境变量 ${var} 值为空${NC}"
            missing_vars=1
        else
            echo -e "${GREEN}✓ 环境变量 ${var} 已配置${NC}"
        fi
    done
    
    if [ $missing_vars -eq 1 ]; then
        echo -e "${YELLOW}是否继续部署？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消，请检查环境变量配置${NC}"
            return 1
        fi
        echo -e "${YELLOW}继续部署，但某些功能可能无法正常工作${NC}"
    fi
    
    return 0
}

# 修改环境变量导出部分
export_env_vars() {
    echo -e "${GREEN}[ENV] 导出环境变量...${NC}"
    
    # 只导出非注释和非空行的变量
    while IFS='=' read -r key value; do
        # 跳过注释行和空行
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # 去除可能的引号
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # 导出变量
        export "$key=$value"
        echo -e "${GREEN}✓ 已导出: $key${NC}"
    done < .env.production
}

# 将 verify_payment_service 函数移到其他函数定义的位置
verify_payment_service() {
    echo -e "${GREEN}[VERIFY] 验证支付服务配置和连接${NC}"
    
    # 使用容器内部健康检查
    local container_name="ai-chat-application-1113-main-payment-server-1"
    local max_retries=12
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if docker exec $container_name curl -s http://localhost:4242/health | grep -q "healthy"; then
            echo -e "${GREEN}支付服务已就绪${NC}"
            return 0
        fi
        echo -e "${YELLOW}等待支付服务启动... ($(( retry + 1 ))/${max_retries})${NC}"
        sleep 5
        retry=$((retry + 1))
    done
    
    echo -e "${YELLOW}支付服务健康检查未通过，是否继续部署？[y/N] ${NC}"
    read -r continue_deploy
    if [[ "$continue_deploy" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}继续部署，但支付功能可能不可用${NC}"
        return 0
    fi
    
    return 1
}

# 检查characters导入
check_characters_import() {
    echo -e "${GREEN}[STEP 1.5/7] 检查characters数据导入${NC}"
    
    # 检查文件是否存在
    if [ ! -f "data/characters/characters.csv" ]; then
        echo -e "${RED}characters.csv 文件不存在${NC}"
        return 1
    }
    
    if [ ! -f "src/types/character.ts" ]; then
        echo -e "${RED}character.ts 文件不存在${NC}"
        return 1
    fi
    
    # 询问是否需要导入
    echo -e "${YELLOW}是否需要将 characters.csv 导入到 character.ts? [y/N] ${NC}"
    read -r import_characters
    
    if [[ "$import_characters" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}开始导入characters数据...${NC}"
        
        # 记录导入日志
        local import_log="deployment_reports/characters_import_$(date +%Y%m%d_%H%M%S).log"
        
        # 执行导入命令
        if npm run characters import > "$import_log" 2>&1; then
            echo -e "${GREEN}characters数据导入成功${NC}"
            
            # 验证导入结果
            if grep -q "error" "$import_log"; then
                echo -e "${RED}导入过程中发现错误，请检查日志: $import_log${NC}"
                return 1
            fi
            
            echo -e "${GREEN}导入验证通过${NC}"
            return 0
        else
            echo -e "${RED}characters数据导入失败。错误日志如下：${NC}"
            cat "$import_log"
            return 1
        fi
    else
        echo -e "${YELLOW}跳过characters数据导入${NC}"
        return 0
    fi
}

# Main deployment function
main() {
    trap rollback ERR
    
    # 添加容器停止检查
    stop_existing_containers || {
        echo -e "${YELLOW}容器停止过程中出现问题，是否继续？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消${NC}"
            exit 1
        fi
    }

    pre_deployment_check || {
        echo -e "${YELLOW}预部署检查失败，是否继续？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消${NC}"
            exit 1
        fi
    }
    
    # 添加环境变量检查
    check_env_variables || {
        echo -e "${YELLOW}环境变量检查失败，是否继续？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消${NC}"
            exit 1
        fi
    }
    
    # 添加characters导入检查
    check_characters_import || {
        echo -e "${YELLOW}characters数据导入失败，是否继续部署？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}部署已取消${NC}"
            exit 1
        fi
    }
    
    pull_latest_code
    create_external_network
    build_images
    deploy_containers || {
        echo -e "${RED}容器部署失败${NC}"
        rollback
        exit 1
    }
    
    echo -e "${YELLOW}等待服务启动...${NC}"
    sleep 60  # 从 30 改为 60 秒
    
    verify_payment_service || {
        echo -e "${YELLOW}支付服务验证未通过，是否继续部署？[y/N] ${NC}"
        read -r continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            echo -e "${RED}开始回滚...${NC}"
            rollback
            exit 1
        fi
        echo -e "${YELLOW}继续部署，但支付功能可能不可用${NC}"
    }
    
    check_deployment
    cleanup

    # 生成部署报告
    generate_deployment_report
    
    echo -e "${GREEN}部署成功！${NC}"
}

# Execute main function
main