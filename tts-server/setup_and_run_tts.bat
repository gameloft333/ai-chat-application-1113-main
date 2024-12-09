@echo off
echo 正在创建并设置TTS服务器环境...

REM 检查Python是否安装
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Python未安装，请先安装Python！
    pause
    exit /b
)

REM 创建虚拟环境
if not exist "tts_venv" (
    echo 创建虚拟环境...
    python -m venv tts_venv
) else (
    echo 虚拟环境已存在
)

REM 激活虚拟环境
call tts_venv\Scripts\activate

REM 安装依赖
echo 安装必要的依赖...
pip install TTS
pip install flask
pip install flask-cors

REM 运行服务器
echo 启动TTS服务器...
python tts_server.py

pause 