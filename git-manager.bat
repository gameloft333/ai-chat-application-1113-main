@echo off
rem 设置代码页为 UTF-8
chcp 65001 >nul
rem 设置控制台字体为 Consolas 或 新宋体
reg add "HKEY_CURRENT_USER\Console" /v "FaceName" /t REG_SZ /d "Consolas" /f >nul
rem 启用延迟变量扩展
setlocal EnableDelayedExpansion

rem 版本信息
set VERSION=1.0.5

rem 颜色代码
set RED=
set GREEN=
set YELLOW=
set NC=

rem 菜单选项（使用英文变量名避免乱码）
set "MENU_TITLE=Git 代码管理工具"
set "MENU_CURRENT=当前分支"
set "MENU_1=1) 提交到当前分支"
set "MENU_2=2) 创建新分支"
set "MENU_3=3) 切换分支"
set "MENU_4=4) 合并到主分支"
set "MENU_5=5) ⚠️ 提交到所有分支"
set "MENU_6=6) 退出"
set "MENU_CHOICE=请选择操作 (1-6): "

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
echo %RED%%MENU_5%%NC%
echo %MENU_6%
echo ==========================

choice /c 123456 /n /m "%MENU_CHOICE%"
set choice=%errorlevel%

if %choice%==1 goto :commit
if %choice%==2 goto :create_branch
if %choice%==3 goto :switch_branch
if %choice%==4 goto :merge_main
if %choice%==5 goto :commit_all_branches
if %choice%==6 exit /b 0

echo %RED%无效的选择%NC%
timeout /t 2 >nul
goto :menu

:commit
call :do_commit "%current_branch%"
goto :menu

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
rem 将分支列表保存到临时数组中
set branch_count=0
for /f "tokens=*" %%a in ('git branch') do (
    set /a branch_count+=1
    set "branch_!branch_count!=%%a"
    echo !branch_count!^) %%a
)
echo.

set /p choice="请输入分支序号: "
if "!choice!"=="" (
    echo %RED%序号不能为空%NC%
    timeout /t 2 >nul
    goto :menu
)

rem 验证输入是否为数字且在有效范围内
set "valid=true"
for /f "delims=0123456789" %%i in ("!choice!") do set "valid=false"
if !choice! leq 0 set "valid=false"
if !choice! gtr !branch_count! set "valid=false"

if "!valid!"=="false" (
    echo %RED%无效的序号选择%NC%
    timeout /t 2 >nul
    goto :menu
)

rem 获取选择的分支名称（需要去除前面的星号和空格）
for /f "tokens=*" %%a in ("!branch_%choice%!") do (
    set "selected_branch=%%a"
    set "selected_branch=!selected_branch:* =!"
)

echo %YELLOW%正在切换分支...%NC%
git checkout "!selected_branch!" 2>nul
if !errorlevel! neq 0 (
    echo %RED%切换分支失败，请检查分支名称是否正确%NC%
    timeout /t 2 >nul
    goto :menu
)

echo %GREEN%已成功切换到分支: !selected_branch!%NC%
timeout /t 2 >nul
goto :menu

:merge_main
if "%current_branch%"=="main" (
    echo %RED%当前已经在main分支%NC%
    timeout /t 2 >nul
    goto :menu
)
set /p confirm="确认要合并到main分支吗? (y/n): "
if /i "%confirm%"=="y" (
    echo %YELLOW%正在切换到main分支...%NC%
    git checkout main 2>nul
    if !errorlevel! neq 0 (
        echo %RED%切换到main分支失败%NC%
        timeout /t 2 >nul
        goto :menu
    )
    
    echo %YELLOW%正在更新main分支...%NC%
    git pull origin main
    
    echo %YELLOW%正在合并分支 %current_branch%...%NC%
    git merge "%current_branch%"
    
    echo %YELLOW%正在推送更改...%NC%
    git push origin main
    
    echo %GREEN%合并完成%NC%
    timeout /t 2 >nul
)
goto :menu

:commit_all_branches
echo %RED%警告：此操作将会提交代码到所有分支！%NC%
echo %RED%请确保你了解这样做的影响！%NC%

rem 先显示所有变动文件
git status -s > status.txt
echo %YELLOW%当前变动的文件列表：%NC%
set "has_changes=false"
set "DEFAULT_MSG="
for /f "tokens=1,2*" %%a in (status.txt) do (
    set "STATUS=%%a"
    set "FILE=%%b"
    set "has_changes=true"
    
    if "!STATUS!"=="M" echo [修改] !FILE!
    if "!STATUS!"=="A" echo [新增] !FILE!
    if "!STATUS!"=="D" echo [删除] !FILE!
)
del status.txt

if "!has_changes!"=="false" (
    echo %YELLOW%没有检测到文件变动，操作取消%NC%
    timeout /t 2 >nul
    goto :menu
)

echo.
set /p confirm="确认要提交以上变动到所有分支吗? (yes/no): "
if /i not "!confirm!"=="yes" (
    echo %YELLOW%操作已取消%NC%
    timeout /t 2 >nul
    goto :menu
)

rem 保存当前分支名称
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set original_branch=%%i

rem 先提交当前分支的更改
call :do_commit "%original_branch%"
if !errorlevel! neq 0 (
    echo %RED%当前分支提交失败，操作终止%NC%
    timeout /t 2 >nul
    goto :menu
)

rem 获取所有分支列表并逐个处理
for /f "tokens=*" %%b in ('git branch') do (
    set "branch=%%b"
    set "branch=!branch:* =!"
    
    rem 跳过当前分支，因为已经处理过了
    if not "!branch!"=="%original_branch%" (
        echo %YELLOW%正在处理分支: !branch!%NC%
        
        rem 切换到该分支
        git checkout "!branch!" 2>nul
        if !errorlevel! neq 0 (
            echo %RED%切换到分支 !branch! 失败，跳过...%NC%
            timeout /t 2 >nul
        ) else (
            rem 合并原始分支的更改
            git merge "%original_branch%" 2>nul
            if !errorlevel! neq 0 (
                echo %RED%合并到分支 !branch! 失败，跳过...%NC%
                timeout /t 2 >nul
            ) else (
                git push origin "!branch!" 2>nul
                if !errorlevel! neq 0 (
                    echo %RED%推送分支 !branch! 失败%NC%
                    timeout /t 2 >nul
                ) else (
                    echo %GREEN%成功更新分支: !branch!%NC%
                )
            )
        )
    )
)

rem 切回原始分支
git checkout "%original_branch%" 2>nul
echo %GREEN%所有分支处理完成%NC%
timeout /t 2 >nul
goto :menu

:do_commit
set branch=%~1
echo %YELLOW%正在更新分支 %branch%...%NC%
git pull origin "%branch%"

rem 显示文件变动状态
git status -s > status.txt
echo %YELLOW%当前变动的文件列表：%NC%
set "has_changes=false"
set "DEFAULT_MSG="
for /f "tokens=1,2*" %%a in (status.txt) do (
    set "STATUS=%%a"
    set "FILE=%%b"
    set "has_changes=true"
    
    if "!STATUS!"=="M" (
        echo [修改] !FILE!
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=update: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
    if "!STATUS!"=="A" (
        echo [新增] !FILE!
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=add: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
    if "!STATUS!"=="D" (
        echo [删除] !FILE!
        if "!DEFAULT_MSG!"=="" (
            set "DEFAULT_MSG=remove: !FILE!"
        ) else (
            set "DEFAULT_MSG=!DEFAULT_MSG!, !FILE!"
        )
    )
)
del status.txt

if "!has_changes!"=="false" (
    echo %YELLOW%没有检测到文件变动%NC%
    timeout /t 2 >nul
    exit /b 0
)

echo.
set /p confirm="确认提交以上文件变动？(y/n): "
if /i not "!confirm!"=="y" (
    echo %YELLOW%提交已取消%NC%
    timeout /t 2 >nul
    exit /b 1
)

git add .

echo 默认提交信息: !DEFAULT_MSG!
set /p COMMIT_MSG="请输入提交信息 (直接回车使用默认信息): "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=!DEFAULT_MSG!"

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

echo %GREEN%代码已提交到 %branch%%NC%
timeout /t 2 >nul
exit /b 0 