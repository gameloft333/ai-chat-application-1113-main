@echo off
rem 设置代码页为 UTF-8
chcp 65001 >nul
rem 设置控制台字体为 Consolas 或 新宋体
reg add "HKEY_CURRENT_USER\Console" /v "FaceName" /t REG_SZ /d "Consolas" /f >nul
rem 启用延迟变量扩展
setlocal EnableDelayedExpansion

rem 版本信息
set VERSION=1.0.9

rem 颜色代码
set RED=[91m]
set GREEN=[92m]
set YELLOW=[93m]
set NC=[0m]

rem 菜单选项
set "MENU_TITLE=Git 代码管理工具"
set "MENU_CURRENT=当前分支"
set "MENU_1=1) 提交到当前分支"
set "MENU_2=2) 创建新分支"
set "MENU_3=3) 切换分支"
set "MENU_4=4) 合并到主分支"
set "MENU_5=5) 退出"
set "MENU_CHOICE=请选择操作 (1-5): "

rem 检查Git
where git >nul 2>nul || (
    echo %RED%Git未安装%NC%
    pause
    exit /b 1
)

rem 检查仓库
if not exist ".git" (
    echo %RED%当前目录不是Git仓库%NC%
    pause
    exit /b 1
)

:menu
cls
echo === %MENU_TITLE% v%VERSION% ===
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set current_branch=%%i
echo %MENU_CURRENT%: %current_branch%
echo %MENU_1%
echo %MENU_2%
echo %MENU_3%
echo %MENU_4%
echo %MENU_5%
echo ==========================

choice /c 12345 /n /m "%MENU_CHOICE%"
set choice=%errorlevel%

if %choice%==1 (
    rem 临时关闭 SSL 验证
    echo %YELLOW%临时关闭 SSL 验证...%NC%
    git config --global http.sslVerify false
    
    call :do_commit "%current_branch%"
    
    rem 恢复 SSL 验证
    echo %YELLOW%恢复 SSL 验证...%NC%
    git config --global http.sslVerify true
    
    goto :menu
)
if %choice%==2 goto :create_branch
if %choice%==3 goto :switch_branch
if %choice%==4 goto :merge_main
if %choice%==5 exit /b 0

echo %RED%无效的选择%NC%
timeout /t 2 >nul
goto :menu

:do_commit
set branch=%~1
echo %YELLOW%正在更新分支 %branch%...%NC%
git pull origin "%branch%"

rem 检查是否有变更
git status -s > status.txt
set "has_changes="
for /f "tokens=*" %%a in (status.txt) do set "has_changes=1"
del status.txt

if not defined has_changes (
    echo %YELLOW%没有需要提交的变更%NC%
    timeout /t 2 >nul
    exit /b 0
)

rem 显示当前变更
echo %YELLOW%当前变更：%NC%
git status -s

rem 生成默认提交信息
git status -s > status.txt
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

git add .

echo.
echo %YELLOW%默认提交信息: !DEFAULT_MSG!%NC%
set /p COMMIT_MSG="请输入提交信息 (直接回车使用默认信息): "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=!DEFAULT_MSG!"

rem 获取提交前的 revision
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set old_revision=%%i

echo %YELLOW%正在提交...%NC%
git commit -m "!COMMIT_MSG!" 2>nul
if !errorlevel! neq 0 (
    echo %RED%提交失败%NC%
    timeout /t 2 >nul
    exit /b 1
)

echo %YELLOW%正在推送到远程...%NC%
git push origin "%branch%" 2>nul
if !errorlevel! neq 0 (
    echo %YELLOW%推送失败，5秒后重试...%NC%
    timeout /t 5 >nul
    git push origin "%branch%" 2>nul
    if !errorlevel! neq 0 (
        echo %RED%推送失败%NC%
        timeout /t 2 >nul
        exit /b 1
    )
)

rem 获取推送后的最新 revision
for /f "tokens=*" %%i in ('git rev-parse HEAD') do set new_revision=%%i

echo %GREEN%代码已成功提交到 %branch%%NC%
echo %YELLOW%Revision 变更:%NC%
echo 从: %old_revision:~0,7%
echo 到: %new_revision:~0,7%
rem echo %YELLOW%完整对比链接:%NC%
rem echo https://github.com/[username]/[repository]/compare/%old_revision%...%new_revision%
echo.
echo %YELLOW%按任意键返回主菜单...%NC%
pause >nul
exit /b 0

:create_branch
set /p new_branch="请输入新分支名称: "
if "!new_branch!"=="" (
    echo %RED%分支名称不能为空%NC%
    timeout /t 2 >nul
    goto :menu
)
echo %YELLOW%正在创建新分支...%NC%
git checkout -b "!new_branch!" 2>nul
if !errorlevel! neq 0 (
    echo %RED%创建分支失败%NC%
    timeout /t 2 >nul
    goto :menu
)
echo %GREEN%分支创建成功%NC%
call :do_commit "!new_branch!"
goto :menu

:switch_branch
echo %YELLOW%当前可用分支：%NC%
git branch
echo.
set /p branch="请输入要切换的分支名称: "
echo %YELLOW%正在切换分支...%NC%
git checkout "%branch%" 2>nul
if !errorlevel! neq 0 (
    echo %RED%切换分支失败%NC%
    timeout /t 2 >nul
)
goto :menu

:merge_main
echo %YELLOW%当前可用分支：%NC%
git branch
echo.
set /p branch="请输入要合并到主分支的分支名称: "
echo %YELLOW%正在合并分支...%NC%
git merge "%branch%" 2>nul
if !errorlevel! neq 0 (
    echo %RED%合并分支失败%NC%
    timeout /t 2 >nul
)
goto :menu

rem ... 其他代码保持不变 ...