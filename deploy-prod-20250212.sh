#!/bin/bash

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 定义常量
REPO_URL="https://github.com/gameloft333/ai-chat-application-1113-main.git"
BRANCH_NAME="main"

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
    
    # 检查是否在git仓库中
    if [ ! -d ".git" ]; then
        error "当前目录不是git仓库"
        exit 1
    fi

    # 获取当前分支
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    log "当前分支: $current_branch"

    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        warning "存在未提交的更改"
        read -p "是否继续拉取最新代码？[y/N] " should_continue
        if [[ ! "$should_continue" =~ ^[Yy]$ ]]; then
            error "操作已取消"
            exit 1
        fi
    fi

    # 拉取最新代码
    log "从 $REPO_URL 拉取最新代码..."
    if ! git pull origin $BRANCH_NAME; then
        error "代码拉取失败"
        exit 1
    fi
    
    log "代码更新成功"
}

# 清理当前项目的 Docker 资源
cleanup_docker() {
    log "清理当前项目的 Docker 资源..."
    
    # 获取当前项目的容器ID
    local project_containers=$(docker-compose -f docker-compose-20250212.yml ps -q)
    
    if [ -n "$project_containers" ]; then
        log "发现当前项目的运行容器，准备清理..."
        
        # 停止当前项目的容器
        log "停止当前项目的容器..."
        docker-compose -f docker-compose-20250212.yml down || {
            error "停止容器失败"
            return 1
        }
        
        # 删除当前项目的容器和镜像
        log "删除当前项目的容器和镜像..."
        docker-compose -f docker-compose-20250212.yml rm -f || {
            warning "删除容器失败，继续执行..."
        }
        
        # 删除当前项目的镜像
        local project_images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "ai-chat")
        if [ -n "$project_images" ]; then
            log "删除当前项目的镜像..."
            echo "$project_images" | xargs -r docker rmi -f || {
                warning "删除镜像失败，继续执行..."
            }
        fi
        
        log "清理完成"
    else
        log "未发现当前项目的运行容器，跳过清理步骤"
    fi
}

# 创建必要的网络
setup_network() {
    log "创建 Docker 网络..."
    docker network create saga4v_network || true
}

# 生成部署报告
generate_deployment_report() {
    log "正在生成部署报告..."
    
    echo -e "\n${GREEN}========== 部署报告 ==========${NC}"
    echo -e "${GREEN}部署时间: $(date +'%Y-%m-%d %H:%M:%S')${NC}"
    
    # 检查容器状态
    echo -e "\n${YELLOW}容器状态:${NC}"
    docker-compose -f docker-compose-20250212.yml ps
    
    # 显示资源使用情况
    echo -e "\n${YELLOW}资源使用情况:${NC}"
    echo "磁盘使用率:"
    df -h / | grep -v "Filesystem"
    
    echo -e "\nDocker资源使用情况:"
    docker system df
    
    # 显示容器日志（最后10行）
    echo -e "\n${YELLOW}容器最新日志:${NC}"
    for container in $(docker-compose -f docker-compose-20250212.yml ps -q); do
        container_name=$(docker inspect --format '{{.Name}}' $container | sed 's/\///')
        echo -e "\n${GREEN}$container_name 的最新日志:${NC}"
        docker logs --tail 10 $container
    done
    
    # 检查服务健康状态
    echo -e "\n${YELLOW}服务健康状态:${NC}"
    for container in $(docker-compose -f docker-compose-20250212.yml ps -q); do
        container_name=$(docker inspect --format '{{.Name}}' $container | sed 's/\///')
        health_status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "未配置健康检查")
        echo "$container_name: $health_status"
    done
    
    echo -e "\n${GREEN}========== 报告结束 ==========${NC}"
}

# 修改部署应用函数
deploy_application() {
    log "开始部署应用..."
    
    # 检查环境文件
    if [ ! -f ".env.production" ]; then
        error "缺少 .env.production 文件"
        exit 1
    fi
    
    # 构建并启动服务
    log "构建并启动服务..."
    docker-compose -f docker-compose-20250212.yml build --no-cache
    docker-compose -f docker-compose-20250212.yml up -d
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 30
    
    # 生成部署报告
    generate_deployment_report
}

# 系统资源清理函数
cleanup_system_resources() {
    log "开始清理系统资源..."
    
    # 检查系统磁盘使用情况
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local docker_usage=$(docker system df | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # 如果磁盘使用率超过80%或Docker使用率超过70%，执行清理
    if [ "$disk_usage" -gt 80 ] || [ "$docker_usage" -gt 70 ]; then
        warning "系统资源使用率较高，开始清理..."
        
        # 提示用户确认
        read -p "是否清理系统资源？这将删除所有未使用的Docker资源 [y/N] " should_cleanup
        if [[ "$should_cleanup" =~ ^[Yy]$ ]]; then
            log "清理未使用的容器..."
            docker container prune -f
            
            log "清理未使用的镜像..."
            docker image prune -f
            
            log "清理未使用的网络..."
            docker network prune -f
            
            log "清理未使用的卷..."
            docker volume prune -f
            
            log "系统资源清理完成"
        else
            warning "跳过系统资源清理"
        fi
    else
        log "系统资源使用正常，无需清理"
    fi
}

# 主函数
main() {
    log "开始部署流程..."
    
    # 检查环境
    check_environment || {
        error "环境检查失败"
        exit 1
    }
    
    # 清理当前项目的 Docker 资源
    cleanup_docker || {
        error "清理当前项目资源失败"
        exit 1
    }
    
    # 检查并清理系统资源（在部署新版本之前）
    cleanup_system_resources
    
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
        generate_deployment_report  # 即使失败也生成报告
        exit 1
    }
    
    log "部署完成！"
    
    # 最后再次生成完整报告
    sleep 10  # 等待服务完全稳定
    generate_deployment_report
}

# 执行主函数
main