@echo off
setlocal

:: Configuration
if "%REGISTRY%"=="" set REGISTRY=localhost
if "%VERSION%"=="" set VERSION=latest

echo ========================================
echo Angola Platform - Docker Push
echo ========================================
echo.
echo Registry: %REGISTRY%
echo Version:  %VERSION%
echo.

:: Login to registry
if not "%REGISTRY%"=="localhost" (
    echo Logging in to %REGISTRY%...
    docker login %REGISTRY%
    if errorlevel 1 goto :error
    echo.
)

:: Push jul-portal
echo ========================================
echo Pushing jul-portal
echo ========================================
docker push %REGISTRY%/angola/jul-portal:%VERSION%
if errorlevel 1 goto :error
docker push %REGISTRY%/angola/jul-portal:latest
if errorlevel 1 goto :error
echo.
echo [32m✓ Successfully pushed jul-portal[0m
echo.

:: Push lpco-cnca-app
echo ========================================
echo Pushing lpco-cnca-app
echo ========================================
docker push %REGISTRY%/angola/lpco-cnca-app:%VERSION%
if errorlevel 1 goto :error
docker push %REGISTRY%/angola/lpco-cnca-app:latest
if errorlevel 1 goto :error
echo.
echo [32m✓ Successfully pushed lpco-cnca-app[0m
echo.

:: Summary
echo ========================================
echo All images pushed successfully!
echo ========================================
echo.
echo Images available at:
echo   - %REGISTRY%/angola/jul-portal:%VERSION%
echo   - %REGISTRY%/angola/jul-portal:latest
echo   - %REGISTRY%/angola/lpco-cnca-app:%VERSION%
echo   - %REGISTRY%/angola/lpco-cnca-app:latest
goto :end

:error
echo.
echo [31mPush failed![0m
exit /b 1

:end
endlocal
