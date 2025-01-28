#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="nginx_deployment_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.nginx-global_v06.yml"
NGINX_CONF="nginx.global.250122.conf"
BACKUP_DIR="nginx_backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log() { echo -e "${GREEN}[INFO] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }

# Backup existing configuration
backup_configs() {
    log "[STEP 1/6] 备份现有配置..."
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$NGINX_CONF" ]; then
        cp "$NGINX_CONF" "$BACKUP_DIR/"
    fi
    
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/"
    fi
    
    log "配置已备份到 $BACKUP_DIR"
}

# Create external network if not exists
create_network() {
    log "[STEP 2/6] 检查网络配置..."
    if ! docker network inspect saga4v_network >/dev/null 2>&1; then
        log "创建 saga4v_network 网络..."
        docker network create saga4v_network
    else
        log "saga4v_network 网络已存在"
    fi
}

# Stop existing container
stop_existing() {
    log "[STEP 3/6] 停止现有容器..."
    if docker ps -q --filter "name=saga4v-nginx" | grep -q .; then
        docker stop saga4v-nginx || true
        docker rm saga4v-nginx || true
    fi
}

# Deploy new container
deploy_container() {
    log "[STEP 4/6] 部署新容器..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
}

# Health check
health_check() {
    log "[STEP 5/6] 健康检查..."
    local max_retries=10  # 增加重试次数
    local retry=0
    local wait_time=10  # 增加等待时间
    
    # 先等待容器完全启动
    sleep 15
    
    while [ $retry -lt $max_retries ]; do
        # 1. 检查容器状态
        if ! docker ps -q --filter "name=saga4v-nginx" --filter "status=running" | grep -q .; then
            log "等待容器启动... ($retry/$max_retries)"
            sleep $wait_time
            retry=$((retry + 1))
            continue
        fi
        
        # 2. 检查 Nginx 进程是否运行
        if docker exec saga4v-nginx pgrep nginx >/dev/null; then
            # 3. 简单检查 Nginx 是否响应
            if docker exec saga4v-nginx curl -s -I http://localhost/ 2>/dev/null | grep -q "HTTP/"; then
                log "✓ 健康检查通过"
                return 0
            fi
        fi
        
        log "等待服务就绪... ($retry/$max_retries)"
        sleep $wait_time
        retry=$((retry + 1))
    done
    
    # 如果检查失败，收集关键信息
    error "健康检查失败，收集诊断信息..."
    log "1. 容器状态："
    docker ps -a | grep saga4v-nginx
    log "2. 容器日志："
    docker logs --tail 20 saga4v-nginx
    log "3. Nginx 错误日志："
    docker exec saga4v-nginx cat /var/log/nginx/error.log 2>/dev/null || true
    
    return 1
}

# Verify deployment
verify_deployment() {
    log "[STEP 6/6] 验证部署..."
    
    # 检查容器状态
    if ! docker ps | grep -q saga4v-nginx; then
        error "容器未运行"
        # 显示详细错误信息
        docker logs saga4v-nginx
        docker inspect saga4v-nginx
        return 1
    fi
    
    # 检查 Nginx 进程
    if ! docker exec saga4v-nginx pgrep nginx >/dev/null; then
        error "Nginx 进程未运行"
        docker logs saga4v-nginx
        return 1
    fi
    
    # 检查端口监听
    if ! docker exec saga4v-nginx netstat -tlpn | grep -q ':80'; then
        error "80 端口未监听"
        return 1
    fi
    
    log "✓ 部署验证通过"
    return 0
}

# 添加检查 Nginx 日志目录的函数
check_nginx_logs() {
    log "[检查] 验证 Nginx 日志目录..."
    
    # 使用docker inspect检查容器状态
    if ! docker inspect saga4v-nginx >/dev/null 2>&1; then
        error "容器不存在"
        return 1
    fi
    
    # 使用volume而不是直接操作容器内部
    docker run --rm \
        --volumes-from saga4v-nginx \
        -v $(pwd)/scripts:/scripts \
        nginx:stable-alpine \
        sh -c '
            mkdir -p /var/log/nginx && \
            chown -R nginx:nginx /var/log/nginx && \
            chmod 755 /var/log/nginx
        '
    
    if [ $? -eq 0 ]; then
        log "✓ Nginx 日志目录配置完成"
    else
        error "Nginx 日志目录配置失败"
        return 1
    fi
}

# Main function
main() {
    log "开始部署全局 Nginx..."
    
    backup_configs
    create_network
    stop_existing
    deploy_container
    check_nginx_logs
    health_check
    verify_deployment
    
    log "部署完成!"
}

# Error handling
cleanup() {
    if [ $? -ne 0 ]; then
        error "部署失败，正在回滚..."
        if [ -d "$BACKUP_DIR" ]; then
            cp "$BACKUP_DIR"/* ./ 2>/dev/null || true
        fi
        docker-compose -f "$DOCKER_COMPOSE_FILE" down || true
    fi
}

trap cleanup EXIT

# Execute main function
main 

check_certificates() {
    log "检查 SSL 证书..."
    local domains="love.saga4v.com play.saga4v.com payment.saga4v.com"
    
    for domain in $domains; do
        if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ] || \
           [ ! -f "/etc/letsencrypt/live/$domain/privkey.pem" ]; then
            error "缺少 $domain 的证书文件"
            return 1
        fi
    done
    
    log "✓ SSL 证书检查通过"
    return 0
}

verify_cert() {
    local domain="payment.saga4v.com"
    openssl x509 -in /etc/letsencrypt/live/$domain/fullchain.pem -text -noout | grep "Subject:"
}

verify_config() {
    log "验证 Nginx 配置..."
    
    # 检查证书文件权限
    for domain in love.saga4v.com play.saga4v.com payment.saga4v.com; do
        if [ ! -r "/etc/nginx/ssl/$domain/fullchain.pem" ] || \
           [ ! -r "/etc/nginx/ssl/$domain/privkey.pem" ]; then
            error "证书文件权限错误: $domain"
            return 1
        fi
    done
    
    # 验证 Nginx 配置
    if ! docker exec saga4v-nginx nginx -t; then
        error "Nginx 配置验证失败"
        return 1
    fi
    
    return 0
}