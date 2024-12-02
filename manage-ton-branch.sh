#!/bin/bash

# 设置错误时退出
set -e

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 分支名称
FEATURE_BRANCH="feature/ton-payment"

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

# 创建新分支
create_branch() {
    log "正在更新 main 分支..."
    git checkout main
    git pull origin main
    
    log "创建新分支: ${FEATURE_BRANCH}..."
    git checkout -b ${FEATURE_BRANCH}
    success "分支创建成功！"
    
    echo -e "\n当前分支状态："
    git status
}

# 提交代码
commit_changes() {
    log "检查代码变更..."
    git status
    
    read -p "是否提交所有变更? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        log "提交代码变更..."
        git add .
        read -p "请输入提交信息: " commit_message
        git commit -m "feat: ${commit_message}"
        git push origin ${FEATURE_BRANCH}
        success "代码提交成功！"
    fi
}

# 合并到主分支
merge_to_main() {
    log "准备合并到 main 分支..."
    
    # 确认是否要合并
    read -p "确认要合并到 main 分支吗? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        # 切换到 main 并更新
        git checkout main
        git pull origin main
        
        # 合并功能分支
        log "合并 ${FEATURE_BRANCH} 到 main..."
        git merge ${FEATURE_BRANCH}
        
        # 推送到远程
        git push origin main
        success "合并完成！"
        
        # 询问是否删除功能分支
        read -p "是否删除功能分支? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]
        then
            log "删除功能分支..."
            git branch -d ${FEATURE_BRANCH}
            git push origin --delete ${FEATURE_BRANCH}
            success "功能分支已删除！"
        fi
    fi
}

# 更新分支
update_branch() {
    log "更新分支..."
    git fetch origin
    git rebase origin/main
    success "分支已更新！"
}

# 显示菜单
show_menu() {
    echo -e "\n=== TON 支付模块分支管理 ==="
    echo "1) 创建新的功能分支"
    echo "2) 提交代码变更"
    echo "3) 合并到主分支"
    echo "4) 更新当前分支"
    echo "5) 退出"
    echo "=========================="
}

# 主程序
main() {
    while true; do
        show_menu
        read -p "请选择操作 (1-5): " choice
        case $choice in
            1) create_branch ;;
            2) commit_changes ;;
            3) merge_to_main ;;
            4) update_branch ;;
            5) exit 0 ;;
            *) error "无效的选择" ;;
        esac
    done
}

# 执行主程序
main 