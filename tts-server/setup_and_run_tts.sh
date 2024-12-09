#!/bin/bash

echo "正在创建并设置TTS服务器环境..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "Python未安装，请先安装Python！"
    exit 1
fi

# 创建虚拟环境
if [ ! -d "tts_venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv tts_venv
else
    echo "虚拟环境已存在"
fi

# 激活虚拟环境
source tts_venv/bin/activate

# 安装依赖
echo "安装必要的依赖..."
pip install TTS
pip install flask
pip install flask-cors

# 运行服务器
echo "启动TTS服务器..."
python tts_server.py 