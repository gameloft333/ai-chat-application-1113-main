@echo off
REM 设置控制台代码页为 UTF-8
chcp 65001
cls

echo [32m正在创建并设置TTS服务器环境...[0m

REM 检查Python是否安装
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [31mPython未安装，请先安装Python！[0m
    pause
    exit /b
)

REM 创建虚拟环境
if not exist "tts_venv" (
    echo [32m创建虚拟环境...[0m
    python -m venv tts_venv
) else (
    echo [33m虚拟环境已存在[0m
)

REM 激活虚拟环境
echo [32m激活虚拟环境...[0m
call tts_venv\Scripts\activate

REM 安装依赖
echo [32m安装必要的依赖...[0m
python -m pip install --upgrade pip
pip install TTS
pip install flask
pip install flask-cors

REM 运行服务器
echo [32m启动TTS服务器...[0m
python tts_server.py

pause 