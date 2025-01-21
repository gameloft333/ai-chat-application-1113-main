#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 项目配置
PROJECT_NAME="ai-chat-application-1113-main"
REQUIRED_ENV_FILES=(".env.production")

# 日志函数
log() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 1. 停止当前服务
stop_current_services() {
    log "停止当前运行的服务..."
    docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.nginx.yml down --remove-orphans 2>/dev/null || true
    
    # 强制停止相关容器
    CONTAINERS=$(docker ps -a | grep "${PROJECT_NAME}" | awk '{print $1}')
    if [ ! -z "$CONTAINERS" ]; then
        docker rm -f $CONTAINERS
    fi
    success "所有服务已停止"
}

# 2. 检查Git更新
check_git_updates() {
    log "检查Git更新..."
    
    # 获取当前分支
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    # 临时关闭SSL验证（如果有GitHub连接问题）
    git config --global http.sslVerify false
    
    # 获取远程更新
    if ! git fetch origin $CURRENT_BRANCH; then
        error "无法从远程仓库获取更新"
        exit 1
    fi
    
    # 检查是否有更新
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        log "发现新更新，正在拉取..."
        if ! git pull origin $CURRENT_BRANCH; then
            error "拉取更新失败"
            exit 1
        fi
        success "代码已更新到最新版本"
    else
        log "代码已是最新版本"
    fi
    
    # 恢复SSL验证
    git config --global http.sslVerify true
}

# 3. 检查Node.js和npm
check_node() {
    log "检查 Node.js 和 npm..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装"
        log "正在安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm 未安装"
        exit 1
    fi
    
    success "Node.js $(node -v) 和 npm $(npm -v) 检查通过"
}

# 4. 检查Docker依赖
check_docker() {
    log "检查 Docker 依赖..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安装"
        exit 1
    fi
    
    success "Docker 依赖检查通过"
}

# 5. 检查环境变量文件
check_env_files() {
    log "检查环境变量文件..."
    
    for env_file in "${REQUIRED_ENV_FILES[@]}"; do
        if [ ! -f "$env_file" ]; then
            error "缺少环境变量文件: $env_file"
            exit 1
        fi
    done
    
    success "环境变量文件检查通过"
}

# 6. 清理环境
cleanup_environment() {
    log "清理环境..."
    
    # 停止并删除所有相关容器
    docker-compose -f docker-compose.yml down --remove-orphans
    docker-compose -f docker-compose.nginx.yml down --remove-orphans
    
    # 清理特定的孤立容器
    local orphans=$(docker ps -a | grep "${PROJECT_NAME}" | awk '{print $1}')
    if [ ! -z "$orphans" ]; then
        log "清理孤立容器..."
        docker rm -f $orphans
    fi
    
    # 清理未使用的网络
    log "清理未使用的网络..."
    docker network prune -f
    
    # 清理构建缓存
    rm -rf dist
    
    success "环境清理完成"
}

# 7. 创建网络
ensure_network() {
    log "确保网络存在..."
    if ! docker network ls | grep -q app_network; then
        if ! docker network create app_network; then
            error "创建 app_network 网络失败"
            exit 1
        fi
        success "创建 app_network 网络成功"
    else
        log "app_network 网络已存在"
    fi
}

# 添加新的端口检查函数
check_port() {
    local port=$1
    log "检查端口 $port 是否被占用..."
    
    # 使用 netstat 来检查端口占用情况
    if ! netstat -tuln | grep ":$port " > /dev/null 2>&1; then
        success "端口 $port 可用于项目使用"
        return 0
    else
        local pid=$(lsof -t -i:$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            error "端口 $port 被进程 $pid 占用"
            return 1
        else
            # 如果 lsof 没有显示结果但 netstat 显示端口被占用
            # 可能是因为权限问题或进程已经释放但端口还在 TIME_WAIT 状态
            log "端口 $port 可能处于 TIME_WAIT 状态，等待释放..."
            sleep 5
            if ! netstat -tuln | grep ":$port " > /dev/null 2>&1; then
                success "端口 $port 已释放，可以使用"
                return 0
            else
                error "端口 $port 仍然被占用"
                return 1
            fi
        fi
    fi
}

# 在 check_port 函数后添加新函数
check_ssl_certificates() {
    log "检查 SSL 证书..."
    
    local cert_paths=(
        "/etc/letsencrypt/live/love.saga4v.com/fullchain.pem"
        "/etc/letsencrypt/live/love.saga4v.com/privkey.pem"
        "/etc/letsencrypt/live/play.saga4v.com/fullchain.pem"
        "/etc/letsencrypt/live/play.saga4v.com/privkey.pem"
    )
    
    for cert_path in "${cert_paths[@]}"; do
        if [ ! -f "$cert_path" ]; then
            error "SSL 证书文件不存在: $cert_path"
            return 1
        fi
    done
    
    success "SSL 证书检查通过"
    return 0
}

# 8. 构建和启动服务
deploy_services() {
    log "开始部署服务..."
    
    # 确保清理环境
    cleanup_environment
    
    # 确保网络存在
    ensure_network
    
    # 构建并启动前端服务
    log "构建并启动前端服务..."
    if ! docker-compose -f docker-compose.yml up -d --build frontend; then
        error "前端服务启动失败"
        exit 1
    fi
    
    # 等待前端服务健康检查
    log "等待前端服务就绪..."
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker ps --filter "name=${PROJECT_NAME}-frontend" --filter "health=healthy" | grep -q "${PROJECT_NAME}-frontend"; then
            success "前端服务就绪"
            break
        fi
        log "等待前端服务就绪 ($attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "前端服务启动超时"
        exit 1
    fi
    
    # 启动 Nginx 服务
    log "启动 Nginx 服务..."
    if ! docker-compose -f docker-compose.nginx.yml up -d; then
        error "Nginx 服务启动失败"
        exit 1
    fi
    
    # 检查 Nginx 配置
    if ! check_nginx_config; then
        error "Nginx 配置检查失败"
        exit 1
    fi
    
    success "所有服务部署完成"
}

# 9. 检查服务状态
check_services() {
    log "检查服务状态..."
    
    # 检查前端服务状态和日志
    log "前端服务状态和日志："
    docker ps --filter "name=${PROJECT_NAME}-frontend"
    docker logs --tail 50 "${PROJECT_NAME}-frontend-1" || true
    
    # 检查 Nginx 状态和配置
    log "Nginx 状态和配置："
    docker ps --filter "name=${PROJECT_NAME}-nginx"
    docker inspect "${PROJECT_NAME}-nginx-1" || true
    
    # 检查 Nginx 日志目录
    log "检查 Nginx 日志目录..."
    docker exec "${PROJECT_NAME}-nginx-1" ls -la /var/log/nginx/ || true
    
    # 检查 Nginx 配置文件
    log "检查 Nginx 配置文件..."
    docker exec "${PROJECT_NAME}-nginx-1" cat /etc/nginx/nginx.conf || true
    
    # 检查端点可访问性
    log "检查端点可访问性..."
    curl -v -k https://love.saga4v.com 2>&1 || true
}

# 检查 Nginx 配置
check_nginx_config() {
    log "检查 Nginx 配置..."
    
    # 检查配置文件是否存在
    if ! docker exec "${PROJECT_NAME}-nginx-1" test -f /etc/nginx/nginx.conf; then
        error "Nginx 配置文件不存在"
        return 1
    fi
    
    # 检查配置文件权限
    log "检查配置文件权限..."
    docker exec "${PROJECT_NAME}-nginx-1" ls -l /etc/nginx/nginx.conf || true
    
    # 检查 SSL 证书文件权限
    log "检查 SSL 证书权限..."
    docker exec "${PROJECT_NAME}-nginx-1" ls -l /etc/nginx/ssl/love/ || true
    
    # 验证 Nginx 配置
    if ! docker exec "${PROJECT_NAME}-nginx-1" nginx -t; then
        error "Nginx 配置验证失败"
        return 1
    fi
    
    success "Nginx 配置检查通过"
    return 0
}

# 检查服务是否已经运行
check_running_services() {
    log "检查现有服务状态..."
    
    local services=(
        "${PROJECT_NAME}-frontend-1"
        "${PROJECT_NAME}-nginx-1"
    )
    
    local running_count=0
    for service in "${services[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${service}$"; then
            log "服务 ${service} 正在运行"
            ((running_count++))
        fi
    done
    
    if [ $running_count -gt 0 ]; then
        log "检测到 ${running_count} 个服务正在运行，执行重新部署流程"
        return 0
    else
        log "未检测到运行中的服务，执行首次部署流程"
        return 1
    fi
}

# 重新部署服务
redeploy_services() {
    log "开始重新部署服务..."
    
    # 停止并移除现有服务
    log "停止现有服务..."
    docker-compose -f docker-compose.yml down
    docker-compose -f docker-compose.nginx.yml down
    
    # 清理旧容器和网络
    cleanup_environment
    
    # 确保网络存在
    ensure_network
    
    # 重新构建和启动服务
    log "重新构建和启动服务..."
    if ! docker-compose -f docker-compose.yml up -d --build frontend; then
        error "主服务重新部署失败"
        exit 1
    fi
    success "主服务重新部署成功"
    
    # 检查 SSL 证书
    if ! check_ssl_certificates; then
        error "SSL 证书检查失败，无法启动 Nginx"
        exit 1
    fi
    
    # 检查端口
    if ! check_port 443 || ! check_port 80; then
        error "端口检查失败"
        exit 1
    fi
    
    # 启动 Nginx
    if ! docker-compose -f docker-compose.nginx.yml up -d; then
        error "Nginx 服务重新部署失败"
        exit 1
    fi
    success "Nginx 服务重新部署成功"
    
    # 检查服务状态
    check_services
}

# 检查端点可访问性
check_endpoint() {
    local url=$1
    log "检查端点可访问: $url"
    
    # 使用 curl 检查端点，设置超时和重试
    if curl -k -s -f -m 10 --retry 3 --retry-delay 2 "$url" > /dev/null; then
        success "端点可访问: $url"
        return 0
    else
        error "端点不可访问: $url"
        # 检查 Nginx 日志
        log "检查 Nginx 错误日志..."
        docker exec ai-chat-application-1113-main-nginx-1 tail -n 50 /var/log/nginx/error.log || true
        return 1
    fi
}

# 主函数
main() {
    log "开始部署流程..."
    
    # 检查是否需要重新部署
    if check_running_services; then
        redeploy_services
    else
        # 首次部署流程
        check_git_updates
        check_node
        check_docker
        check_env_files
        cleanup_environment
        ensure_network
        deploy_services
        check_services
    fi
    
    success "部署完成!"
}

# 执行主函数
main 