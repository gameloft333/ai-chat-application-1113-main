@echo off
:: 设置代码页为 UTF-8
chcp 65001 >nul
:: 清理屏幕
cls

:: 检查管理员权限
net session >nul 2>&1
if %errorlevel% == 0 (
  goto :menu
) else (
  echo 请求管理员权限...
  goto :requestadmin
)

:requestadmin
  powershell -Command "Start-Process '%~f0' -Verb RunAs"
  exit /b

:menu
cls
echo ======================================
echo            启动模式选择
echo ======================================
echo 1. 开发模式 (清理依赖 + npm run dev)
echo 2. 预览模式 (清理依赖 + npm run preview)
echo 3. 快速开发模式 (保留依赖 + npm run dev)
echo 4. 快速预览模式 (保留依赖 + npm run preview)
echo 5. 开发环境完整服务 (dev + server + ton)
echo 6. 生产环境完整服务 (prod + server + ton)
echo 7. 生产环境前端服务 (仅启动前端)
echo 8. 生产环境后端服务 (仅启动后端)
echo 0. 退出程序
echo ======================================
choice /c 012345678 /n /m "请选择选项 (0-8): "
set mode=%errorlevel%
set /a mode-=1

if %mode% equ 0 goto :exitprogram
if %mode% equ 1 goto :dev
if %mode% equ 2 goto :preview
if %mode% equ 3 goto :quickdev
if %mode% equ 4 goto :quickpreview
if %mode% equ 5 goto :devfullserver
if %mode% equ 6 goto :prodfullserver
if %mode% equ 7 goto :prodfrontend
if %mode% equ 8 goto :prodbackend
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
npm run clean && npm run build
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
npm run clean && npm run build
if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)

echo Previewing project...
npm run preview
goto :end

:devfullserver
echo 启动开发环境完整服务...
:: 设置环境变量
set NODE_ENV=development
:: 启动 TON 支付服务器 (新窗口)
start "TON Payment Server DEV" cmd /k "npm run dev:ton"
:: 启动主服务器 (新窗口)
start "Main Server DEV" cmd /k "npm run dev:server"
:: 启动开发服务器
npm run dev
goto :end

:prodfullserver
echo 启动生产环境完整服务...
:: 设置环境变量
set NODE_ENV=production
:: 构建项目
echo 构建项目...
npm run build:prod
if errorlevel 1 (
  echo Error: Build failed
  pause
  exit /b 1
)
:: 启动 TON 支付服务器 (新窗口)
start "TON Payment Server PROD" cmd /k "npm run ton:server:prod"
:: 启动主服务器 (新窗口)
start "Main Server PROD" cmd /k "npm run server:prod"
:: 启动预览服务器
npm run preview:prod
goto :end

:prodfrontend
echo 启动生产环境前端服务...
:: 设置环境变量
set NODE_ENV=production
:: 构建项目
echo 构建项目...
npm run build:prod
if errorlevel 1 (
  echo Error: Build failed
  pause
  exit /b 1
)
:: 启动预览服务器
npm run preview:prod
goto :end

:prodbackend
echo 启动生产环境后端服务...
:: 设置环境变量
set NODE_ENV=production
:: 启动 TON 支付服务器 (新窗口)
start "TON Payment Server PROD" cmd /k "npm run ton:server:prod"
:: 启动主服务器 (新窗口)
start "Main Server PROD" cmd /k "npm run server:prod"
echo 后端服务已启动
pause
goto :end

:end
echo Done.
pause
exit /b 0

:exitprogram
echo 正在退出程序...
exit /b 0

