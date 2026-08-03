param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Continue"

function Get-ListeningPortDetails($Port) {
    $connections = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return @(
        $connections |
            Select-Object -ExpandProperty OwningProcess -Unique |
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

function Stop-PortProcess($Port) {
    $details = Get-ListeningPortDetails $Port
    if ($details.Count -eq 0) {
        Write-Host "[OK] Port $Port has no LISTENING process. TIME_WAIT entries are ignored." -ForegroundColor Green
        return
    }

    foreach ($detail in $details) {
        Write-Host "[STOP] Port $Port -> PID $($detail.PID) ($($detail.ProcessName))" -ForegroundColor Yellow
        try {
            Stop-Process -Id $detail.PID -Force -ErrorAction Stop
        } catch {
            Write-Host "[WARN] Failed to stop PID $($detail.PID): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    Start-Sleep -Seconds 1
    $remaining = Get-ListeningPortDetails $Port
    if ($remaining.Count -eq 0) {
        Write-Host "[OK] Port $Port released" -ForegroundColor Green
        return
    }

    Write-Host "[WARN] Port $Port still has LISTENING process(es):" -ForegroundColor Yellow
    foreach ($detail in $remaining) {
        Write-Host "       PID $($detail.PID) ($($detail.ProcessName))" -ForegroundColor Yellow
    }
}

Write-Host "Stopping Beichen Agent local services" -ForegroundColor Cyan
Write-Host "Only LISTENING processes on fixed ports will be stopped. TIME_WAIT is ignored."
Write-Host ""

Stop-PortProcess $BackendPort
Stop-PortProcess $FrontendPort

Write-Host ""
Write-Host "Stop flow complete. To start again, run scripts/start-local.ps1." -ForegroundColor Cyan
