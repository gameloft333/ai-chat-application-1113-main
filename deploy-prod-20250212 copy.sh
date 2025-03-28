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

    # 先获取远程更新信息
    log "获取远程仓库更新..."
    if ! git fetch origin $BRANCH_NAME; then
        error "获取远程更新失败"
        exit 1
    fi

    # 检查本地是否有未提交的更改
    local has_local_changes=$(git status --porcelain)
    # 检查是否有可更新的远程更改
    local has_remote_changes=$(git rev-list HEAD...origin/$BRANCH_NAME --count)

    if [ "$has_remote_changes" -gt 0 ]; then
        warning "检测到远程仓库有新的更新"
        git --no-pager diff --stat HEAD...origin/$BRANCH_NAME
        
        if [ -n "$has_local_changes" ]; then
            warning "同时检测到本地有未提交的更改:"
            git status --short
            
            echo -e "\n请选择操作："
            echo "1) 使用远程版本覆盖本地更改"
            echo "2) 保留本地更改继续部署"
            echo "3) 取消部署"
            
            read -p "请输入选项 [1-3]: " choice
            
            case $choice in
                1)
                    log "准备使用远程版本覆盖本地更改..."
                    # 保存本地更改到临时区域
                    local timestamp=$(date +%Y%m%d_%H%M%S)
                    local backup_branch="backup_${timestamp}"
                    git branch $backup_branch
                    log "已创建备份分支: $backup_branch"
                    
                    # 强制更新到远程版本
                    if ! git reset --hard origin/$BRANCH_NAME; then
                        error "重置到远程版本失败"
                        exit 1
                    fi
                    log "成功更新到远程版本"
                    ;;
                2)
                    warning "将使用本地版本继续部署"
                    warning "请注意：本地版本可能与远程版本不一致，建议部署后及时同步代码"
                    return 0
                    ;;
                3)
                    error "操作已取消"
                    exit 1
                    ;;
                *)
                    error "无效的选项"
                    exit 1
                    ;;
            esac
        else
            # 没有本地更改，询问是否更新
            read -p "是否更新到远程版本？[Y/n] " update_choice
            if [[ "$update_choice" =~ ^[Nn]$ ]]; then
                warning "跳过更新，使用当前版本继续部署"
                return 0
            else
                if ! git pull origin $BRANCH_NAME; then
                    error "更新失败"
                    exit 1
                fi
                log "成功更新到远程版本"
            fi
        fi
    else
        log "本地代码已经是最新版本"
        if [ -n "$has_local_changes" ]; then
            warning "检测到本地有未提交的更改:"
            git status --short
            warning "将使用当前本地版本继续部署"
            warning "请注意：建议部署后及时提交本地更改"
        fi
    fi
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
    log "检查 Docker 网络配置..."
    
    # 先检查网络是否存在
    if docker network inspect saga4v_network >/dev/null 2>&1; then
        log "saga4v_network 网络已存在，跳过创建"
    else
        log "创建 saga4v_network 网络..."
        if docker network create saga4v_network; then
            log "saga4v_network 网络创建成功"
        else
            error "saga4v_network 网络创建失败"
            return 1
        fi
    fi
    
    # 验证网络状态
    log "验证网络配置..."
    docker network inspect saga4v_network --format "{{.Name}} 网络状态: {{.Driver}}" || {
        error "网络验证失败"
        return 1
    }
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