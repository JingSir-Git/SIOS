@echo off
REM SIOS One-Click Deploy (Windows)
REM Requires: Git Bash or WSL

where bash >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] bash not found. Install Git Bash or WSL.
    pause
    exit /b 1
)

bash "%~dp0deploy.sh"
pause
