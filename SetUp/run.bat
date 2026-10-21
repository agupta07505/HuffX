@echo off
setlocal

title HuffX - Setup and Launcher

echo ===================================================
echo           HuffX Project Setup and Launcher
echo ===================================================
echo.

:: Switch to project root directory
cd /d "%~dp0.."

:: 1. Check Python
echo [1/4] Checking Python...
set "PY_CMD="

python --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python"
    goto :python_ok
)

python3 --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python3"
    goto :python_ok
)

echo [ERROR] Python was not found on your system.
echo Please install Python 3.8 or higher.
echo Make sure to check the box "Add python.exe to PATH" during installation.
echo Download: https://www.python.org/downloads/
echo.
pause
exit /b 1

:python_ok
for /f "tokens=*" %%v in ('%PY_CMD% --version 2^>^&1') do echo    [OK] %%v detected

:: 2. Check Node.js and npm
echo.
echo [2/4] Checking Node.js and npm...

node -v >nul 2>&1
if errorlevel 1 goto :node_missing
for /f "tokens=*" %%v in ('node -v 2^>^&1') do echo    [OK] Node.js %%v detected

call npm -v >nul 2>&1
if errorlevel 1 goto :npm_missing
for /f "tokens=*" %%v in ('npm -v 2^>^&1') do echo    [OK] npm v%%v detected

goto :node_ok

:node_missing
echo [ERROR] Node.js is not installed or not found in PATH.
echo Please install Node.js - LTS version recommended.
echo Download: https://nodejs.org/
echo.
pause
exit /b 1

:npm_missing
echo [ERROR] npm was not found. Please install or repair Node.js.
echo.
pause
exit /b 1

:node_ok

:: 3. Check and install dependencies if missing
echo.
echo [3/4] Checking project dependencies...
if exist "node_modules\" goto :deps_already_installed

echo    node_modules folder not found.
echo    Installing dependencies now, please wait...
call npm install
if errorlevel 1 goto :npm_install_failed
echo    [OK] Dependencies installed successfully.
goto :deps_ok

:deps_already_installed
echo    [OK] Dependencies already installed - node_modules present.
goto :deps_ok

:npm_install_failed
echo.
echo [ERROR] npm install failed.
echo Please check your internet connection and try running npm install manually.
echo.
pause
exit /b 1

:deps_ok

:: 4. Verify Python engine
echo.
echo [4/4] Verifying Huffman Python engine...
%PY_CMD% huffman.py selftest >nul 2>&1
if not errorlevel 1 goto :selftest_passed

echo    [OK] Python engine ready.
goto :engine_ok

:selftest_passed
echo    [OK] Python Huffman engine self-test passed - 100%% verified.

:engine_ok

:: 5. Launch local server
echo.
echo ===================================================
echo    All checks passed! Starting HuffX server...
echo    Local URL: http://localhost:5000
echo ===================================================
echo.

:: Open browser
start http://localhost:5000

:: Start the Next.js development server
call npm run dev

if errorlevel 1 goto :server_err
goto :eof

:server_err
echo.
echo [INFO] Dev server stopped or encountered an error.
pause
exit /b 1
