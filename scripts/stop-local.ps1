param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Continue"

function Get-ListeningProcessIds($Port) {
    $connections = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

function Stop-PortProcess($Port) {
    $processIds = Get-ListeningProcessIds $Port
    if ($processIds.Count -eq 0) {
        Write-Host "[OK] Port $Port has no listening process" -ForegroundColor Green
        return
    }

    foreach ($processId in $processIds) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Write-Host "[STOP] Port $Port -> PID $processId ($($process.ProcessName))" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force
        } catch {
            Write-Host "[WARN] Failed to stop PID $processId`: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "Stopping Beichen Agent local services" -ForegroundColor Cyan
Write-Host "Only processes listening on fixed ports will be stopped."
Write-Host ""

Stop-PortProcess $BackendPort
Stop-PortProcess $FrontendPort

Write-Host ""
Write-Host "Stop flow complete. To start again, run scripts/start-local.ps1." -ForegroundColor Cyan
