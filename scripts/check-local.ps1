param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail($Message) {
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Test-CommandAvailable($CommandName) {
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Get-ListeningProcessIds($Port) {
    $connections = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

Write-Host "Beichen Agent local environment check" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"
Write-Host ""

if (Test-CommandAvailable "python") {
    Write-Ok "Python is available"
} else {
    Write-Fail "Python is not available. Install Python or add it to PATH."
}

if (Test-CommandAvailable "node") {
    Write-Ok "Node.js is available"
} else {
    Write-Fail "Node.js is not available. Install Node.js first."
}

if (Test-CommandAvailable "npm") {
    Write-Ok "npm is available"
} else {
    Write-Fail "npm is not available. Install Node.js / npm first."
}

$EnvPath = Join-Path $BackendDir ".env"
if (Test-Path $EnvPath) {
    Write-Ok "backend/.env exists"
} else {
    Write-Warn "backend/.env is missing. Copy backend/.env.example to backend/.env and fill config."
}

$RequirementsPath = Join-Path $BackendDir "requirements.txt"
if (Test-Path $RequirementsPath) {
    Write-Ok "backend/requirements.txt exists"
} else {
    Write-Fail "backend/requirements.txt is missing"
}

$PackageJsonPath = Join-Path $FrontendDir "package.json"
if (Test-Path $PackageJsonPath) {
    Write-Ok "frontend/package.json exists"
} else {
    Write-Fail "frontend/package.json is missing"
}

$BackendPids = Get-ListeningProcessIds $BackendPort
if ($BackendPids.Count -gt 0) {
    Write-Warn "Port $BackendPort is already in use. PID: $($BackendPids -join ', ')"
} else {
    Write-Ok "Port $BackendPort is free"
}

$FrontendPids = Get-ListeningProcessIds $FrontendPort
if ($FrontendPids.Count -gt 0) {
    Write-Warn "Port $FrontendPort is already in use. PID: $($FrontendPids -join ', ')"
} else {
    Write-Ok "Port $FrontendPort is free"
}

Write-Host ""
Write-Host "Check complete. If a port is in use, run scripts/stop-local.ps1 before starting." -ForegroundColor Cyan
