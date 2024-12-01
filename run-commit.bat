@echo off
:: ===========================================
:: Git Auto Commit Tool
:: 功能：自动化Git提交和推送流程
:: 作者：AI Team
:: 版本：1.0.0
:: ===========================================

:: 设置UTF-8编码，避免中文乱码
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: 初始化变量
set "SCRIPT_VERSION=1.0.0"
set "COMMIT_TYPE="
set "COMMIT_SCOPE="
set "COMMIT_MESSAGE="

:: 获取当前时间戳
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,8%-%datetime:~8,6%

:: 检查Git安装
echo [检查] Git环境...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Git，请确保Git已安装并添加到环境变量
    pause
    exit /b 1
)

:: 检查是否在Git仓库中
if not exist ".git" (
    echo [错误] 当前目录不是Git仓库
    echo [信息] 当前目录: %CD%
    pause
    exit /b 1
)

:: 获取当前分支名
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i

:: 显示基本信息
echo [信息] 当前分支: %branch%
echo [信息] 当前时间: %timestamp%
echo [信息] 脚本版本: %SCRIPT_VERSION%

:: 拉取最新代码
echo [执行] 同步远程代码...
git pull origin %branch%

:: 获取变更文件列表
echo [检查] 文件变更状态...
git status -s > temp_status.txt

:: 检查是否有变更
git diff --cached --quiet
if %errorlevel% neq 0 (
    :: 生成默认提交信息
    set "DEFAULT_MSG="
    
    :: 读取变更文件列表并生成提交信息
    for /f "tokens=1,2" %%a in (temp_status.txt) do (
        set "FILE_STATUS=%%a"
        set "FILE_NAME=%%b"
        
        :: 根据文件状态添加相应描述
        if "!FILE_STATUS!"=="M" (
            if "!DEFAULT_MSG!"=="" (
                set "DEFAULT_MSG=update: !FILE_NAME!"
            ) else (
                set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE_NAME!"
            )
        ) else if "!FILE_STATUS!"=="A" (
            if "!DEFAULT_MSG!"=="" (
                set "DEFAULT_MSG=add: !FILE_NAME!"
            ) else (
                set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE_NAME!"
            )
        ) else if "!FILE_STATUS!"=="D" (
            if "!DEFAULT_MSG!"=="" (
                set "DEFAULT_MSG=remove: !FILE_NAME!"
            ) else (
                set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE_NAME!"
            )
        )
    )
    
    :: 删除临时文件
    del temp_status.txt
    
    :: 提示输入提交信息
    set /p "COMMIT_MESSAGE=提交信息 (直接回车使用默认信息): "
    
    :: 如果没有输入，使用默认信息
    if "!COMMIT_MESSAGE!"=="" (
        set "COMMIT_MESSAGE=!DEFAULT_MSG!"
    )
    
    :: 添加所有变更
    echo [执行] 添加变更文件...
    git add .
    
    :: 提交变更
    echo [执行] 提交变更...
    git commit -m "!COMMIT_MESSAGE!"
    if %errorlevel% neq 0 (
        echo [错误] 提交失败
        pause
        exit /b 1
    )
    
    :: 推送到远程
    echo [执行] 推送到远程仓库...
    git push origin %branch%
    if %errorlevel% neq 0 (
        echo [警告] 首次推送失败，5秒后重试...
        timeout /t 5 >nul
        git push origin %branch%
        if %errorlevel% neq 0 (
            echo [错误] 推送失败，请检查:
            echo 1. 网络连接是否正常
            echo 2. 是否有推送权限
            echo 3. 远程仓库是否可访问
            pause
            exit /b 1
        )
    )
    
    echo [成功] 代码已提交并推送到 %branch% 分支
    echo [信息] 提交信息: !COMMIT_MESSAGE!
) else (
    echo [信息] 没有需要提交的变更
)

echo [完成] 所有操作已完成
pause
exit /b 0