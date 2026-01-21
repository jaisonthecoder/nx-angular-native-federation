@echo off
setlocal

:: Configuration
if "%REGISTRY%"=="" set REGISTRY=localhost
if "%VERSION%"=="" set VERSION=latest

:: Get build date and git commit
for /f "tokens=*" %%i in ('powershell -Command "Get-Date -Format yyyy-MM-ddTHH:mm:ssZ"') do set BUILD_DATE=%%i
for /f "tokens=*" %%i in ('git rev-parse --short HEAD 2^>nul') do set VCS_REF=%%i
if "%VCS_REF%"=="" set VCS_REF=unknown

echo ========================================
echo Angola Platform - Docker Build
echo ========================================
echo.
echo Registry:   %REGISTRY%
echo Version:    %VERSION%
echo Build Date: %BUILD_DATE%
echo Git Commit: %VCS_REF%
echo.

:: Build Shell App
echo ========================================
echo Building Shell Application - jul-portal
echo ========================================
docker build -f docker/shell-apps/jul-portal/Dockerfile -t %REGISTRY%/angola/jul-portal:%VERSION% -t %REGISTRY%/angola/jul-portal:latest --build-arg BUILD_DATE="%BUILD_DATE%" --build-arg VCS_REF="%VCS_REF%" --build-arg VERSION="%VERSION%" .
if errorlevel 1 goto :error
echo.
echo [32m✓ Successfully built jul-portal[0m
echo.

:: Build Micro-App - lpco-cnca-app
echo ========================================
echo Building Micro Application - lpco-cnca-app
echo ========================================
docker build -f docker/micro-apps/lpco-cnca-app/Dockerfile -t %REGISTRY%/angola/lpco-cnca-app:%VERSION% -t %REGISTRY%/angola/lpco-cnca-app:latest --build-arg BUILD_DATE="%BUILD_DATE%" --build-arg VCS_REF="%VCS_REF%" --build-arg VERSION="%VERSION%" .
if errorlevel 1 goto :error
echo.
echo [32m✓ Successfully built lpco-cnca-app[0m
echo.

:: Summary
echo ========================================
echo Build Summary
echo ========================================
docker images | findstr "angola/"
echo.
echo [32mAll images built successfully![0m
echo.
echo Next steps:
echo   1. Test locally: docker-compose up
echo   2. Push to registry: scripts\docker-push.bat
goto :end

:error
echo.
echo [31mBuild failed![0m
exit /b 1

:end
endlocal
