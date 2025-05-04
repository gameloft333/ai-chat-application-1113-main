@echo off
REM 设置代码页为 UTF-8
chcp 65001 >nul
REM 设置控制台字体为 Consolas
reg add "HKEY_CURRENT_USER\Console" /v "FaceName" /t REG_SZ /d "Consolas" /f >nul 2>&1
REM 设置控制台字体大小为 16
reg add "HKEY_CURRENT_USER\Console" /v "FontSize" /t REG_DWORD /d 0x00100000 /f >nul 2>&1
REM 设置控制台字体粗细为 400
reg add "HKEY_CURRENT_USER\Console" /v "FontWeight" /t REG_DWORD /d 400 /f >nul 2>&1

setlocal enabledelayedexpansion

REM 设置控制台标题
title Development Environment Setup Tool

REM 检查管理员权限
openfiles >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] Please run this script as Administrator!
    pause
    exit /b 1
)

REM 检查系统版本
ver | findstr /i "10\.0\." >nul
if %errorlevel% NEQ 0 (
    echo [WARNING] Current system may not be Windows 10/11
    echo [WARNING] Some features may not work properly
    set /p "continue=Continue? (Y/N): "
    if /i not "!continue!"=="Y" exit /b 1
)

REM 设置临时下载目录
set "TMPDIR=%TEMP%\dev-env-setup"
if not exist "%TMPDIR%" mkdir "%TMPDIR%"

REM 定义最新版本号
set "LATEST_GIT_VERSION=2.44.0"
set "LATEST_NODE_VERSION=20.11.1"
set "LATEST_PYTHON_VERSION=3.11.8"

REM 检查并安装 Git
where git >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [*] Git is not installed, preparing to install...
    set /p "install_git=Install Git? (Y/N): "
    if /i "!install_git!"=="Y" (
        echo [*] Installing Git...
        powershell -Command "Invoke-WebRequest -Uri https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe -OutFile '%TMPDIR%\git-installer.exe'"
        if !errorlevel! NEQ 0 (
            echo [ERROR] Failed to download Git installer
            pause
            exit /b 1
        )
        "%TMPDIR%\git-installer.exe" /VERYSILENT /NORESTART
        REM 等待 Git 安装完成
        timeout /t 10 /nobreak >nul
    ) else (
        echo [*] Skipped Git installation
    )
) else (
    for /f "tokens=3" %%i in ('git --version') do set "CURRENT_GIT_VERSION=%%i"
    echo [*] Current Git version: !CURRENT_GIT_VERSION!
    if "!CURRENT_GIT_VERSION!" LSS "%LATEST_GIT_VERSION%" (
        echo [*] New Git version available: %LATEST_GIT_VERSION%
        set /p "update_git=Update Git? (Y/N): "
        if /i "!update_git!"=="Y" (
            echo [*] Updating Git...
            powershell -Command "Invoke-WebRequest -Uri https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe -OutFile '%TMPDIR%\git-installer.exe'"
            if !errorlevel! NEQ 0 (
                echo [ERROR] Failed to download Git installer
                pause
                exit /b 1
            )
            "%TMPDIR%\git-installer.exe" /VERYSILENT /NORESTART
            REM 等待 Git 更新完成
            timeout /t 10 /nobreak >nul
        ) else (
            echo [*] Skipped Git update
        )
    ) else (
        echo [√] Git is up to date
    )
)

REM 检查并安装 Node.js（含 npm）
where node >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [*] Node.js is not installed, preparing to install...
    set /p "install_node=Install Node.js? (Y/N): "
    if /i "!install_node!"=="Y" (
        echo [*] Installing Node.js...
        powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi -OutFile '%TMPDIR%\nodejs.msi'"
        if !errorlevel! NEQ 0 (
            echo [ERROR] Failed to download Node.js installer
            pause
            exit /b 1
        )
        msiexec /i "%TMPDIR%\nodejs.msi" /quiet /norestart
        REM 等待 Node.js 安装完成
        timeout /t 20 /nobreak >nul
        REM 刷新环境变量
        call refreshenv.cmd >nul 2>&1
    ) else (
        echo [*] Skipped Node.js installation
    )
) else (
    for /f "tokens=1" %%i in ('node --version') do set "CURRENT_NODE_VERSION=%%i"
    set "CURRENT_NODE_VERSION=!CURRENT_NODE_VERSION:v=!"
    echo [*] Current Node.js version: !CURRENT_NODE_VERSION!
    if "!CURRENT_NODE_VERSION!" LSS "%LATEST_NODE_VERSION%" (
        echo [*] New Node.js version available: %LATEST_NODE_VERSION%
        set /p "update_node=Update Node.js? (Y/N): "
        if /i "!update_node!"=="Y" (
            echo [*] Updating Node.js...
            powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi -OutFile '%TMPDIR%\nodejs.msi'"
            if !errorlevel! NEQ 0 (
                echo [ERROR] Failed to download Node.js installer
                pause
                exit /b 1
            )
            msiexec /i "%TMPDIR%\nodejs.msi" /quiet /norestart
            REM 等待 Node.js 更新完成
            timeout /t 20 /nobreak >nul
            REM 刷新环境变量
            call refreshenv.cmd >nul 2>&1
        ) else (
            echo [*] Skipped Node.js update
        )
    ) else (
        echo [√] Node.js is up to date
    )
)

REM 检查并安装 Python
where python >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [*] Python is not installed, preparing to install...
    set /p "install_python=Install Python? (Y/N): "
    if /i "!install_python!"=="Y" (
        echo [*] Installing Python...
        powershell -Command "Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe -OutFile '%TMPDIR%\python-installer.exe'"
        if !errorlevel! NEQ 0 (
            echo [ERROR] Failed to download Python installer
            pause
            exit /b 1
        )
        "%TMPDIR%\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
        REM 等待 Python 安装完成
        timeout /t 20 /nobreak >nul
        REM 刷新环境变量
        call refreshenv.cmd >nul 2>&1
    ) else (
        echo [*] Skipped Python installation
    )
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "CURRENT_PYTHON_VERSION=%%i"
    if "!CURRENT_PYTHON_VERSION!"=="" (
        echo [ERROR] Failed to get Python version
        set "CURRENT_PYTHON_VERSION=0.0.0"
    )
    echo [*] Current Python version: !CURRENT_PYTHON_VERSION!
    if "!CURRENT_PYTHON_VERSION!" LSS "%LATEST_PYTHON_VERSION%" (
        echo [*] New Python version available: %LATEST_PYTHON_VERSION%
        set /p "update_python=Update Python? (Y/N): "
        if /i "!update_python!"=="Y" (
            echo [*] Updating Python...
            powershell -Command "Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe -OutFile '%TMPDIR%\python-installer.exe'"
            if !errorlevel! NEQ 0 (
                echo [ERROR] Failed to download Python installer
                pause
                exit /b 1
            )
            "%TMPDIR%\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
            REM 等待 Python 更新完成
            timeout /t 20 /nobreak >nul
            REM 刷新环境变量
            call refreshenv.cmd >nul 2>&1
        ) else (
            echo [*] Skipped Python update
        )
    ) else (
        echo [√] Python is up to date
    )
)

REM 创建环境变量刷新脚本
echo @echo off > refreshenv.cmd
echo set "PATH=%PATH%;C:\Program Files\nodejs;C:\Users\%USERNAME%\AppData\Roaming\npm;C:\Python311;C:\Python311\Scripts" >> refreshenv.cmd
echo setx PATH "%%PATH%%" >> refreshenv.cmd

REM 清理临时文件
echo [*] Cleaning up temporary files...
if exist "%TMPDIR%" rd /s /q "%TMPDIR%"
if exist "refreshenv.cmd" del /f /q "refreshenv.cmd"

REM 检查并刷新环境变量
echo [*] Refreshing environment variables...
call refreshenv.cmd >nul 2>&1

REM 检查安装结果
echo.
echo [*] Checking installation results:
where git
where node
where npm
where python
python --version
node --version
npm --version
git --version

echo.
echo [√] Development environment setup completed!
echo [*] If commands are not recognized, please restart your computer or log out and log back in.
pause
exit /b 0
