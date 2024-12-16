#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
}

# 检查并停止运行中的服务
check_and_stop_services() {
    log "检查运行中的服务..."
    
    # 检查是否有运行中的容器
    if docker-compose ps -q | grep -q .; then
        log "发现运行中的服务，正在停止..."
        docker-compose down
        success "已停止所有运行中的服务"
    else
        log "没有运行中的服务"
    fi
}

# 检查 docker 和 docker-compose 是否安装
check_dependencies() {
    log "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        error "未找到 docker，请先安装 docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "未找到 docker-compose，请先安装 docker-compose"
        exit 1
    fi
    
    success "依赖检查通过"
}

# 检查环境变量文件
check_env_file() {
    log "检查环境变量文件..."
    
    if [ ! -f ".env.production" ]; then
        error "未找到 .env.production 文件"
        log "请创建 .env.production 文件并配置以下环境变量："
        echo "
需要配置的环境变量：

# AI API Keys
- VITE_MOONSHOT_API_KEY
- VITE_GEMINI_API_KEY

# Payment Config - Production Mode
- VITE_STRIPE_MODE
- STRIPE_SECRET_KEY
- VITE_STRIPE_PUBLISHABLE_KEY

# Firebase Config
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

# App Config
- VITE_API_KEY
- NODE_ENV=production

请确保所有环境变量都已正确配置后再运行部署脚本。
"
        exit 1
    else
        success "已找到 .env.production 文件"
    fi
}

# 清理环境
cleanup() {
    log "开始清理环境..."
    
    log "停止所有容器..."
    docker-compose down
    
    log "清理 Docker 缓存..."
    docker system prune -f
    
    log "清理 Docker 卷..."
    docker volume prune -f
    
    success "环境清理完成"
}

# 构建服务
build_services() {
    log "开始构建服务..."
    
    if docker-compose build --no-cache; then
        success "服务构建成功"
    else
        error "服务构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log "开始启动服务..."
    
    if docker-compose up -d; then
        success "服务启动成功"
    else
        error "服务启动失败"
        exit 1
    fi
}

# 检查服务健康状态
check_health() {
    log "检查服务健康状态..."
    
    # 等待服务启动
    log "等待服务启动（30秒）..."
    sleep 30
    
    # 检查前端服务
    if curl -s -f http://localhost:4173 > /dev/null; then
        success "前端服务运行正常"
    else
        error "前端服务未正常运行"
    fi
    
    # 检查支付服务
    if curl -s -f http://localhost:4242 > /dev/null; then
        success "支付服务运行正常"
    else
        error "支付服务未正常运行"
    fi
}

# 显示服务状态
show_status() {
    log "当前服务状态："
    docker-compose ps
    
    log "服务访问地址："
    echo "前端服务: http://localhost:4173"
    echo "支付服务: http://localhost:4242"
    
    log "查看服务日志（按 Ctrl+C 退出）..."
    docker-compose logs -f
}

# 主函数
# 主函数
main() {
    log "开始部署服务..."    
    check_dependencies
    check_env_file      # 新增：检查环境变量文件
    check_and_stop_services
    cleanup
    build_services
    start_services
    check_health
    show_status
}

# 执行主函数
main