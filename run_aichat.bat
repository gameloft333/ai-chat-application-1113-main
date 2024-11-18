@echo off

:: Check for administrator privileges
net session >nul 2>&1
if %errorlevel% == 0 (
  goto :admin
) else (
  echo Requesting Administrator privileges...
  goto :requestadmin
)

:requestadmin
  runas /user:administrator "%~f0" ::admin
  exit /b

:admin
echo Running as administrator...

:: Change drive to D:
d:

:: Change directory
rem cd /d "D:\Software\ai_tools\AI_Webbuilder\sb1-lr7zbg-abs0717-main"
cd /d "d:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1013"

:: Check if the directory exists
if not exist "%cd%" (
  echo Error: Directory not found.
  pause
  exit /b 1
)

:: Set npm path
set "PATH=C:\Users\Administrator\AppData\Roaming\fnm\node-versions\v20.18.0\installation;%PATH%"

:: Install dependencies
echo Installing dependencies...
npm install --vebose

if errorlevel 1 (
  echo Error: npm install failed.
  pause
  exit /b 1
)

:: Build the project
echo Building project...
npm run build

if errorlevel 1 (
  echo Error: npm run build failed.
  pause
  exit /b 1
)


:: Preview the project
echo Previewing project...
npm run preview

if errorlevel 1 (
  echo Error: npm run preview failed.
  pause
  exit /b 1
)

echo Done.
pause
exit /b 0

