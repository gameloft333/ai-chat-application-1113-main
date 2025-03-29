#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志配置
LOG_DIR="logs/certificate"
LOG_FILE="$LOG_DIR/certificate_renewal_$(date +%Y%m%d_%H%M%S).log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_FILE") 2>&1

# Functions
log() { echo -e "${GREEN}[INFO] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }

# 检查参数
if [ $# -lt 1 ]; then
    error "使用方法: $0 <domain>"
    error "示例: $0 love.saga4v.com"
    exit 1
fi

DOMAIN=$1
NGINX_CONTAINER="saga4v-nginx"

# 检查域名格式
if ! echo "$DOMAIN" | grep -qE '^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'; then
    error "无效的域名格式: $DOMAIN"
    exit 1
fi

# 停止Nginx服务
stop_nginx() {
    log "停止Nginx服务..."
    if docker ps -q --filter "name=$NGINX_CONTAINER" | grep -q .; then
        log "停止容器 $NGINX_CONTAINER..."
        docker stop -t 30 $NGINX_CONTAINER || docker kill $NGINX_CONTAINER
    else
        warn "Nginx容器未运行"
    fi
}

# 启动Nginx服务
start_nginx() {
    log "启动Nginx服务..."
    if docker-compose -f "docker-compose.nginx-global_v06.yml" up -d; then
        log "Nginx服务已启动"
    else
        error "Nginx服务启动失败"
        return 1
    fi
}

# 更新证书
renew_certificate() {
    log "开始更新 $DOMAIN 的证书..."
    
    # 停止Nginx以释放80端口
    stop_nginx
    
    # 使用certbot更新证书
    log "使用certbot更新证书..."
    if certbot certonly --standalone -d $DOMAIN --force-renewal; then
        log "证书更新成功"
    else
        error "证书更新失败"
        return 1
    fi
    
    # 重新启动Nginx
    start_nginx
    
    # 验证证书
    verify_certificate
    
    return 0
}

# 验证证书
verify_certificate() {
    log "验证 $DOMAIN 的证书..."
    
    # 检查证书文件
    local cert_path="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    if [ ! -f "$cert_path" ]; then
        error "证书文件不存在: $cert_path"
        return 1
    fi
    
    # 检查证书有效期
    local current_time=$(date +%s)
    local not_before=$(openssl x509 -in "$cert_path" -noout -startdate | cut -d= -f2)
    local not_after=$(openssl x509 -in "$cert_path" -noout -enddate | cut -d= -f2)
    
    local start_time=$(date -d "$not_before" +%s)
    local end_time=$(date -d "$not_after" +%s)
    
    if [ $current_time -lt $start_time ]; then
        error "证书尚未生效 (生效时间: $not_before)"
        return 1
    fi
    
    if [ $current_time -gt $end_time ]; then
        error "证书已过期 (过期时间: $not_after)"
        return 1
    fi
    
    # 检查剩余有效期
    local days_left=$(( ($end_time - $current_time) / 86400 ))
    log "证书有效期剩余 $days_left 天"
    
    # 显示证书信息
    log "证书信息:"
    openssl x509 -in "$cert_path" -text -noout | grep -E "Subject:|Issuer:|Not Before:|Not After:" | sed 's/^/    /'
    
    log "✓ 证书验证通过"
    return 0
}

# 检查Nginx配置
check_nginx_config() {
    log "检查Nginx配置..."
    
    # 等待Nginx容器启动
    local max_retries=5
    local retry=0
    local wait_time=2
    
    while [ $retry -lt $max_retries ]; do
        if docker ps -q --filter "name=$NGINX_CONTAINER" | grep -q .; then
            break
        fi
        
        log "等待Nginx容器启动... ($retry/$max_retries)"
        sleep $wait_time
        retry=$((retry + 1))
        
        if [ $retry -eq $max_retries ]; then
            error "Nginx容器未能启动"
            return 1
        fi
    done
    
    # 检查Nginx配置
    if docker exec $NGINX_CONTAINER nginx -t; then
        log "✓ Nginx配置检查通过"
    else
        error "Nginx配置检查失败"
        return 1
    fi
    
    return 0
}

# 主函数
main() {
    log "开始为 $DOMAIN 更新SSL证书..."
    
    # 更新证书
    if ! renew_certificate; then
        error "证书更新失败"
        exit 1
    fi
    
    # 检查Nginx配置
    if ! check_nginx_config; then
        error "Nginx配置检查失败"
        exit 1
    fi
    
    log "✓ $DOMAIN 的证书已成功更新!"
    return 0
}

# 执行主函数
main