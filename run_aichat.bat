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

