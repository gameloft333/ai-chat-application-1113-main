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
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# 检查并停止运行中的服务
check_and_stop_services() {
    log "检查运行中的服务..."
    
    # 检查是否有运行中的容器
    if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
        log "发现运行中的服务，正在停止..."
        docker-compose -f docker-compose.prod.yml down
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
        error "环境变量文件 .env.production 不存在"
        exit 1
    fi
    success "环境变量文件检查通过"
}

# 清理环境
cleanup() {
    log "开始清理环境..."
    
    log "停止所有容器..."
    docker-compose -f docker-compose.prod.yml down
    
    log "清理 Docker 缓存..."
    docker system prune -f
    
    log "清理 Docker 卷..."
    docker volume prune -f
    
    success "环境清理完成"
}

# 构建服务
build_services() {
    log "开始构建服务..."
    
    if docker-compose -f docker-compose.prod.yml build --no-cache; then
        success "服务构建成功"
    else
        error "服务构建失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log "开始启动服务..."
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if docker-compose --env-file .env.production -f docker-compose.prod.yml up -d; then
            # 等待服务启动
            log "等待服务启动（30秒）..."
            sleep 30
            
            # 检查服务状态
            if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
                error "服务启动异常，查看日志..."
                docker-compose -f docker-compose.prod.yml logs
                ((retry_count++))
                
                if [ $retry_count -lt $max_retries ]; then
                    log "尝试重启服务（第 $retry_count 次）..."
                    docker-compose -f docker-compose.prod.yml down
                    sleep 10
                    continue
                fi
            else
                success "服务启动成功"
                return 0
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
    docker-compose -f docker-compose.prod.yml ps
    
    log "服务访问地址："
    echo "前端服务: http://localhost:4173"
    echo "支付服务: http://localhost:4242"
    
    log "查看服务日志（按 Ctrl+C 退出）..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# 主函数
main() {
    log "开始部署生产环境服务..."
    check_dependencies
    check_env_file      
    check_and_stop_services
    cleanup
    build_services
    start_services
    check_health
    show_status
}

# 执行主函数
main