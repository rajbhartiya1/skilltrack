$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$tokenFile = Join-Path $PSScriptRoot ".autopush-token"

Set-Location $projectRoot

$token = [guid]::NewGuid().ToString()
Set-Content -Path $tokenFile -Value $token

Write-Host ""
Write-Host "Auto-update: waiting 10 seconds..." -ForegroundColor Cyan

Start-Sleep -Seconds 10

$currentToken = Get-Content -Path $tokenFile -ErrorAction SilentlyContinue

if ($currentToken -ne $token) {
    Write-Host "Newer save detected. Cancelled." -ForegroundColor Yellow
    exit 0
}

$status = git status --porcelain

if (-not $status) {
    Write-Host "No changes to push." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Changes detected. Updating GitHub..." -ForegroundColor Green

git add .

git commit -m "Auto update"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed." -ForegroundColor Red
    exit 1
}

git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: GitHub updated. Vercel will deploy automatically." -ForegroundColor Green