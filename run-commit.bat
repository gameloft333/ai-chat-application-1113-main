@echo off
rem 设置代码页
chcp 65001 >nul
setlocal EnableDelayedExpansion

rem 版本信息
set VERSION=1.0.0

rem 获取时间戳
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%-%datetime:~8,6%

rem 检查Git
where git >nul 2>nul || (
    echo Git not found
    pause
    exit /b 1
)

rem 检查仓库
if not exist ".git" (
    echo Not a Git repository
    pause
    exit /b 1
)

rem 获取分支
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i

rem 显示信息
echo Current branch: %branch%
echo Current time: %timestamp%
echo Version: %VERSION%

rem 同步代码
git pull origin %branch%

rem 检查状态
git status -s > status.txt

rem 生成提交信息
set "DEFAULT_MSG="
for /f "tokens=1,2*" %%a in (status.txt) do (
    set "STATUS=%%a"
    set "FILE=%%b"
    if "!STATUS!"=="M" (
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=update: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
    if "!STATUS!"=="A" (
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=add: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
    if "!STATUS!"=="D" (
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=remove: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
)

del status.txt

rem 添加文件
git add .

rem 提交更改
set /p COMMIT_MSG="Enter commit message (Enter for default): "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=!DEFAULT_MSG!"

git commit -m "!COMMIT_MSG!"
if !errorlevel! neq 0 (
    echo Commit failed
    pause
    exit /b 1
)

rem 推送更改
git push origin %branch%
if !errorlevel! neq 0 (
    echo Push failed, retrying...
    timeout /t 5 >nul
    git push origin %branch%
    if !errorlevel! neq 0 (
        echo Push failed
        pause
        exit /b 1
    )
)

echo Changes pushed to %branch%
echo Message: !COMMIT_MSG!
pause