#!/bin/bash

# 设置错误时退出
set -e

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 设置项目名称
PROJECT_NAME="ai-chat-application-1113-main"

# 日志函数
log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 成功: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

# 配置环境变量
setup_environment() {
    log "检查 Git 环境变量..."
    
    # 检查是否已经配置
    if ! grep -q "GITHUB_USERNAME" ~/.bashrc && ! grep -q "GITHUB_TOKEN" ~/.bashrc; then
        log "配置 GitHub 凭证..."
        
        # 提示用户输入
        read -p "请输入 GitHub 用户名: " github_username
        read -p "请输入 GitHub Personal Access Token: " github_token
        
        # 添加到 .bashrc
        echo "export GITHUB_USERNAME='${github_username}'" >> ~/.bashrc
        echo "export GITHUB_TOKEN='${github_token}'" >> ~/.bashrc
        
        # 立即生效
        export GITHUB_USERNAME="${github_username}"
        export GITHUB_TOKEN="${github_token}"
        
        success "GitHub 凭证已配置"
        
        # 重新加载 .bashrc
        source ~/.bashrc
    else
        log "GitHub 凭证已存在"
    fi
}

# 配置 Git 凭证
setup_git_credentials() {
    log "配置 Git 凭证..."
    
    # 首先从 .bashrc 加载现有凭证
    if [ -f ~/.bashrc ]; then
        source ~/.bashrc
    fi
    
    # 检查现有凭证
    if [ ! -z "$GITHUB_TOKEN" ] && [ ! -z "$GITHUB_USERNAME" ]; then
        log "发现现有凭证，正在验证..."
        
        if check_token_permissions; then
            success "现有凭证有效，继续使用"
            
            # 确保 git 配置正确
            git config --global credential.helper store
            echo "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
            chmod 600 ~/.git-credentials
            
            # 更新代码
            log "从 GitHub 更新代码..."
            if git pull origin main; then
                success "代码更新成功"
                return 0
            else
                error "代码更新失败，但凭证有效"
                return 1
            fi
        else
            log "现有凭证已失效，需要重新配置"
        fi
    else
        log "未找到现有凭证，需要重新配置"
    fi
    
    # 如果到这里，说明需要重新输入凭证
    # ... 其余代码保持不变 ...
}

# 检查并安装 Node.js 和 npm
check_and_install_node() {
    log "检查 Node.js 和 npm 安装状态..."
    
    if ! command -v node &> /dev/null; then
        log "正在安装 Node.js..."
        if [ -f /etc/system-release ] && grep -q "Amazon Linux" /etc/system-release; then
            curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        elif [ -f /etc/debian_version ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            error "不支持的操作系统"
            exit 1
        fi
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 安装失败"
        exit 1
    fi
    
    success "Node.js $(node -v) 和 npm $(npm -v) 已安装"
}

# 检查 docker 和 docker-compose
check_dependencies() {
    log "检查 Docker 依赖..."
    
    if ! command -v docker &> /dev/null; then
        error "未找到 docker，请先安装 docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "未找到 docker-compose，请先安装 docker-compose"
        exit 1
    fi
    
    success "Docker 依赖检查通过"
}

# 检查环境变量文件
check_env_file() {
    log "检查环境变量文件..."
    
    if [ ! -f ".env.production" ]; then
        error "环境变量文件 .env.production 不存在"
        exit 1
    fi
    
    # 从 .env.production 文件中读取所有非注释的键
    required_vars=($(grep -v '^#' .env.production | grep '=' | cut -d '=' -f1))
    
    # 检查每个环境变量是否有值
    missing_or_empty=()
    for var in "${required_vars[@]}"; do
        # 获取变量值
        value=$(grep "^${var}=" .env.production | cut -d '=' -f2)
        
        # 检查值是否为空
        if [ -z "$value" ] || [ "$value" = '""' ] || [ "$value" = "''" ]; then
            missing_or_empty+=("$var")
        fi
    done
    
    # 如果有空值或未设置的变量
    if [ ${#missing_or_empty[@]} -ne 0 ]; then
        error "以下环境变量在 .env.production 中未设置或为空："
        for var in "${missing_or_empty[@]}"; do
            echo "- $var"
        done
        
        read -p "是否继续部署？(y/n) " continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            error "部署已取消"
            exit 1
        fi
        
        log "继续部署，但某些功能可能无法正常工作..."
    else
        success "所有环境变量检查通过"
    fi
    
    # 检查关键服务的必需变量
    critical_vars=(
        "STRIPE_SECRET_KEY"
        "VITE_STRIPE_PUBLISHABLE_KEY"
        "VITE_STRIPE_MODE"
    )
    
    missing_critical=()
    for var in "${critical_vars[@]}"; do
        value=$(grep "^${var}=" .env.production | cut -d '=' -f2)
        if [ -z "$value" ] || [ "$value" = '""' ] || [ "$value" = "''" ]; then
            missing_critical+=("$var")
        fi
    done
    
    if [ ${#missing_critical[@]} -ne 0 ]; then
        error "以下关键环境变量未设置，支付功能可能无法正常工作："
        for var in "${missing_critical[@]}"; do
            echo "- $var"
        done
        
        read -p "确定要继续部署吗？(y/n) " continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            error "部署已取消"
            exit 1
        fi
    fi
}

# 清理环境
cleanup() {
    log "开始清理环境..."
    
    log "停止所有容器..."s
    docker-compose -f docker-compose.prod.yml down
    
    log "清理 Docker 缓存..."
    docker system prune -f
    
    log "清理 Docker 卷..."
    docker volume prune -f
    
    success "环境清理完成"
}

# 构建和启动服务
deploy_services() {
    log "开始部署服务..."
    
    # 1. 检查环境变量文件
    if [ ! -f ".env.production" ]; then
        error ".env.production 文件不存在，请确保已正确配置环境变量文件"
        exit 1
    fi
    
    # 2. 检查环境变量
    check_env_file
    
    # 3. 完整的清理流程
    log "执行完整清理..."
    
    # 4. 停止所有相关容器
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    
    # 5. 检查并结束占用端口的进程
    for port in 4173 4242; do
        log "检查端口 ${port} 占用情况..."
        if lsof -i :${port} > /dev/null; then
            log "端口 ${port} 被占用，尝试释放..."
            sudo lsof -t -i:${port} | xargs -r kill -9
        fi
    done
    
    # 6. 清理 Docker 资源
    log "清理 Docker 资源..."
    docker system prune -f
    docker volume prune -f
    docker network prune -f
    
    # 7. 开始构建和部署
    log "开始构建服务..."
    if ! docker-compose -f docker-compose.prod.yml build --no-cache; then
        error "服务构建失败"
        exit 1
    fi
    success "服务构建成功"
    
    # 8. ��动服务并监控健康状态
    log "开始启动服务..."
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if docker-compose --env-file .env.production -f docker-compose.prod.yml up -d; then
            log "服务已启动，等待健康检查..."
            
            # 先检查支付服务
            if ! check_payment_service; then
                error "支付服务启动失败，尝试重启..."
                docker-compose -f docker-compose.prod.yml restart payment
                sleep 15
                
                if ! check_payment_service; then
                    error "支付服务重启后仍然失败"
                    docker-compose -f docker-compose.prod.yml logs payment
                    ((retry_count++))
                    continue
                fi
            fi
            
            # 循环检查每个服务的状态
            for i in {1..30}; do
                log "检查服务状态... (${i}/30)"
                
                # 获取每个服务的状态
                frontend_status=$(docker-compose -f docker-compose.prod.yml ps frontend | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
                payment_status=$(docker-compose -f docker-compose.prod.yml ps payment | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
                nginx_status=$(docker-compose -f docker-compose.prod.yml ps nginx | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
                
                echo "Frontend: ${frontend_status} | Payment: ${payment_status} | Nginx: ${nginx_status}"
                
                if [[ "$frontend_status" == "healthy" ]] && 
                   [[ "$payment_status" == "healthy" ]] && 
                   [[ "$nginx_status" == "healthy" ]]; then
                    success "所有服务已成功启动并通过健康检查"
                    return 0
                fi
                
                # 显示不健康服务的日志
                for service in "frontend" "payment" "nginx"; do
                    status_var="${service}_status"
                    if [[ "${!status_var}" == "unhealthy" ]]; then
                        error "${service} 服务不健康，最新日志："
                        docker-compose -f docker-compose.prod.yml logs --tail=50 ${service}
                    fi
                done
                
                sleep 10
            done
            
            error "服务启动超时，完整日志："
            docker-compose -f docker-compose.prod.yml logs
            ((retry_count++))
            
            if [ $retry_count -lt $max_retries ]; then
                log "尝试重启服务（第 $retry_count 次）..."
                docker-compose -f docker-compose.prod.yml down
                sleep 10
                continue
            fi
        else
            error "服务启动失败"
            docker-compose -f docker-compose.prod.yml logs
            exit 1
        fi
    done
    
    error "服务启动失败，已达到最大重试次数"
    exit 1
}

# 检查服务健康状态
check_health() {
    local max_attempts=30
    local attempt=0
    local services=("frontend" "payment" "nginx")
    local health_status=()

    log "🩺 开始服务健康检查..."
    
    for service in "${services[@]}"; do
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            local status=$(docker-compose -f docker-compose.prod.yml ps -a | grep "$service" | awk '{print $4}')
            
            if [[ "$status" == "healthy" ]]; then
                success "✅ $service 服务健康状态正常"
                health_status+=("$service:healthy")
                break
            elif [[ "$status" == "unhealthy" ]]; then
                error "❌ $service 服务健康检查失败"
                health_status+=("$service:unhealthy")
                break
            else
                log "🔄 等待 $service 服务就绪... (尝试 $((attempt+1))/$max_attempts)"
                sleep 10
                ((attempt++))
            fi
        done

        if [ $attempt -eq $max_attempts ]; then
            error "❌ $service 服务启动超时"
            health_status+=("$service:timeout")
        fi
    done

    # 显示总体健康状态
    local overall_health="✨ 部署健康状态总览:\n"
    for status in "${health_status[@]}"; do
        service=$(echo "$status" | cut -d ':' -f1)
        health=$(echo "$status" | cut -d ':' -f2)
        overall_health+="  $service: $health\n"
    done
    
    log "$overall_health"

    # 检查是否所有服务都健康
    if [[ ! " ${health_status[@]} " =~ "unhealthy" ]] && [[ ! " ${health_status[@]} " =~ "timeout" ]]; then
        success "🎉 所有服务已成功部署并健康运行！"
        return 0
    else
        error "🚨 部署存在问题，请检查服务状态！"
        return 1
    fi
}

# 显示服务状态
show_status() {
    log "当前服务状态："
    docker-compose -f docker-compose.prod.yml ps
    
    log "服务访问地址："
    echo "前端服务: http://localhost:4173"
    echo "支付服务: http://localhost:4242"
    
    log "查看服务日志（按 Ctrl+C 退出）..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# 检查 GitHub Token 权限
check_token_permissions() {
    log "检查 GitHub Token 权限..."
    
    # 添加调试信息
    log "当前用户名: ${GITHUB_USERNAME}"
    log "Token 长度: ${#GITHUB_TOKEN}"
    
    # 使用 GitHub API 检查 token 权限
    local response=$(curl -s -w "\n%{http_code}" -H "Authorization: token ${GITHUB_TOKEN}" \
                         -H "Accept: application/vnd.github.v3+json" \
                         https://api.github.com/user)
    
    local body=$(echo "$response" | head -n 1)
    local status=$(echo "$response" | tail -n 1)
    
    log "API 响应状态码: ${status}"
    
    if [ "$status" = "200" ]; then
        success "Token 验证成功"
        return 0
    else
        error "Token 验证失败: ${body}"
        return 1
    fi
}

show_token_guide() {
    echo "
请按以下步骤创建正确的 GitHub Token：

1. 访问 GitHub.com
2. 点击右角头像 -> Settings
3. 左侧菜单底部选择 Developer settings
4. 选择 Personal access tokens -> Tokens (classic)
5. 点击 Generate new token -> Generate new token (classic)
6. 设置 Token 名称（如：AWS_DEPLOY）
7. 选择以下必要权限：
   ✓ repo (全选所有子项)
      - repo:status
      - repo_deployment
      - public_repo
      - repo:invite
   ✓ workflow (如果使用 GitHub Actions)
8. 设置合适的过期时间（建议90天）
9. 点击底部的 Generate token
10. 立即复制生成的 token（它只显示一次！）

创建完成后，请重新运行部署脚本。
"
}

# 检查支付服务状态
check_payment_service() {
    log "检查支付服务状态..."
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "尝试连接支付服务 (${attempt}/${max_attempts})..."
        
        # 获取容器状态和日志
        local container_id=$(docker-compose -f docker-compose.prod.yml ps -q payment)
        if [ -z "$container_id" ]; then
            error "找不到支付服务容器"
            return 1
        fi
        
        local container_status=$(docker inspect --format='{{.State.Status}}' $container_id 2>/dev/null || echo "unknown")
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' $container_id 2>/dev/null || echo "unknown")
        
        log "容器状态: ${container_status}, 健康状态: ${health_status}"
        
        # 显示容器日志
        log "最近的容器日志:"
        docker logs --tail=20 $container_id
        
        if [ "$container_status" = "running" ]; then
            if [ "$health_status" = "healthy" ] || curl -s http://localhost:4242/health > /dev/null; then
                success "支付服务运行正常"
                return 0
            fi
        fi
        
        error "支付服务未就绪，等待重试..."
        ((attempt++))
        sleep 10
    done
    
    error "支付服务健康检查失败"
    return 1
}

# 主函数
main() {
    log "开始一键部署流程..."
    
    # 1. 配置环境变量
    setup_environment
    
    # 2. 配置 Git 并更新代码
    setup_git_credentials
    
    # 3. 检查基础环境
    check_and_install_node
    check_dependencies
    check_env_file
    
    # 4. 部署服务
    cleanup
    deploy_services
    check_health
    show_status
}

# 执行主函数
main 