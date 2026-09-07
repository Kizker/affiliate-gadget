# ============================================================
# AFFILIATE GADGET - COMPLETE ADMIN SETUP SCRIPT
# Jalankan di PowerShell sebagai ADMINISTRATOR
# Klik kanan PowerShell -> "Run as Administrator"
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AFFILIATE GADGET - ADMIN SETUP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# --- STEP 1: Enable WSL2 & Virtual Machine Platform ---
Write-Host "[1/5] Enabling WSL2 & Virtual Machine Platform..." -ForegroundColor Yellow
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart 2>&1 | Out-Null
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart 2>&1 | Out-Null
Write-Host "  -> WSL2 features enabled (atau sudah aktif)" -ForegroundColor Green

# --- STEP 2: Install Git ---
Write-Host ""
Write-Host "[2/5] Installing Git 2.55.0..." -ForegroundColor Yellow
$gitExe = "C:\Users\USER\AppData\Local\Temp\WinGet\Git.Git.2.55.0.3\Git-2.55.0.3-64-bit.exe"
if (Test-Path $gitExe) {
    Write-Host "  -> Found Git installer in cache..." -ForegroundColor Green
    $proc = Start-Process -FilePath $gitExe -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /SUPPRESSMSGBOXES /COMPONENTS=icons,ext\reg\shellhere,assoc,assoc_sh" -Wait -PassThru
    if ($proc.ExitCode -eq 0) {
        Write-Host "  -> Git installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  -> Git install exit code: $($proc.ExitCode) - trying winget..." -ForegroundColor Red
        winget install Git.Git --accept-package-agreements --accept-source-agreements --silent
    }
} else {
    Write-Host "  -> Downloading Git via winget..." -ForegroundColor Yellow
    winget install Git.Git --accept-package-agreements --accept-source-agreements --silent
}

# --- STEP 3: Install Docker Desktop ---
Write-Host ""
Write-Host "[3/5] Installing Docker Desktop 4.89.0..." -ForegroundColor Yellow
$dockerExe = "C:\Users\USER\AppData\Local\Temp\WinGet\Docker.DockerDesktop.4.89.0\Docker%20Desktop%20Installer.exe"
if (Test-Path $dockerExe) {
    Write-Host "  -> Found Docker installer in cache (595 MB)..." -ForegroundColor Green
    $proc = Start-Process -FilePath $dockerExe -ArgumentList "install --quiet --accept-license --backend=wsl-2" -Wait -PassThru
    Write-Host "  -> Docker installer exit code: $($proc.ExitCode)" -ForegroundColor Green
} else {
    Write-Host "  -> Downloading Docker Desktop via winget..." -ForegroundColor Yellow
    winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements --silent
}

# --- STEP 4: Refresh PATH ---
Write-Host ""
Write-Host "[4/5] Refreshing PATH..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
git --version 2>&1 | ForEach-Object { Write-Host "  -> Git: $_" -ForegroundColor Green }

# --- STEP 5: Husky setup ---
Write-Host ""
Write-Host "[5/5] Setting up Husky git hooks..." -ForegroundColor Yellow
Set-Location "C:\Users\USER\.gemini\antigravity\scratch\affiliate-gadget"
& pnpm run prepare 2>&1 | ForEach-Object { Write-Host "  -> $_" }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SETUP SELESAI!" -ForegroundColor Green
Write-Host ""
Write-Host "   LANGKAH SELANJUTNYA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   1. RESTART komputer (untuk apply WSL2)" -ForegroundColor White
Write-Host "   2. Buka Docker Desktop dan tunggu sampai RUNNING" -ForegroundColor White
Write-Host "   3. Buka terminal baru di project folder:" -ForegroundColor White
Write-Host "      C:\Users\USER\.gemini\antigravity\scratch\affiliate-gadget" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Jalankan perintah berikut satu per satu:" -ForegroundColor White
Write-Host "      docker-compose up -d" -ForegroundColor Yellow
Write-Host "      pnpm run db:push" -ForegroundColor Yellow
Write-Host "      pnpm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   5. Buka browser: http://localhost:3002" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Tekan ENTER untuk keluar"
