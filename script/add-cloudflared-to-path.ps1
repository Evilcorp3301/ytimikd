# Script to add cloudflared to PATH (Windows)
# Run: .\script\add-cloudflared-to-path.ps1

Write-Host "Searching for cloudflared.exe..." -ForegroundColor Cyan

# Check if already in PATH
try {
    $null = Get-Command cloudflared -ErrorAction Stop
    Write-Host "SUCCESS: cloudflared is already available in PATH!" -ForegroundColor Green
    cloudflared --version
    exit 0
} catch {
    Write-Host "cloudflared not found in PATH, searching system..." -ForegroundColor Yellow
}

# Search in WinGet Packages
$cloudflaredPath = $null
$winGetPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
if (Test-Path $winGetPath) {
    $found = Get-ChildItem $winGetPath -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $cloudflaredPath = $found.DirectoryName
        Write-Host "Found: $($found.FullName)" -ForegroundColor Green
    }
}

# Check common installation paths
if (-not $cloudflaredPath) {
    $commonPaths = @(
        "$env:ProgramFiles\Cloudflare\cloudflared.exe",
        "${env:ProgramFiles(x86)}\Cloudflare\cloudflared.exe"
    )
    
    foreach ($commonPath in $commonPaths) {
        if (Test-Path $commonPath) {
            $cloudflaredPath = Split-Path $commonPath
            Write-Host "Found: $commonPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $cloudflaredPath) {
    Write-Host "ERROR: cloudflared.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install cloudflared:" -ForegroundColor Yellow
    Write-Host "  winget install --id Cloudflare.cloudflared" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Adding path to PATH variable..." -ForegroundColor Cyan

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Check if already added
if ($currentPath -like "*$cloudflaredPath*") {
    Write-Host "SUCCESS: Path already added to PATH!" -ForegroundColor Green
} else {
    # Add path
    $newPath = "$currentPath;$cloudflaredPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "SUCCESS: Path added: $cloudflaredPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "IMPORTANT: Restart your terminal to apply changes!" -ForegroundColor Yellow
Write-Host ""
Write-Host "After restart, verify with:" -ForegroundColor Cyan
Write-Host "  cloudflared --version" -ForegroundColor White
