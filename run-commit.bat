@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 设置标题
title Git 自动提交工具

:: 获取当前时间
set "yyyy=%date:~0,4%"
set "mm=%date:~5,2%"
set "dd=%date:~8,2%"
set "hh=%time:~0,2%"
if "%hh:~0,1%"==" " set "hh=0%hh:~1,1%"
set "mn=%time:~3,2%"
set "ss=%time:~6,2%"
set "timestamp=%yyyy%%mm%%dd%-%hh%%mn%%ss%"

:: 检查是否存在 .git 目录
if not exist ".git" (
    echo [错误] 当前目录不是 Git 仓库！
    pause
    exit /b 1
)

:: 获取当前分支名
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set "current_branch=%%i"

:: 显示当前状态
echo [信息] 当前分支: %current_branch%
echo [信息] 当前时间: %timestamp%

:: 执行 Git 操作
echo [执行] 添加文件...
git add .

:: 提示用户输入提交信息
set /p "commit_message=请输入提交信息 (直接回车使用默认信息): "

:: 如果用户没有输入，使用默认信息
if "!commit_message!"=="" (
    set "commit_message=自动更新: !timestamp!"
)

:: 提交代码
echo [执行] 提交代码...
git commit -m "!commit_message!"

:: 推送到远程仓库
echo [执行] 推送到远程仓库...
git push origin !current_branch!

:: 显示完成信息
echo.
echo [完成] 代码已成功提交并推送到 !current_branch! 分支
echo.

pause