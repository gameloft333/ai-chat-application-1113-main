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
echo 5. 快速服务器模式 (保留依赖 + npm run server)
echo 6. 完整服务器模式 (清理依赖 + 启动所有服务)
echo 7. 快速完整服务器模式 (保留依赖 + 启动所有服务)
echo 0. 退出程序
echo ======================================
choice /c 01234567 /n /m "请选择选项 (0-7): "
set mode=%errorlevel%
set /a mode-=1

if %mode% equ 0 goto :exitprogram
if %mode% equ 1 goto :dev
if %mode% equ 2 goto :preview
if %mode% equ 3 goto :quickdev
if %mode% equ 4 goto :quickpreview
if %mode% equ 5 goto :quickserver
if %mode% equ 6 goto :fullserver
if %mode% equ 7 goto :quickfullserver
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
npm run clean && npm run build
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

:fullserver
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

goto :startallservers

:quickfullserver
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

goto :startallservers

:startallservers
:: Build project
echo Building project...
npm run clean && npm run build
if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)

echo Starting all servers...
:: 设置工作目录
cd /d "%~dp0"
:: 设置 NODE_ENV
set NODE_ENV=production

:: 启动 TON 支付服务器 (新窗口)
start "TON Payment Server" cmd /k "cross-env NODE_OPTIONS=\"--loader ts-node/esm\" ts-node ton-payment/index.ts"

:: 启动主服务器 (新窗口)
start "Main Server" cmd /k "node --experimental-json-modules server/index.ts"

:: 启动预览服务器
echo Starting preview server...
npm run preview

goto :end

:end
echo Done.
pause
exit /b 0

:: 添加新的退出标签
:exitprogram
echo 正在退出程序...
exit /b 0

