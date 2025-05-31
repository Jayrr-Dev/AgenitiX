@echo off
REM AgenitiX Adaptive Anubis Testing Suite - Windows Batch File

echo.
echo 🚀 AgenitiX Adaptive Anubis Testing Suite
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Get the directory of this batch file
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if test script exists
if not exist "test-adaptive-anubis.js" (
    echo ❌ Test script not found: test-adaptive-anubis.js
    echo Please ensure you're running this from the scripts directory
    pause
    exit /b 1
)

REM Parse command line arguments
set TEST_URL=http://localhost:3000
set VERBOSE=false

:parse_args
if "%1"=="" goto run_tests
if "%1"=="--local" (
    set TEST_URL=http://localhost:3000
    shift
    goto parse_args
)
if "%1"=="--dev" (
    set TEST_URL=https://your-dev-server.com
    shift
    goto parse_args
)
if "%1"=="--staging" (
    set TEST_URL=https://your-staging-server.com
    shift
    goto parse_args
)
if "%1"=="--url" (
    shift
    set TEST_URL=%1
    shift
    goto parse_args
)
if "%1"=="--verbose" (
    set VERBOSE=true
    shift
    goto parse_args
)
if "%1"=="--help" (
    goto show_help
)
shift
goto parse_args

:show_help
echo.
echo Usage: test-adaptive-anubis.bat [options]
echo.
echo Options:
echo   --local      Test against localhost:3000 (default)
echo   --dev        Test against development server
echo   --staging    Test against staging server
echo   --url URL    Test against custom URL
echo   --verbose    Enable verbose output
echo   --help       Show this help message
echo.
echo Examples:
echo   test-adaptive-anubis.bat --local
echo   test-adaptive-anubis.bat --url https://your-site.com
echo   test-adaptive-anubis.bat --staging --verbose
echo.
pause
exit /b 0

:run_tests
echo 📍 Target Server: %TEST_URL%
echo.

REM Set environment variable and run tests
set TEST_SERVER_URL=%TEST_URL%

if "%VERBOSE%"=="true" (
    set DEBUG=true
)

echo 🧪 Starting tests...
echo.

node test-adaptive-anubis.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Tests completed successfully!
) else (
    echo.
    echo ❌ Tests failed with exit code %errorlevel%
)

echo.
echo Press any key to exit...
pause >nul 