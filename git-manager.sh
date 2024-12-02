#!/bin/bash

# 设置错误时退出
set -e

# 设置字符编码
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 版本信息
VERSION="1.0.0"

# 输出带时间戳的日志
log() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 错误: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] 成功: $1${NC}"
}

# 检查Git环境
check_git() {
    if ! command -v git &> /dev/null; then
        error "Git 未安装"
        exit 1
    fi

    if [ ! -d ".git" ]; then
        error "当前目录不是 Git 仓库"
        exit 1
    fi
}

# 获取当前分支
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# 生成默认提交信息
generate_commit_message() {
    local status_output=$(git status --porcelain)
    local default_msg=""
    
    while IFS= read -r line; do
        local status=${line:0:1}
        local file=${line:3}
        case "$status" in
            "M") 
                if [ -z "$default_msg" ]; then
                    default_msg="update: $file"
                else
                    default_msg="$default_msg, $file"
                fi
                ;;
            "A")
                if [ -z "$default_msg" ]; then
                    default_msg="add: $file"
                else
                    default_msg="$default_msg, $file"
                fi
                ;;
            "D")
                if [ -z "$default_msg" ]; then
                    default_msg="remove: $file"
                else
                    default_msg="$default_msg, $file"
                fi
                ;;
        esac
    done <<< "$status_output"
    
    echo "$default_msg"
}

# 提交代码
commit_changes() {
    local branch=$1
    local default_msg=$(generate_commit_message)
    
    log "正在更新分支 $branch..."
    git pull origin $branch
    
    log "添加变更文件..."
    git add .
    
    log "默认提交信息: $default_msg"
    read -p "请输入提交信息 (直接回车使用默认信息): " commit_msg
    commit_msg=${commit_msg:-$default_msg}
    
    log "提交代码..."
    git commit -m "$commit_msg"
    
    log "推送到远程..."
    if ! git push origin $branch; then
        log "推送失败，5秒后重试..."
        sleep 5
        git push origin $branch
    fi
    
    success "代码已提交到 $branch"
}

# 创建新分支
create_branch() {
    read -p "请输入新分支名称: " new_branch
    if [ -z "$new_branch" ]; then
        error "分支名称不能为空"
        return 1
    fi
    
    log "创建新分支: $new_branch"
    git checkout -b $new_branch
    success "分支创建成功"
}

# 显示菜单
show_menu() {
    echo -e "\n=== Git 代码管理工具 v$VERSION ==="
    echo "当前分支: $(get_current_branch)"
    echo "1) 提交到当前分支"
    echo "2) 创建并提交到新分支"
    echo "3) 切换分支"
    echo "4) 合并到主分支"
    echo "5) 退出"
    echo "=========================="
}

# 主程序
main() {
    check_git
    
    while true; do
        show_menu
        read -p "请选择操作 (1-5): " choice
        case $choice in
            1)
                commit_changes $(get_current_branch)
                ;;
            2)
                create_branch && commit_changes $(get_current_branch)
                ;;
            3)
                git branch
                read -p "请输入要切换的分支名称: " branch
                git checkout $branch
                ;;
            4)
                current_branch=$(get_current_branch)
                if [ "$current_branch" = "main" ]; then
                    error "当前已经在 main 分支"
                    continue
                fi
                read -p "确认要合并到 main 分支吗? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    git checkout main
                    git pull origin main
                    git merge $current_branch
                    git push origin main
                    success "合并完成"
                fi
                ;;
            5)
                exit 0
                ;;
            *)
                error "无效的选择"
                ;;
        esac
    done
}

# 执行主程序
main 