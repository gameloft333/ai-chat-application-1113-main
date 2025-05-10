@echo off
REM Set code page to UTF-8 for better character support
chcp 65001

echo Resetting development environment...

REM Step 1: Delete node_modules folder
echo Deleting node_modules directory...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules deleted.
) else (
    echo node_modules directory not found.
)

REM Step 2: Delete package-lock.json file
echo Deleting package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo package-lock.json deleted.
) else (
    echo package-lock.json not found.
)

REM Step 3: Run npm install
echo Running npm install...
call npm install --verbose
if %errorlevel% neq 0 (
    echo npm install failed. Exiting.
    exit /b %errorlevel%
)
echo npm install completed.

REM Step 4: Restart Vite development server
echo Starting Vite development server (npm run dev)...
call npm run dev

echo Script finished.