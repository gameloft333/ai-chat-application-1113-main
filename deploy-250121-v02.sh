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
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.nginx.yml down 2>/dev/null || true
    
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
    
    # 清理Docker资源
    docker system prune -f
    docker volume prune -f
    
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
    
    if lsof -i :$port > /dev/null 2>&1; then
        log "端口 $port 被占用，尝试释放..."
        
        # 如果是 nginx 占用的端口，先尝试停止 nginx 服务
        if lsof -i :$port | grep -q nginx; then
            log "检测到 Nginx 服务，尝试停止..."
            systemctl stop nginx 2>/dev/null
            sleep 2
            
            # 如果还有 nginx 进程在运行，尝试终止它们
            if pgrep nginx >/dev/null; then
                log "终止残留的 Nginx 进程..."
                killall nginx 2>/dev/null
                sleep 2
                
                # 如果进程仍然存在，强制终止
                if pgrep nginx >/dev/null; then
                    log "强制终止 Nginx 进程..."
                    killall -9 nginx 2>/dev/null
                    sleep 1
                fi
            fi
        fi
        
        # 获取占用端口的所有进程 PID
        local pids=$(lsof -t -i :$port)
        
        # 如果还有其他进程占用端口，尝试终止它们
        if [ ! -z "$pids" ]; then
            log "停止占用端口 $port 的进程: $pids"
            for pid in $pids; do
                kill -15 $pid 2>/dev/null
            done
            sleep 2
            
            # 检查是否还有进程存活，如果有则强制终止
            pids=$(lsof -t -i :$port)
            if [ ! -z "$pids" ]; then
                log "强制终止剩余进程..."
                for pid in $pids; do
                    kill -9 $pid 2>/dev/null
                done
                sleep 1
            fi
        fi
    fi
    
    # 最后检查端口
    if lsof -i :$port > /dev/null 2>&1; then
        error "无法释放端口 $port"
        return 1
    fi
    
    success "端口 $port 可用"
    return 0
}

# 8. 构建和启动服务
deploy_services() {
    log "开始部署服务..."
    
    # 构建服务
    if ! docker-compose -f docker-compose.yml build; then
        error "服务构建失败"
        exit 1
    fi
    success "服务构建成功"
    
    # 启动主服务
    if ! docker-compose -f docker-compose.yml up -d; then
        error "主服务启动失败"
        exit 1
    fi
    success "主服务启动成功"
    
    # 启动Nginx服务
    if ! docker-compose -f docker-compose.nginx.yml up -d; then
        error "Nginx服务启动失败"
        exit 1
    fi
    success "Nginx服务启动成功"
}

# 9. 检查服务状态
check_services() {
    log "检查服务状态..."
    sleep 30  # 等待服务完全启动
    
    docker-compose -f docker-compose.yml ps
    docker-compose -f docker-compose.nginx.yml ps
    
    # 检查服务健康状态
    if curl -s -f https://love.saga4v.com > /dev/null; then
        success "网站可以访问"
    else
        error "网站无法访问"
    fi
}

# 主函数
main() {
    log "开始部署流程..."
    
    # 1. 首先停止现有服务
    stop_current_services
    
    # 2. 确保网络存在（移到最前面）
    ensure_network
    
    # 3. 其他检查
    check_git_updates
    check_node
    check_docker
    check_env_files
    cleanup_environment
    
    # 4. 部署服务
    log "开始部署服务..."
    
    # 构建服务（使用 --no-cache 确保完全重新构建）
    if ! docker-compose -f docker-compose.yml build; then
        error "服务构建失败"
        exit 1
    fi
    success "服务构建成功"
    
    # 启动主服务（确保网络已存在）
    if ! docker network ls | grep -q app_network; then
        docker network create app_network
    fi
    
    if ! docker-compose -f docker-compose.yml up -d; then
        error "主服务启动失败"
        exit 1
    fi
    success "主服务启动成功"
    
    # 启动 Nginx 服务前检查端口
    if ! check_port 443; then
        error "无法启动 Nginx：端口 443 被占用"
        exit 1
    fi
    
    if ! check_port 80; then
        error "无法启动 Nginx：端口 80 被占用"
        exit 1
        
    # 启动 Nginx 服务
    if ! docker-compose -f docker-compose.nginx.yml up -d; then
        error "Nginx服务启动失败"
        exit 1
    fi
    success "Nginx服务启动成功"
    
    check_services
    
    success "部署完成!"
}

# 执行主函数
main 