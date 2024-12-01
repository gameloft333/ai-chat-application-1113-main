#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 输出带时间戳的日志
log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 成功: $1${NC}"
}

# 1. 停止所有容器
log "正在停止所有 Docker 容器..."
docker-compose down
success "Docker Compose 服务已停止"

# 2. 强制删除相关容器
log "正在删除所有相关容器..."
CONTAINERS=$(docker ps -a | grep "ai-chat-application-1113-main" | awk '{print $1}')
if [ ! -z "$CONTAINERS" ]; then
    docker rm -f $CONTAINERS
    success "相关容器已删除"
else
    log "没有找到相关容器"
fi

# 3. 清理网络
log "正在清理未使用的网络..."
docker network prune -f
success "网络已清理"

# 4. 检查端口占用
log "检查端口 4173 占用情况..."
PORT_CHECK=$(sudo netstat -tulpn | grep 4173)
if [ ! -z "$PORT_CHECK" ]; then
    error "端口 4173 仍被占用: \n$PORT_CHECK"
    log "尝试结束占用端口的进程..."
    sudo kill -9 $(sudo lsof -t -i:4173) 2>/dev/null || true
fi

# 5. 重启 Docker 服务
log "正在重启 Docker 服务..."
sudo systemctl restart docker
sleep 5
if systemctl is-active --quiet docker; then
    success "Docker 服务已重启"
else
    error "Docker 服务重启失败"
    exit 1
fi

# 6. 清理 Docker 系统资源
log "正在清理 Docker 系统资源..."
docker system prune -f
success "Docker 系统资源已清理"

# 7. 重新构建并启动服务
log "正在重新构建并启动服务..."
docker-compose up -d --build

# 8. 检查服务状态
log "检查服务状态..."
sleep 5
docker-compose ps

# 9. 最终检查
FINAL_CHECK=$(docker ps | grep "ai-chat-application-1113-main")
if [ ! -z "$FINAL_CHECK" ]; then
    success "服务已成功启动！"
    echo -e "\n当前运行的容器："
    docker ps
else
    error "服务可能未正常启动，请检查日志"
    docker-compose logs
fi 