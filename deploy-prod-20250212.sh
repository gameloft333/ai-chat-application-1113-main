#!/bin/bash

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] 警告: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        warning "$1 未安装，正在安装..."
        return 1
    else
        log "$1 已安装"
        return 0
    fi
}

# 环境检查
check_environment() {
    log "开始环境检查..."
    
    # 检查是否为 AWS Linux
    if [ -f /etc/system-release ]; then
        log "检测到 AWS Linux 环境"
    else
        warning "未检测到 AWS Linux 环境，可能会影响某些功能"
    fi

    # 检查必要的命令
    local commands=("git" "docker" "docker-compose" "curl")
    local missing_commands=()

    for cmd in "${commands[@]}"; do
        if ! check_command $cmd; then
            missing_commands+=($cmd)
        fi
    done

    # 安装缺失的命令
    if [ ${#missing_commands[@]} -ne 0 ]; then
        log "正在安装缺失的命令..."
        sudo yum update -y
        
        for cmd in "${missing_commands[@]}"; do
            case $cmd in
                "git")
                    sudo yum install -y git
                    ;;
                "docker")
                    sudo yum install -y docker
                    sudo service docker start
                    sudo usermod -a -G docker ec2-user
                    ;;
                "docker-compose")
                    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                    sudo chmod +x /usr/local/bin/docker-compose
                    ;;
                "curl")
                    sudo yum install -y curl
                    ;;
            esac
        done
    fi
}

# 拉取最新代码
pull_latest_code() {
    log "准备拉取最新代码..."
    
    read -p "请输入 GitHub 仓库地址: " repo_url
    read -p "请输入分支名称 [main]: " branch_name
    branch_name=${branch_name:-main}

    if [ -d "project" ]; then
        read -p "项目目录已存在，是否重新克隆？[y/N] " should_reclone
        if [[ "$should_reclone" =~ ^[Yy]$ ]]; then
            rm -rf project
            git clone -b $branch_name $repo_url project
        else
            cd project
            git pull origin $branch_name
            cd ..
        fi
    else
        git clone -b $branch_name $repo_url project
    fi
}

# 清理未使用的 Docker 资源
cleanup_docker() {
    log "清理未使用的 Docker 资源..."
    
    # 停止并删除未运行的容器
    docker container prune -f
    
    # 删除未使用的镜像
    docker image prune -f
    
    # 删除未使用的网络
    docker network prune -f
    
    # 删除未使用的卷
    docker volume prune -f
}

# 创建必要的网络
setup_network() {
    log "创建 Docker 网络..."
    docker network create saga4v_network || true
}

# 部署应用
deploy_application() {
    log "开始部署应用..."
    
    cd project
    
    # 检查环境文件
    if [ ! -f ".env.production" ]; then
        error "缺少 .env.production 文件"
        exit 1
    fi

    # 构建并启动服务
    log "构建并启动服务..."
    docker-compose -f docker-compose-20250212.yml build --no-cache
    docker-compose -f docker-compose-20250212.yml up -d

    # 检查服务状态
    log "检查服务状态..."
    sleep 30
    docker-compose -f docker-compose-20250212.yml ps
}

# 主函数
main() {
    log "开始部署流程..."
    
    # 检查环境
    check_environment || {
        error "环境检查失败"
        exit 1
    }
    
    # 清理 Docker 资源
    cleanup_docker
    
    # 拉取最新代码
    pull_latest_code || {
        error "代码拉取失败"
        exit 1
    }
    
    # 设置网络
    setup_network || {
        error "网络设置失败"
        exit 1
    }
    
    # 部署应用
    deploy_application || {
        error "应用部署失败"
        exit 1
    }
    
    log "部署完成！"
}

# 执行主函数
main