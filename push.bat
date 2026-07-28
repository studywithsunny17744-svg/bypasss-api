@echo off
cd /d "%~dp0"
title Git & Render Auto-Deploy Tool
cls
echo ====================================================
echo           GIT & RENDER AUTO-DEPLOY UTILITY
echo ====================================================
echo.

:: Check if git is globally available in PATH
where git >nul 2>nul
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
) else (
    :: Fallback to the default installation folder if not in PATH
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    ) else (
        echo ERROR: Git could not be located on your computer!
        echo Please ensure Git for Windows is installed.
        goto error_end
    )
)

:: Prompt for commit message
set "commit_message="
set /p commit_message="Enter commit message (press Enter for default 'update'): "

:: Default message if left empty
if "%commit_message%"=="" (
    set "commit_message=update"
)

echo.
echo [1/3] Staging changes (git add .)...
"%GIT_CMD%" add .
if %errorlevel% neq 0 (
    echo FAIL: Failed to stage changes.
    goto error_end
)

echo [2/3] Committing changes (git commit)...
"%GIT_CMD%" commit -m "%commit_message%"
if %errorlevel% neq 0 (
    echo NOTE: No new uncommitted changes detected locally. Proceeding to push existing commits...
)

echo [3/3] Pushing to GitHub (git push origin main)...
"%GIT_CMD%" push origin main
if %errorlevel% neq 0 (
    echo FAIL: Failed to push to remote repository.
    goto error_end
)

:: Check if RENDER_DEPLOY_HOOK_URL is defined in .env file
if exist ".env" (
    for /f "tokens=1,2 delims==" %%A in (.env) do (
        if "%%A"=="RENDER_DEPLOY_HOOK_URL" (
            set "RENDER_HOOK=%%B"
        )
    )
)

if defined RENDER_HOOK (
    echo.
    echo [RENDER DEPLOY] Triggering instant Render build via Deploy Hook...
    curl -s -X POST "%RENDER_HOOK%" >nul
    echo [RENDER DEPLOY] Deploy webhook signal dispatched to Render!
)

echo.
echo ====================================================
echo    SUCCESS: Code pushed to GitHub!
echo    Render will automatically build and deploy your app.
echo ====================================================
goto end

:error_end
echo.
echo ====================================================
echo    ERROR: Push sequence was not completed.
echo ====================================================

:end
echo.
pause
