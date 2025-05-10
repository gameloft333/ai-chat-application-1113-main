#!/bin/bash

set -e

# 颜色输出函数
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
  red "[错误] 未检测到 docker-compose，请先安装 docker-compose。"
  exit 1
fi

# 检查 .env.production 是否存在
if [ ! -f .env.production ]; then
  red "[错误] 未找到 .env.production 文件，请先配置生产环境变量。"
  exit 1
fi

# 检查主 compose 文件是否存在
if [ ! -f docker-compose-20250507.yml ]; then
  red "[错误] 未找到 docker-compose-20250507.yml 文件。"
  exit 1
fi

# 检查 nginx compose 文件是否存在
if [ ! -f nginx_global_config/docker-compose.nginx-global_v06.yml ]; then
  red "[错误] 未找到 nginx_global_config/docker-compose.nginx-global_v06.yml 文件。"
  exit 1
fi

green "[预处理-步骤A] 清理 Nginx 日志文件..."
NGINX_LOG_DIR="./nginx_global_config/logs"

if [ -d "$NGINX_LOG_DIR" ]; then
    yellow "删除 $NGINX_LOG_DIR 目录下超过7天的旧日志文件..."
    # -mtime +6 means files last modified more than 6*24 hours ago (i.e., 7 days or older)
    find "$NGINX_LOG_DIR" -type f -mtime +6 -print -delete || yellow "[警告] 删除旧日志文件时出错，请检查权限或文件是否存在。"

    # Define known current log files that can grow very large
    # These will be truncated to free up space, even if modified recently
    KNOWN_CURRENT_LOGS_TO_TRUNCATE=(
        "${NGINX_LOG_DIR}/access.log"
        "${NGINX_LOG_DIR}/error.log"
        "${NGINX_LOG_DIR}/payment-ssl-error.log"
        "${NGINX_LOG_DIR}/payment.error.log"
        "${NGINX_LOG_DIR}/ssl-error.log"
        "${NGINX_LOG_DIR}/play.access.log"
        "${NGINX_LOG_DIR}/play.error.log"
        "${NGINX_LOG_DIR}/kitty.error.log"
        "${NGINX_LOG_DIR}/kitty.access.log"
        "${NGINX_LOG_DIR}/payment.access.log"
    )

    yellow "截断当前主要的 Nginx 日志文件以释放空间..."
    for log_file in "${KNOWN_CURRENT_LOGS_TO_TRUNCATE[@]}"; do
        if [ -f "$log_file" ]; then
            yellow "截断 $log_file..."
            truncate -s 0 "$log_file" || yellow "[警告] 截断 $log_file 时出错，可能由于权限问题或文件不存在。"
        else
            yellow "当前日志文件 $log_file 未找到，跳过截断。"
        fi
    done
    green "Nginx 日志文件清理完成。"

    yellow "显示 nginx_global_config/ 目录的当前磁盘使用情况 (清理后):"
    if [ -d "./nginx_global_config/" ]; then
        du -ah ./nginx_global_config/ | sort -hr | head -n 20
    else
        yellow "[警告] ./nginx_global_config/ 目录未找到，无法显示磁盘使用情况。"
    fi
else
    yellow "[警告] Nginx 日志目录 $NGINX_LOG_DIR 未找到，跳过日志清理。"
fi

green "[预处理-步骤B] 进行可选的全局 Docker 资源清理 (仅针对未使用资源)..."

yellow "清理全局未使用的 Docker 构建缓存..."
# This removes build cache not associated with any specific image, which is generally safe and frees up space.
docker builder prune -af >/dev/null 2>&1 || true

yellow "移除全局未使用和悬空的 Docker 镜像..."
# This removes images that are not tagged and not used by any container.
# It should not affect running applications or images they are actively using.
docker image prune -af >/dev/null 2>&1 || true

# The docker-compose down -v in Step 1 will handle project-specific volumes and networks.
# So, global volume and network prune are not needed here and would increase risk.

green "可选的全局 Docker 资源清理完成。"
yellow "清理后的 Docker 系统状态 (显示总体 Docker 磁盘使用情况):"
docker system df

green "[步骤1] 停止并清理旧的主服务容器..."
docker-compose --env-file .env.production -f docker-compose-20250507.yml down -v || yellow "[警告] 主服务容器清理时出现警告，可忽略。"

green "[步骤2] 构建并启动主服务（前端/后端/支付）..."
docker-compose --env-file .env.production -f docker-compose-20250507.yml up -d --build

green "[步骤3] 启动/重启 Nginx 反向代理..."
docker-compose -f nginx_global_config/docker-compose.nginx-global_v06.yml up -d --build

green "[完成] 所有服务已启动。请访问 love.saga4v.com 进行 Web 测试。" 