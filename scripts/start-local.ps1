param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

function Get-ListeningProcessIds($Port) {
    $connections = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Assert-CommandAvailable($CommandName, $InstallHint) {
    if ($null -eq (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName is not available. $InstallHint"
    }
}

Write-Host "Starting Beichen Agent local services" -ForegroundColor Cyan
Write-Host "Tip: run scripts/check-local.ps1 before starting."
Write-Host ""

Assert-CommandAvailable "python" "Install Python or add it to PATH."
Assert-CommandAvailable "npm" "Install Node.js / npm first."

$EnvPath = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvPath)) {
    throw "backend/.env is missing. Copy backend/.env.example to backend/.env first."
}

$BackendPids = Get-ListeningProcessIds $BackendPort
if ($BackendPids.Count -gt 0) {
    throw "Port $BackendPort is already in use. PID: $($BackendPids -join ', '). Run scripts/stop-local.ps1 first."
}

$FrontendPids = Get-ListeningProcessIds $FrontendPort
if ($FrontendPids.Count -gt 0) {
    throw "Port $FrontendPort is already in use. PID: $($FrontendPids -join ', '). Run scripts/stop-local.ps1 first."
}

$BackendCommand = "cd `"$BackendDir`"; python -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort --reload"
$FrontendCommand = "cd `"$FrontendDir`"; npm run dev -- --host 127.0.0.1 --port $FrontendPort --strictPort"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCommand -WorkingDirectory $BackendDir
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCommand -WorkingDirectory $FrontendDir

Write-Host ""
Write-Host "Start commands have been sent." -ForegroundColor Green
Write-Host "Open: http://127.0.0.1:$FrontendPort/"
Write-Host "Backend health: http://127.0.0.1:$BackendPort/health"
Write-Host ""
Write-Host "To stop services, run scripts/stop-local.ps1." -ForegroundColor Cyan
