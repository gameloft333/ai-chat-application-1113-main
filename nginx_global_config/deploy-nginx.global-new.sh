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
    local max_retries=5
    local retry=0
    
    # 从配置文件中提取需要 HTTPS 的域名
    log "检查需要 HTTPS 的域名..."
    local https_domains=$(grep -A1 "listen 80;" "$NGINX_CONF" | grep "server_name" | grep -v "_" | awk '{for(i=2;i<=NF;i++) print $i}' | sed 's/;//')
    
    while [ $retry -lt $max_retries ]; do
        if docker exec saga4v-nginx nginx -t &>/dev/null; then
            log "Nginx 配置测试通过"
            
            local cert_errors=0
            local cert_warnings=0
            
            # 检查每个需要 HTTPS 的域名的证书
            for domain in $https_domains; do
                log "检查域名 $domain 的证书配置..."
                
                # 检查证书文件
                if docker exec saga4v-nginx [ -f "/etc/nginx/ssl/$domain/fullchain.pem" ] && \
                   docker exec saga4v-nginx [ -f "/etc/nginx/ssl/$domain/privkey.pem" ]; then
                    log "✓ $domain 的 SSL 证书文件存在"
                    
                    # 验证证书有效性
                    if docker exec saga4v-nginx openssl x509 -in "/etc/nginx/ssl/$domain/fullchain.pem" -noout -checkend 0 &>/dev/null; then
                        log "✓ $domain 的 SSL 证书有效"
                    else
                        warn "! $domain 的 SSL 证书可能已过期"
                        cert_warnings=$((cert_warnings + 1))
                    fi
                else
                    error "✗ $domain 缺少 SSL 证书文件"
                    cert_errors=$((cert_errors + 1))
                fi
            done
            
            # 根据检查结果决定是否继续
            if [ $cert_errors -gt 0 ]; then
                error "发现 $cert_errors 个证书错误"
                return 1
            elif [ $cert_warnings -gt 0 ]; then
                warn "发现 $cert_warnings 个证书警告，但将继续部署"
            fi
            
            return 0
        fi
        
        retry=$((retry + 1))
        if [ $retry -eq $max_retries ]; then
            error "健康检查失败"
            docker logs saga4v-nginx
            return 1
        fi
        
        log "等待服务就绪... ($retry/$max_retries)"
        sleep 5
    done
}

# Verify deployment
verify_deployment() {
    log "[STEP 6/6] 验证部署..."
    
    # 检查容器状态
    if ! docker ps | grep -q saga4v-nginx; then
        error "容器未运行"
        return 1
    fi
    
    # 检查网络连接
    if ! docker network inspect saga4v_network | grep -q saga4v-nginx; then
        error "容器未正确加入网络"
        return 1
    fi
    
    # 检查日志是否有错误
    if docker logs saga4v-nginx 2>&1 | grep -i "error"; then
        warn "日志中发现错误信息"
    fi
    
    log "部署验证完成"
}

# Main function
main() {
    log "开始部署全局 Nginx..."
    
    backup_configs
    create_network
    stop_existing
    deploy_container
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