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
echo 1. 开发模式 (npm run dev)
echo 2. 预览模式 (npm run preview)
set /p mode="请输入选项 (1 或 2): "

if "%mode%"=="1" goto :dev
if "%mode%"=="2" goto :preview
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

:end
echo Done.
pause
exit /b 0

