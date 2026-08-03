param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

function Get-ListeningPortDetails($Port) {
    $pattern = "127.0.0.1:$Port"
    $connections = netstat -ano | Select-String $pattern | Select-String "LISTENING"
    return @(
        $connections |
            ForEach-Object { ($_ -split "\s+")[-1] } |
            Sort-Object -Unique |
            ForEach-Object {
                $processId = $_
                $processName = "unknown"
                try {
                    $process = Get-Process -Id $processId -ErrorAction Stop
                    $processName = $process.ProcessName
                } catch {
                    $processName = "access-denied-or-exited"
                }

                [PSCustomObject]@{
                    Port = $Port
                    PID = $processId
                    ProcessName = $processName
                }
            }
    )
}

function Assert-PortFree($Port) {
    $details = Get-ListeningPortDetails $Port
    if ($details.Count -eq 0) {
        return
    }

    $owners = ($details | ForEach-Object { "PID $($_.PID) ($($_.ProcessName))" }) -join ", "
    throw "Port $Port is already in use by LISTENING process(es): $owners. Run scripts/stop-local.ps1 first."
}

function Assert-CommandAvailable($CommandName, $InstallHint) {
    if ($null -eq (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName is not available. $InstallHint"
    }
}

function Write-BackendConfigSummary($Port) {
    $url = "http://127.0.0.1:$Port/health/config"
    try {
        $config = Invoke-RestMethod -Uri $url -TimeoutSec 5
        Write-Host ""
        Write-Host "Backend runtime config:" -ForegroundColor Cyan
        Write-Host "  llm_model: $($config.llm_model)"
        Write-Host "  embedding_model: $($config.embedding_model)"
        Write-Host "  embedding_dimension: $($config.embedding_dimension)"
        Write-Host "  access_control.mode: $($config.access_control.mode)"
    } catch {
        Write-Host ""
        Write-Host "[WARN] Backend started, but /health/config is not available yet: $($_.Exception.Message)" -ForegroundColor Yellow
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

Assert-PortFree $BackendPort
Assert-PortFree $FrontendPort

$BackendCommand = "cd `"$BackendDir`"; python -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort"
$FrontendCommand = "cd `"$FrontendDir`"; npm run dev -- --host 127.0.0.1 --port $FrontendPort --strictPort"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCommand -WorkingDirectory $BackendDir
Start-Sleep -Seconds 3
Write-BackendConfigSummary $BackendPort
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCommand -WorkingDirectory $FrontendDir

Write-Host ""
Write-Host "Start commands have been sent." -ForegroundColor Green
Write-Host "Open: http://127.0.0.1:$FrontendPort/"
Write-Host "Backend health: http://127.0.0.1:$BackendPort/health"
Write-Host "Backend config: http://127.0.0.1:$BackendPort/health/config"
Write-Host ""
Write-Host "To stop services, run scripts/stop-local.ps1." -ForegroundColor Cyan
