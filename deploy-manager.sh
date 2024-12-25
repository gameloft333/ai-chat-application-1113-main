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
    
    # 强制重新配置 Git 凭证
    log "更新 Git 配置..."
    git config --global credential.helper store
    
    while true; do
        # 检查并更新 token
        if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_USERNAME" ] || ! check_token_permissions; then
            show_token_guide
            
            # 提供多种输入方式
            echo "选择 Token 输入方式："
            echo "1) 直接输入"
            echo "2) 从文件读取"
            echo "3) 手动输入（逐字符）"
            read -p "请选择输入方式 (1-3): " input_method
            
            case $input_method in
                1)
                    read -p "请输入 GitHub 用户名: " github_username
                    read -s -p "请输入 GitHub Personal Access Token: " github_token
                    echo ""
                    ;;
                2)
                    read -p "请将 token 保存到文件并输入文件路径: " token_file
                    if [ -f "$token_file" ]; then
                        github_token=$(cat "$token_file")
                        read -p "请输入 GitHub 用户名: " github_username
                        # 清理临时文件
                        rm -f "$token_file"
                    else
                        error "文件不存在"
                        continue
                    fi
                    ;;
                3)
                    read -p "请输入 GitHub 用户名: " github_username
                    echo -n "请逐个字符输入 token (输入完成后按回车): "
                    github_token=""
                    while IFS= read -r -n1 char; do
                        if [ -z "$char" ]; then
                            break
                        fi
                        github_token="${github_token}${char}"
                        echo -n "*"
                    done
                    echo ""
                    ;;
                *)
                    error "无效的选择"
                    continue
                    ;;
            esac
            
            # 更新环境变量
            export GITHUB_USERNAME="${github_username}"
            export GITHUB_TOKEN="${github_token}"
            
            # 如果权限检查通过则跳出循环
            if check_token_permissions; then
                # 更新 .bashrc
                sed -i '/GITHUB_USERNAME/d' ~/.bashrc
                sed -i '/GITHUB_TOKEN/d' ~/.bashrc
                echo "export GITHUB_USERNAME='${github_username}'" >> ~/.bashrc
                echo "export GITHUB_TOKEN='${github_token}'" >> ~/.bashrc
                break
            fi
            
            error "Token 权限不足，请重新创建"
            continue
        else
            break
        fi
    done
    
    # 更新 git 凭证文件
    echo "https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
    
    success "Git 凭证已更新"
    
    # 更新代码
    log "从 GitHub 更新代码..."
    if git pull origin main; then
        success "代码更新成功"
    else
        error "代码更新失败"
        exit 1
    fi
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

# 构建和启动服务
deploy_services() {
    log "开始构建服务..."
    if ! docker-compose -f docker-compose.prod.yml build --no-cache; then
        error "服务构建失败"
        exit 1
    fi
    success "服务构建成功"
    
    log "开始启动服务..."
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if docker-compose --env-file .env.production -f docker-compose.prod.yml up -d; then
            log "等待服务启动（30秒）..."
            sleep 30
            
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
    
    if curl -s -f http://localhost:4173 > /dev/null; then
        success "前端服务运行正常"
    else
        error "前端服务未正常运行"
    fi
    
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

# 检查 GitHub Token 权限
check_token_permissions() {
    log "检查 GitHub Token 权限..."
    
    # 使用 GitHub API 检查 token 权限
    local token_check=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
                            -H "Accept: application/vnd.github.v3+json" \
                            https://api.github.com/user)
    
    if echo "$token_check" | grep -q "Bad credentials"; then
        error "Token 无效或已过期"
        show_token_guide
        return 1
    fi
    
    # 检查仓库访问权限
    local repo_check=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
                           -H "Accept: application/vnd.github.v3+json" \
                           "https://api.github.com/repos/${GITHUB_USERNAME}/${PROJECT_NAME}")
    
    if echo "$repo_check" | grep -q "Not Found"; then
        error "Token 没有仓库访问权限"
        show_token_guide
        return 1
    fi
    
    success "Token 权限验证通过"
    return 0
}

show_token_guide() {
    echo "
请按以下步骤创建正确的 GitHub Token：

1. 访问 GitHub.com
2. 点击右上角头像 -> Settings
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