@echo off
REM Script to Deploy HopIn Backend Migration
REM This script handles the deployment of the backend business logic migration

echo ====================================================================
echo     HOPIN BACKEND DEPLOYMENT SCRIPT
echo     Migration: 010_backend_business_logic.sql
echo ====================================================================
echo.

REM Check if migration file exists
if not exist "supabase\migrations\010_backend_business_logic.sql" (
    echo ERROR: Migration file not found!
    echo Expected: supabase\migrations\010_backend_business_logic.sql
    exit /b 1
)

echo [OK] Migration file found
echo.

REM Try to use Supabase CLI
echo Attempting to deploy using Supabase CLI...
echo.

REM Check if supabase CLI is installed
where supabase >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Supabase CLI found
    echo.
    echo Deploying migration...
    supabase db push
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ====================================================================
        echo SUCCESS! Migration deployed to Supabase
        echo ====================================================================
        echo.
        pause
        exit /b 0
    ) else (
        echo.
        echo ERROR: Supabase db push failed
        echo.
    )
) else (
    echo [WARN] Supabase CLI not found
    echo.
)

REM If CLI not available or failed, provide manual instructions
echo ====================================================================
echo MANUAL DEPLOYMENT INSTRUCTIONS
echo ====================================================================
echo.
echo Since automatic deployment failed, please deploy manually:
echo.
echo OPTION 1: Use Supabase Dashboard (Recommended for this environment)
echo   1. Go to https://supabase.io/
echo   2. Sign in to your account
echo   3. Select the HopIn project
echo   4. Click "SQL Editor" in the sidebar
echo   5. Click "New Query"
echo   6. Copy the entire content of: supabase\migrations\010_backend_business_logic.sql
echo   7. Paste it into the SQL editor
echo   8. Click "Run"
echo   9. Wait for the success message
echo.
echo OPTION 2: Use psql Command Line
echo   psql postgresql://[user]:[password]@[host]:5432/[database] ^
echo      -f supabase\migrations\010_backend_business_logic.sql
echo.
echo OPTION 3: Install Supabase CLI first
echo   npm install -g @supabase/cli
echo   Then run: supabase db push
echo.
echo ====================================================================
echo.
echo VERIFICATION AFTER DEPLOYMENT:
echo.
echo Run these queries in Supabase SQL Editor to verify:
echo.
echo 1. Check functions:
echo    SELECT proname FROM pg_proc 
echo    WHERE proname LIKE 'validate_ride%%' OR proname LIKE 'book_ride%%';
echo.
echo 2. Check triggers:
echo    SELECT trigger_name FROM information_schema.triggers 
echo    WHERE trigger_name LIKE 'tr_%%';
echo.
echo 3. Check indexes:
echo    SELECT indexname FROM pg_indexes 
echo    WHERE indexname LIKE 'idx_%%';
echo.
echo ====================================================================
echo.
pause
