@echo off
REM ���ô���ҳΪ 936 (GB2312)
chcp 936 >nul

REM �Թ���ԱȨ������
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo �������ԱȨ��...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"

:menu
cls
echo ============================================================
echo                    ��������������
echo ============================================================
echo [���Ի���]
echo  1. �������Կͻ���
echo  2. �������� Stripe ������
echo  3. �������� TON ������
echo [��������]
echo  4. ���������ͻ���
echo  5. �������� Stripe ������
echo  6. �������� TON ������
echo  7. �˳�
echo ============================================================
choice /C 1234567 /N /M "������ѡ��(1-7): "

if errorlevel 7 goto end
if errorlevel 6 goto prod_ton_server
if errorlevel 5 goto prod_stripe_server
if errorlevel 4 goto prod_client
if errorlevel 3 goto ton_server
if errorlevel 2 goto stripe_server
if errorlevel 1 goto client

:client
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:test
call npm run dev:test
goto end

:stripe_server
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:test
call npm run server:test
goto end

:ton_server
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:test
call npm run ton:server:test
goto end

:prod_client
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:prod
call npm run dev:prod
goto end

:prod_stripe_server
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:prod
call npm run server:prod
goto end

:prod_ton_server
D:
cd D:\Software\ai_tools\AI_Webbuilder\ai-chat-application-1113-main
call npm install --verbose
call npm run clean
call npm run build:prod
call npm run ton:server:prod
goto end

:end
exit 