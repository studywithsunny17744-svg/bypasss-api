@echo off
cd /d "%~dp0"
title Git Push Tool
cls
echo ====================================================
echo               GIT AUTO-PUSH UTILITY
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
    echo FAIL: Commit failed (perhaps no changes were modified).
    goto error_end
)

echo [3/3] Pushing to GitHub (git push origin main)...
"%GIT_CMD%" push origin main
if %errorlevel% neq 0 (
    echo FAIL: Failed to push to remote repository.
    goto error_end
)

echo.
echo ====================================================
echo    SUCCESS: Code successfully pushed to GitHub!
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
