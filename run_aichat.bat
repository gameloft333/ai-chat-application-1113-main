@echo off
:: Set UTF-8 encoding
chcp 65001
:: Clear screen after changing code page
cls

:: Check for administrator privileges
net session >nul 2>&1
if %errorlevel% == 0 (
  goto :menu
) else (
  echo Requesting Administrator privileges...
  goto :requestadmin
)

:requestadmin
  runas /user:administrator "%~f0" ::admin
  exit /b

:menu
echo 请选择启动模式:
echo 1. 开发模式 (清理依赖 + npm run dev)
echo 2. 预览模式 (清理依赖 + npm run preview)
echo 3. 快速开发模式 (保留依赖 + npm run dev)
echo 4. 快速预览模式 (保留依赖 + npm run preview)
echo 5. 快速服务器模式 (保留依赖 + npm run server)
set /p mode="请输入选项 (1-5): "

if "%mode%"=="1" goto :dev
if "%mode%"=="2" goto :preview
if "%mode%"=="3" goto :quickdev
if "%mode%"=="4" goto :quickpreview
if "%mode%"=="5" goto :quickserver
echo 无效的选项，请重试
goto :menu

:dev
echo Running as administrator...
:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"
:: Add node_modules\.bin to PATH
set "PATH=%cd%\node_modules\.bin;%PATH%"

:: Clean existing dependencies
echo Cleaning existing dependencies...
if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    echo Removing package-lock.json...
    del /f /q package-lock.json
)

:: Install dependencies
echo Installing dependencies...
npm install --verbose
if errorlevel 1 (
  echo Error: npm install failed.
  pause
  exit /b 1
)

:: Start dev server
echo Starting development server...
npm run dev
goto :end

:preview
echo Running as administrator...
:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"
:: Add node_modules\.bin to PATH
set "PATH=%cd%\node_modules\.bin;%PATH%"

:: Clean existing dependencies
echo Cleaning existing dependencies...
if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    echo Removing package-lock.json...
    del /f /q package-lock.json
)

:: Install dependencies
echo Installing dependencies...
npm install --verbose
if errorlevel 1 (
  echo Error: npm install failed.
  pause
  exit /b 1
)

:: Build and preview
echo Building project...
npm run build
if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)

echo Previewing project...
npm run preview
goto :end

:quickdev
echo Running as administrator...
:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"
:: Add node_modules\.bin to PATH
set "PATH=%cd%\node_modules\.bin;%PATH%"

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --verbose
    if errorlevel 1 (
        echo Error: npm install failed.
        pause
        exit /b 1
    )
)

:: Start dev server
echo Starting development server...
npm run dev
goto :end

:quickpreview
echo Running as administrator...
:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"
:: Add node_modules\.bin to PATH
set "PATH=%cd%\node_modules\.bin;%PATH%"

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --verbose
    if errorlevel 1 (
        echo Error: npm install failed.
        pause
        exit /b 1
    )
)

:: Build and preview
echo Building project...
npm run build
if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)

echo Previewing project...
npm run preview
goto :end

:quickserver
echo Running as administrator...
:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"
:: Add node_modules\.bin to PATH
set "PATH=%cd%\node_modules\.bin;%PATH%"

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --verbose
    if errorlevel 1 (
        echo Error: npm install failed.
        pause
        exit /b 1
    )
)

:: Build and start server
echo Building project...
npm run build
if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)

echo Starting server...
:: 设置工作目录
cd /d "%~dp0"
:: 设置 NODE_ENV
set NODE_ENV=production
:: 使用 node 的 ES 模块模式运行服务器
node --experimental-json-modules server/index.js
goto :end

:end
echo Done.
pause
exit /b 0

