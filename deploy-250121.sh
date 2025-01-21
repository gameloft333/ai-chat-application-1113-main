#!/bin/bash

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署..."

# 确保 app_network 网络存在
if ! docker network ls | grep -q app_network; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 创建 app_network 网络..."
    docker network create app_network
fi

# 构建并启动主服务
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始构建服务..."
docker-compose build

if [ $? -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 成功: 服务构建成功"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始启动服务..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 成功: 服务启动成功"
        
        # 启动 Nginx 服务
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始启动 Nginx 服务..."
        docker-compose -f docker-compose.nginx.yml up -d
        
        if [ $? -eq 0 ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 成功: Nginx 服务启动成功"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成!"
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: Nginx 服务启动失败"
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: 服务启动失败"
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 错误: 服务构建失败"
fi 