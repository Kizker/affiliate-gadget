@echo off
TITLE Affiliate Gadget - Admin Setup
echo ==========================================
echo   JALANKAN FILE INI SEBAGAI ADMINISTRATOR
echo   (Klik kanan -> Run as administrator)
echo ==========================================
echo.

REM === Install Git ===
echo [1/2] Installing Git 2.55.0...
set GIT_INSTALLER=C:\Users\USER\AppData\Local\Temp\WinGet\Git.Git.2.55.0.3\Git-2.55.0.3-64-bit.exe
if exist "%GIT_INSTALLER%" (
    echo Found Git installer in cache...
    "%GIT_INSTALLER%" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /SUPPRESSMSGBOXES
    echo Git installed!
) else (
    echo Downloading Git via winget...
    winget install Git.Git --accept-package-agreements --accept-source-agreements --silent
)

REM === Install Docker Desktop ===
echo.
echo [2/2] Installing Docker Desktop...
set DOCKER_EXE=C:\Users\USER\AppData\Local\Temp\WinGet\Docker.DockerDesktop.4.89.0\Docker%%20Desktop%%20Installer.exe
if exist "%DOCKER_EXE%" (
    echo Found Docker installer in cache...
    "%DOCKER_EXE%" install --quiet --accept-license
) else (
    echo Downloading Docker Desktop via winget...
    winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements --silent
)
:docker_done

echo.
echo ==========================================
echo   SELESAI! Langkah selanjutnya:
echo.
echo   1. Restart komputer atau buka terminal baru
echo   2. Buka Docker Desktop dan tunggu sampai running
echo   3. Di terminal project, jalankan:
echo.
echo      docker-compose up -d
echo      pnpm run db:push
echo      pnpm seed (opsional)  
echo      pnpm dev
echo ==========================================
pause
