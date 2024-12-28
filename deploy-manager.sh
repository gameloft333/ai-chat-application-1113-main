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

warning() {
    echo -e "\033[1;33m[$(date '+%Y-%m-%d %H:%M:%S')] 警告: $1\033[0m" >&2
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
    log "🔍 检查环境变量配置..."

    local env_file=".env.production"
    
    # 检查 .env.production 文件是否存在
    if [ ! -f "$env_file" ]; then
        error "❌ 环境变量文件 $env_file 不存在！"
        return 1  # 阻止部署
    fi

    # 定义必要和非必要环境变量
    declare -A env_var_types=(
        # 必要变量 - 缺失时需要中断并要求添加
        ["STRIPE_SECRET_KEY"]=required
        ["VITE_FIREBASE_API_KEY"]=required
        ["VITE_FIREBASE_PROJECT_ID"]=required

        # 可选变量 - 缺失时仅警告
        ["VITE_MOONSHOT_API_KEY"]=optional
        ["VITE_GEMINI_API_KEY"]=optional
        ["VITE_GROK_API_KEY"]=optional
        
        ["VITE_PAYPAL_SANDBOX_MODE"]=optional
        ["VITE_PAYPAL_CLIENT_ID"]=optional
        ["VITE_PAYPAL_CLIENT_SECRET"]=optional
        
        ["VITE_STRIPE_MODE"]=optional
        ["VITE_STRIPE_PUBLISHABLE_KEY"]=optional
        
        ["VITE_FIREBASE_AUTH_DOMAIN"]=optional
        ["VITE_FIREBASE_STORAGE_BUCKET"]=optional
        ["VITE_FIREBASE_MESSAGING_SENDER_ID"]=optional
        ["VITE_FIREBASE_APP_ID"]=optional
        ["VITE_FIREBASE_MEASUREMENT_ID"]=optional
        
        ["TON_NETWORK"]=optional
        ["TON_API_KEY"]=optional
        ["VITE_TON_WALLET_ADDRESS"]=optional
        ["TON_SERVER_PORT"]=optional
        ["TON_USD_RATE"]=optional
        ["TON_RATE_BUFFER"]=optional
        
        ["NODE_ENV"]=optional
        ["VITE_ENABLE_PAYPAL"]=optional
        ["VITE_ENABLE_STRIPE"]=optional
        ["VITE_ENABLE_TON"]=optional
        
        ["VITE_MARQUEE_ENABLED"]=optional
        ["VITE_MARQUEE_WEBSOCKET_URL"]=optional
        ["VITE_MARQUEE_ANIMATION_DURATION"]=optional
        ["VITE_MARQUEE_REFRESH_INTERVAL"]=optional
        ["VITE_MARQUEE_RANDOM_COLORS"]=optional
        ["VITE_MARQUEE_DEFAULT_SHADOW_COLOR"]=optional
    )

    local required_missing=()
    local optional_missing=()
    local empty_required=()

    # 检查每个变量
    for var in "${!env_var_types[@]}"; do
        # 检查变量是否在文件中存在
        if ! grep -q "^$var=" "$env_file"; then
            if [[ "${env_var_types[$var]}" == "required" ]]; then
                required_missing+=("$var")
            else
                optional_missing+=("$var")
            fi
            continue
        fi

        # 获取变量值（去除首尾空格和引号）
        value=$(grep "^$var=" "$env_file" | cut -d '=' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        # 对于必要变量，检查值是否为空
        if [[ "${env_var_types[$var]}" == "required" && -z "$value" ]]; then
            empty_required+=("$var")
        fi
    done

    # 处理必要变量缺失情况
    if [ ${#required_missing[@]} -ne 0 ]; then
        error "❌ 以下必要环境变量未定义，请添加："
        for var in "${required_missing[@]}"; do
            echo "   - $var"
        done
        
        read -p "是否要继续部署？(y/n) " continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            log "部署已取消"
            return 1
        fi
    fi

    # 处理必要变量为空情况
    if [ ${#empty_required[@]} -ne 0 ]; then
        error "❌ 以下必要环境变量为空，请设置值："
        for var in "${empty_required[@]}"; do
            echo "   - $var"
        done
        
        read -p "是否要继续部署？(y/n) " continue_deploy
        if [[ ! "$continue_deploy" =~ ^[Yy]$ ]]; then
            log "部署已取消"
            return 1
        fi
    fi

    # 处理可选变量缺失情况
    if [ ${#optional_missing[@]} -ne 0 ]; then
        warning "⚠️ 以下可选环境变量未定义，可能影响部分功能："
        for var in "${optional_missing[@]}"; do
            echo "   - $var"
        done
    fi

    success "✅ 环境变量检查完成"
    return 0
}

# 部署服务前的最终检查
pre_deployment_checks() {
    log "🚦 开始部署前检查..."

    # 检查 Docker 和 Docker Compose 版本
    docker version > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        error "❌ Docker 未正确安装或运行"
        return 1
    fi

    docker-compose version > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        error "❌ Docker Compose 未正确安装"
        return 1
    fi

    # 检查环境变量
    check_env_file
    if [ $? -ne 0 ]; then
        error "❌ 环境变量检查未通过，无法继续部署"
        return 1
    fi

    # 检查必要的配置文件
    local required_files=(
        "docker-compose.prod.yml"
        "Dockerfile"
        ".env.production"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "❌ 缺少必要的配置文件: $file"
            return 1
        fi
    done

    success "✅ 所有部署前检查已通过"
    return 0
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
    
    # 8. 启动服务并监控健康状态
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
            check_services_status
            
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

# 循环检查每个服务的状态
check_services_status() {
    log "检查服务状态..."
    
    # 获取每个服务的状态
    frontend_status=$(docker-compose -f docker-compose.prod.yml ps frontend | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
    payment_status=$(docker-compose -f docker-compose.prod.yml ps payment | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
    nginx_status=$(docker-compose -f docker-compose.prod.yml ps nginx | grep -o "healthy\|unhealthy\|starting" || echo "unknown")
    
    # 检查 npm 漏洞并修复
    if docker-compose -f docker-compose.prod.yml exec payment npm audit | grep -q "severity"; then
        warning "检测到 npm 安全漏洞，正在修复..."
        if docker-compose -f docker-compose.prod.yml exec payment npm audit fix; then
            success "npm 安全漏洞修复完成"
        else
            error "npm 安全漏洞修复失败"
        fi
    fi
    
    # 检查 SSL 证书
    if [ ! -f "/etc/nginx/ssl/fullchain.pem" ] || [ ! -f "/etc/nginx/ssl/privkey.pem" ]; then
        warning "SSL证书文件不存在，正在尝试重新生成..."
        manage_ssl_certificates
    fi
    
    # 如果所有服务都健康，返回成功
    if [[ "$frontend_status" == "healthy" ]] && 
       [[ "$payment_status" == "healthy" ]] && 
       [[ "$nginx_status" == "healthy" ]]; then
        success "所有服务健康状态正常"
        return 0
    fi
    
    # 输出当前状态
    log "服务状态: Frontend: $frontend_status | Payment: $payment_status | Nginx: $nginx_status"
    
    return 1
}

# 修改后的健康检查逻辑
check_health() {
    local max_attempts=5
    local attempt=1
    local wait_time=30
    
    log "开始健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        log "第 ${attempt}/${max_attempts} 次检查"
        
        if check_services_status; then
            success "所有服务已成功启动并通过健康检查"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            log "等待 ${wait_time} 秒后重试..."
            sleep $wait_time
        fi
        
        ((attempt++))
    done
    
    error "健康检查失败，已达到最大重试次数"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    return 1
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

# 生产环境部署函数
deploy_prod() {
    local log_file="${LOG_DIR}/deploy_prod_$(date +"%Y%m%d_%H%M%S").log"
    
    echo "🚀 开始生产环境部署..."
    echo "📅 部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 检查必要的环境变量和配置文件
    if [ ! -f ".env.production" ]; then
        echo "❌ 错误：未找到 .env.production 文件"
        return 1
    fi
    
    # 备份当前的 docker-compose 文件
    cp docker-compose.prod.yml docker-compose.prod.yml.bak
    
    # 执行生产环境部署
    docker-compose -f docker-compose.prod.yml up -d --build | tee "$log_file"
    
    local deploy_status=${PIPESTATUS[0]}
    
    if [ $deploy_status -eq 0 ]; then
        echo "✅ 生产环境部署成功！"
        echo "📄 详细日志: $log_file"
    else
        echo "❌ 生产环境部署失败！"
        echo "📄 错误日志: $log_file"
        
        # 尝试回滚
        echo "🔄 正在尝试回滚..."
        docker-compose -f docker-compose.prod.yml down
        
        return 1
    fi
}

# 管理 SSL 证书
manage_ssl_certificates() {
    log "检查和管理 SSL 证书..."
    
    local SSL_DIR="/etc/nginx/ssl"
    local DOMAIN="love.saga4v.com"
    
    # 检查 SSL 目录
    if [ ! -d "$SSL_DIR" ]; then
        log "创建 SSL 证书目录..."
        if ! sudo mkdir -p "$SSL_DIR"; then
            error "创建 SSL 目录失败"
            return 1
        fi
    fi
    
    # 检查证书文件
    if [ ! -f "$SSL_DIR/$DOMAIN.crt" ] || [ ! -f "$SSL_DIR/$DOMAIN.key" ]; then
        log "SSL 证书不存在，开始申请..."
        
        # 检查 certbot 是否安装
        if ! command -v certbot &> /dev/null; then
            log "安装 certbot..."
            # 针对 AWS Linux 2 的安装方式
            if grep -q "Amazon Linux" /etc/os-release; then
                log "检测到 AWS Linux，使用 EPEL 仓库安装 certbot..."
                sudo yum install -y epel-release
                sudo yum install -y certbot python3-certbot-nginx
            elif [ -f /etc/debian_version ]; then
                sudo apt-get update
                sudo apt-get install -y certbot
            elif [ -f /etc/redhat-release ]; then
                sudo yum install -y certbot
            else
                error "不支持的操作系统，请手动安装 certbot"
                return 1
            fi
        fi
        
        # 申请证书
        log "使用 certbot 申请证书..."
        if ! sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@saga4v.com; then
            error "证书申请失败"
            return 1
        fi
        
        # 复制证书到 nginx ssl 目录
        log "复制证书到 Nginx 目录..."
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/$DOMAIN.crt
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/$DOMAIN.key
        
        # 设置权限
        sudo chown -R root:root $SSL_DIR
        sudo chmod 600 $SSL_DIR/$DOMAIN.key
        sudo chmod 644 $SSL_DIR/$DOMAIN.crt
    else
        log "SSL 证书已存在，检查有效期..."
        
        # 检查证书有效期
        local expiry_date=$(openssl x509 -enddate -noout -in "$SSL_DIR/$DOMAIN.crt" | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        if [ $days_left -lt 30 ]; then
            warning "SSL 证书将在 $days_left 天后过期，尝试续期..."
            if ! sudo certbot renew --quiet; then
                error "证书续期失败"
                return 1
            fi
            success "证书续期成功"
        else
            success "SSL 证书有效期充足，还有 $days_left 天"
        fi
    fi
    
    success "SSL 证书管理完成"
    return 0
}

# 更新 nginx 配置
update_nginx_config() {
    log "更新 nginx 配置..."
    
    local NGINX_CONF="/etc/nginx/nginx.conf"
    local DOMAIN="love.saga4v.com"
    local TEMP_CONF="/tmp/nginx.conf.tmp"
    
    # 备份原配置
    log "备份当前 nginx 配置..."
    sudo cp $NGINX_CONF "${NGINX_CONF}.backup"
    
    # 读取原配置文件并更新指定域名的服务器块
    log "查找并更新 $DOMAIN 的配置..."
    awk -v domain="$DOMAIN" '
    BEGIN { found = 0 }
    {
        # 如果找到目标服务器块的开始
        if ($0 ~ "server_name[[:space:]]+" domain ";") {
            found = 1
            # 输出新的服务器配置
            print "\t# love 服务器配置"
            print "\tserver {"
            print "\t\tlisten 80;"
            print "\t\tlisten 443 ssl;"
            print "\t\tserver_name " domain ";"
            print ""
            print "\t\tssl_certificate /etc/nginx/ssl/" domain ".crt;"
            print "\t\tssl_certificate_key /etc/nginx/ssl/" domain ".key;"
            print "\t\tssl_protocols TLSv1.2 TLSv1.3;"
            print "\t\tssl_ciphers HIGH:!aNULL:!MD5;"
            print ""
            print "\t\taccess_log /var/log/nginx/love.access.log;"
            print "\t\terror_log /var/log/nginx/love.error.log debug;"
            print ""
            print "\t\tlocation / {"
            print "\t\t\tproxy_pass http://127.0.0.1:4173;"
            print "\t\t\tproxy_http_version 1.1;"
            print "\t\t\tproxy_set_header Upgrade $http_upgrade;"
            print "\t\t\tproxy_set_header Connection '\''upgrade'\'';"
            print "\t\t\tproxy_set_header Host $host;"
            print "\t\t\tproxy_set_header X-Real-IP $remote_addr;"
            print "\t\t\tproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "\t\t\tproxy_set_header X-Forwarded-Proto $scheme;"
            print "\t\t\tproxy_cache_bypass $http_upgrade;"
            print "\t\t\tadd_header X-Debug-Message \"Proxying to 4173\" always;"
            print "\t\t}"
            print ""
            print "\t\tlocation /api {"
            print "\t\t\tproxy_pass http://127.0.0.1:4242;"
            print "\t\t\tproxy_http_version 1.1;"
            print "\t\t\tproxy_set_header Upgrade $http_upgrade;"
            print "\t\t\tproxy_set_header Connection '\''upgrade'\'';"
            print "\t\t\tproxy_set_header Host $host;"
            print "\t\t\tproxy_set_header X-Real-IP $remote_addr;"
            print "\t\t\tproxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
            print "\t\t\tproxy_set_header X-Forwarded-Proto $scheme;"
            print "\t\t\tproxy_cache_bypass $http_upgrade;"
            print "\t\t\tadd_header X-Debug-Message \"Proxying to 4242\" always;"
            print "\t\t}"
            print "\t}"
            print ""
            
            # 跳过原有的服务器块
            while (getline && $0 !~ /^[[:space:]]*}[[:space:]]*$/) { }
            next
        }
        # 输出所有其他行
        print $0
    }' $NGINX_CONF > $TEMP_CONF
    
    # 检查临时配置文件是否创建成功
    if [ ! -f $TEMP_CONF ]; then
        error "配置文件更新失败"
        return 1
    fi
    
    # 应用新配置
    sudo mv $TEMP_CONF $NGINX_CONF
    
    # 测试配置
    log "测试 nginx 配置..."
    if ! sudo nginx -t; then
        error "nginx 配置测试失败，正在还原备份..."
        sudo mv "${NGINX_CONF}.backup" $NGINX_CONF
        return 1
    fi
    
    success "nginx 配置更新完成"
    return 0
}

# 设置支付服务器
setup_payment_server() {
    log "正在设置支付服务器..."
    
    # 1. 创建目录
    if [ ! -d "payment-server" ]; then
        mkdir -p payment-server
        success "创建 payment-server 目录成功"
    else
        log "payment-server 目录已存在"
    fi

    # 2. 创建 Dockerfile
    log "创建支付服务器 Dockerfile..."
    cat > payment-server/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装必要的工具
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=4242
ENV HOST=0.0.0.0

EXPOSE 4242

# 添加健康检查脚本
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /healthcheck.sh

CMD ["node", "index.js"]
EOF

    # 3. 创建健康检查脚本
    log "创建健康检查脚本..."
    cat > payment-server/healthcheck.sh << 'EOF'
#!/bin/sh
if curl -f http://localhost:4242/health; then
    echo "健康检查成功"
    exit 0
else
    echo "健康检查失败"
    exit 1
fi
EOF
    chmod +x payment-server/healthcheck.sh

    # 4. 创建 index.js
    log "创建支付服务器 index.js..."
    cat > payment-server/index.js << 'EOF'
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;

// CORS 配置
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:4242',
    'https://love.saga4v.com',
    'http://payment:4242'
];

app.use(cors({
    origin: function(origin, callback) {
        console.log('请求来源:', origin);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('不允许的来源'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Origin']
}));

app.use(express.json());

// 健康检查路由
app.get('/health', (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            path: req.path,
            stripe: {
                configured: !!process.env.STRIPE_SECRET_KEY,
                mode: process.env.VITE_STRIPE_MODE
            },
            server: {
                port: process.env.PORT,
                env: process.env.NODE_ENV
            }
        };
        console.log('健康状态:', healthStatus);
        res.status(200).json(healthStatus);
    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log(`Stripe 服务器运行在 http://0.0.0.0:${port}`);
});
EOF

    # 5. 创建 package.json
    log "创建支付服务器 package.json..."
    cat > payment-server/package.json << 'EOF'
{
  "name": "payment-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "stripe": "^14.10.0"
  }
}
EOF

    # 6. 安装依赖
    log "安装支付服务器依赖..."
    cd payment-server
    if npm install; then
        success "支付服务器依赖安装完成"
    else
        error "支付服务器依赖安装失败"
        cd ..
        return 1
    fi
    cd ..

    success "支付服务器设置完成"
}

# 更新主函数
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
    
    # 4. 设置支付服务器
    setup_payment_server
    
    # 5. 管理 SSL 证书
    if ! manage_ssl_certificates; then
        error "SSL 证书管理失败"
        exit 1
    fi
    
    # 6. 部署服务
    cleanup
    pre_deployment_checks
    deploy_services
    check_health
    show_status
}

# 执行主函数
case "$1" in
    deploy_prod)
        deploy_prod
        ;;
    *)
        main
        ;;
esac