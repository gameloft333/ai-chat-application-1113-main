@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 设置标题
title Git 自动提交工具

:: 获取当前时间
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "yyyy=%datetime:~0,4%"
set "mm=%datetime:~4,2%"
set "dd=%datetime:~6,2%"
set "hh=%datetime:~8,2%"
set "mn=%datetime:~10,2%"
set "ss=%datetime:~12,2%"
set "timestamp=%yyyy%%mm%%dd%-%hh%%mn%%ss%"

:: 检查 Git 是否安装
where git >nul 2>nul
if errorlevel 1 (
    echo [错误] Git 未安装或未添加到系统路径！
    pause
    exit /b 1
)

:: 检查是否为 Git 仓库
if not exist ".git" (
    echo [错误] 当前目录不是 Git 仓库！
    echo [信息] 当前目录: %CD%
    pause
    exit /b 1
)

:: 获取当前分支名
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "current_branch=%%i"
if errorlevel 1 (
    echo [错误] 无法获取当前分支名
    echo [信息] 请确保在有效的 Git 仓库中执行此脚本
    pause
    exit /b 1
)

:: 显示状态信息
echo [信息] 当前分支: %current_branch%
echo [信息] 当前时间: %timestamp%
echo [信息] 工作目录: %CD%

:: 显示变更文件列表
echo.
echo [信息] 检查变更文件...
git status -s
if errorlevel 1 (
    echo [错误] 无法获取 Git 状态
    pause
    exit /b 1
)

:: 添加所有变更
echo.
echo [执行] 添加所有变更文件...
git add . 2>nul
if errorlevel 1 (
    echo [错误] 添加文件失败
    echo [提示] 请检查文件权限或是否有冲突
    pause
    exit /b 1
)

:: 检查是否有文件要提交
git diff --cached --quiet
if errorlevel 1 (
    :: 提示输入提交信息
    set /p "commit_message=请输入提交信息 (直接回车使用默认信息): "
    
    :: 使用默认提交信息
    if "!commit_message!"=="" (
        set "commit_message=自动更新: !timestamp!"
    )
    
    :: 提交变更
    echo.
    echo [执行] 提交变更...
    git commit -m "!commit_message!" 2>nul
    if errorlevel 1 (
        echo [错误] 提交失败
        echo [提示] 请检查 Git 配置是否正确
        pause
        exit /b 1
    )
    
    :: 推送到远程
    echo.
    echo [执行] 推送到远程仓库...
    git push origin !current_branch! 2>nul
    if errorlevel 1 (
        echo [错误] 推送失败
        echo [提示] 请检查网络连接或远程仓库权限
        git push origin !current_branch! 2>&1
        pause
        exit /b 1
    )
    
    echo.
    echo [成功] 代码已提交并推送到 !current_branch! 分支
) else (
    echo.
    echo [信息] 没有需要提交的变更
)

echo.
echo [完成] 所有操作已完成
pause
exit /b 0