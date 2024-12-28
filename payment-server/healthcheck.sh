#!/bin/sh
if curl -f http://localhost:4242/health; then
    echo "健康检查成功"
    exit 0
else
    echo "健康检查失败"
    exit 1
fi 