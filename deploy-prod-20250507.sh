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

green "[步骤1] 停止并清理旧的主服务容器..."
docker-compose --env-file .env.production -f docker-compose-20250507.yml down -v || yellow "[警告] 主服务容器清理时出现警告，可忽略。"

green "[步骤2] 构建并启动主服务（前端/后端/支付）..."
docker-compose --env-file .env.production -f docker-compose-20250507.yml up -d --build

green "[步骤3] 启动/重启 Nginx 反向代理..."
docker-compose -f nginx_global_config/docker-compose.nginx-global_v06.yml up -d --build

green "[完成] 所有服务已启动。请访问 love.saga4v.com 进行 Web 测试。" 