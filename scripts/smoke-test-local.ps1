param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173,
    [int]$TimeoutSec = 60,
    [switch]$SkipAiCalls
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $ProjectRoot "backend"
$EnvPath = Join-Path $BackendDir ".env"
$BackendBaseUrl = "http://127.0.0.1:$BackendPort"
$FrontendBaseUrl = "http://127.0.0.1:$FrontendPort"

$script:AccessHeaderName = "X-Beichen-Access"
$script:AccessCode = ""
$script:RequestHeaders = @{}
$script:TestFileId = $null
$script:TestSessionId = $null
$script:Failures = New-Object System.Collections.Generic.List[string]

function Write-Step($Message) {
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Ok($Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn($Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail($Message) {
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures.Add($Message) | Out-Null
}

function Get-EnvValue($Name) {
    if (-not (Test-Path $EnvPath)) {
        return ""
    }

    $line = Get-Content $EnvPath |
        Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=" } |
        Select-Object -Last 1

    if (-not $line) {
        return ""
    }

    return (($line -split "=", 2)[1]).Trim().Trim('"').Trim("'")
}

function Initialize-AccessHeaders {
    $headerName = Get-EnvValue "APP_ACCESS_HEADER"
    if ($headerName) {
        $script:AccessHeaderName = $headerName
    }

    $inviteCodes = Get-EnvValue "APP_INVITE_CODES"
    if ($inviteCodes) {
        $firstCode = ($inviteCodes -split "," |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ -match "^\d{6}$" } |
            Select-Object -First 1)
        if ($firstCode) {
            $script:AccessCode = $firstCode
        }
    }

    if (-not $script:AccessCode) {
        $legacyPassword = Get-EnvValue "APP_ACCESS_PASSWORD"
        if ($legacyPassword) {
            $script:AccessCode = $legacyPassword
        }
    }

    if ($script:AccessCode) {
        $script:RequestHeaders = @{ $script:AccessHeaderName = $script:AccessCode }
        Write-Ok "Access header is configured for smoke test. The code is not printed."
    } else {
        Write-Warn "No access code found in backend/.env. Smoke test will call API without access header."
    }
}

function Invoke-JsonRequest($Method, $Url, $Body = $null, $Headers = $script:RequestHeaders) {
    $params = @{
        Method = $Method
        Uri = $Url
        TimeoutSec = $TimeoutSec
    }
    if ($Headers -and $Headers.Count -gt 0) {
        $params.Headers = $Headers
    }
    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 12)
    }

    return Invoke-RestMethod @params
}

function Assert-ApiOk($Response, $Name) {
    if ($null -eq $Response -or $Response.code -ne 0) {
        throw "$Name returned non-ok API envelope."
    }
}

function Test-PortListening($Port, $Name) {
    $pattern = "127.0.0.1:$Port"
    $listeners = netstat -ano | Select-String $pattern | Select-String "LISTENING"
    if ($listeners) {
        Write-Ok "$Name is listening on port $Port"
        return $true
    }

    Write-Fail "$Name is not listening on port $Port"
    return $false
}

function Test-Frontend {
    Write-Step "Frontend"
    try {
        $response = Invoke-WebRequest -Uri "$FrontendBaseUrl/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Ok "Frontend returned 200 OK"
        } else {
            Write-Fail "Frontend returned unexpected status $($response.StatusCode)"
        }
    } catch {
        Write-Fail "Frontend is not reachable: $($_.Exception.Message)"
    }
}

function Test-Health {
    Write-Step "Backend health and config"
    try {
        $health = Invoke-WebRequest -Uri "$BackendBaseUrl/health" -UseBasicParsing -TimeoutSec 5
        if ($health.StatusCode -eq 200 -and $health.Headers["X-Request-Id"]) {
            Write-Ok "/health returned 200 and X-Request-Id"
        } else {
            Write-Fail "/health did not return expected status or request id"
        }

        $configResponse = Invoke-WebRequest -Uri "$BackendBaseUrl/health/config" -UseBasicParsing -TimeoutSec 5
        $config = $configResponse.Content | ConvertFrom-Json
        if ($configResponse.Headers["X-Request-Id"] -and $config.embedding_model -and $config.access_control.mode) {
            Write-Ok "/health/config returned runtime config and X-Request-Id"
            Write-Host "     llm_model: $($config.llm_model)"
            Write-Host "     embedding_model: $($config.embedding_model)"
            Write-Host "     embedding_dimension: $($config.embedding_dimension)"
            Write-Host "     access_control.mode: $($config.access_control.mode)"
        } else {
            Write-Fail "/health/config is missing runtime config or request id"
        }
    } catch {
        Write-Fail "Backend health/config check failed: $($_.Exception.Message)"
    }
}

function Test-AccessControl {
    Write-Step "Invite code protection"
    try {
        $config = Invoke-RestMethod -Uri "$BackendBaseUrl/health/config" -TimeoutSec 5
        try {
            Invoke-RestMethod -Uri "$BackendBaseUrl/api/v1/files" -TimeoutSec 5 | Out-Null
            if ($config.access_control.enabled) {
                Write-Fail "Protected API accepted a request without access header"
            } else {
                Write-Ok "Access control disabled for local development; unauthenticated API call is allowed"
            }
        } catch {
            if ($config.access_control.enabled -and $_.Exception.Response.StatusCode.value__ -eq 401) {
                Write-Ok "Protected API rejects request without invite code"
            } else {
                throw
            }
        }

        $files = Invoke-JsonRequest "GET" "$BackendBaseUrl/api/v1/files"
        Assert-ApiOk $files "Authenticated file list"
        Write-Ok "Protected API accepts configured access header"
    } catch {
        Write-Fail "Invite code protection check failed: $($_.Exception.Message)"
    }
}

function Test-Chat {
    Write-Step "Normal chat"
    if ($SkipAiCalls) {
        Write-Warn "Skipping normal chat because -SkipAiCalls was provided"
        return
    }

    try {
        $session = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/chat/sessions" @{ title = "Smoke Test"; mode = "chat" }
        Assert-ApiOk $session "Create chat session"
        $script:TestSessionId = $session.data.id

        $chat = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/chat" @{
            message = "Reply in one short sentence: Beichen Agent smoke test is healthy."
            session_id = $script:TestSessionId
        }
        Assert-ApiOk $chat "Normal chat"
        if ($chat.data.answer) {
            Write-Ok "Normal chat returned an assistant answer"
        } else {
            Write-Fail "Normal chat returned empty answer"
        }
    } catch {
        Write-Fail "Normal chat check failed: $($_.Exception.Message)"
    }
}

function Test-FileAndRag {
    Write-Step "File ingestion and RAG"
    try {
        $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "beichen-smoke-test.txt"
        Set-Content -LiteralPath $tempFile -Encoding UTF8 -Value @"
Beichen Agent smoke test document.
This document validates upload, parsing, chunking, embedding, vector-store indexing, and single-file RAG question answering.
The current project goal is an independent web AI assistant MVP.
"@

        $curlArgs = @(
            "-s",
            "-X", "POST",
            "$BackendBaseUrl/api/v1/files",
            "-F", "file=@$tempFile;type=text/plain"
        )
        if ($script:AccessCode) {
            $curlArgs = @("-H", "$($script:AccessHeaderName): $($script:AccessCode)") + $curlArgs
        }

        $uploadJson = & curl.exe @curlArgs
        $upload = $uploadJson | ConvertFrom-Json
        Assert-ApiOk $upload "Upload file"
        $script:TestFileId = $upload.data.id
        $extension = $upload.data.extension
        Write-Ok "File upload returned file_id and extension"

        $parsed = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/files/$script:TestFileId/parse" @{ extension = $extension }
        Assert-ApiOk $parsed "Parse file"
        if ($parsed.data.char_count -gt 0) {
            Write-Ok "Document parse returned char_count"
        } else {
            Write-Fail "Document parse returned empty char_count"
        }

        $chunks = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/files/$script:TestFileId/chunks" @{ extension = $extension }
        Assert-ApiOk $chunks "Chunk file"
        if ($chunks.data.chunk_count -gt 0) {
            Write-Ok "Chunk service returned chunks"
        } else {
            Write-Fail "Chunk service returned no chunks"
        }

        $embeddings = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/files/$script:TestFileId/embeddings" @{ extension = $extension }
        Assert-ApiOk $embeddings "Embed file"
        if ($embeddings.data.embedding_count -gt 0 -and $embeddings.data.embedding_dimension -gt 0) {
            Write-Ok "Embedding service returned embedding summary"
        } else {
            Write-Fail "Embedding service returned invalid summary"
        }

        $vectors = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/files/$script:TestFileId/vector-store" @{ extension = $extension }
        Assert-ApiOk $vectors "Vector store"
        if ($vectors.data.embedding_count -gt 0 -and $vectors.data.storage_path) {
            Write-Ok "Vector store saved local index"
        } else {
            Write-Fail "Vector store summary is incomplete"
        }

        if ($SkipAiCalls) {
            Write-Warn "Skipping RAG answer because -SkipAiCalls was provided"
            return
        }

        $rag = Invoke-JsonRequest "POST" "$BackendBaseUrl/api/v1/files/$script:TestFileId/ask" @{
            query = "What does this smoke test document validate?"
            top_k = 3
            session_id = $script:TestSessionId
        }
        Assert-ApiOk $rag "RAG ask"
        if ($rag.data.answer -and $rag.data.used_chunk_count -gt 0) {
            Write-Ok "RAG returned answer and used chunks"
        } else {
            Write-Fail "RAG response is missing answer or used chunks"
        }
    } catch {
        Write-Fail "File/RAG check failed: $($_.Exception.Message)"
    }
}

function Cleanup-SmokeData {
    Write-Step "Cleanup"
    if ($script:TestFileId) {
        try {
            $deleteFile = Invoke-JsonRequest "DELETE" "$BackendBaseUrl/api/v1/files/$script:TestFileId"
            Assert-ApiOk $deleteFile "Delete smoke file"
            Write-Ok "Smoke test file deleted through API"
        } catch {
            Write-Warn "Failed to delete smoke test file: $($_.Exception.Message)"
        }
    }

    if ($script:TestSessionId) {
        try {
            $deleteSession = Invoke-JsonRequest "DELETE" "$BackendBaseUrl/api/v1/chat/sessions/$script:TestSessionId"
            Assert-ApiOk $deleteSession "Delete smoke session"
            Write-Ok "Smoke test session deleted through API"
        } catch {
            Write-Warn "Failed to delete smoke test session: $($_.Exception.Message)"
        }
    }
}

Write-Host "Beichen Agent local smoke test" -ForegroundColor Cyan
Write-Host "Backend: $BackendBaseUrl"
Write-Host "Frontend: $FrontendBaseUrl"
Write-Host ""

Initialize-AccessHeaders

Write-Step "Ports"
$backendListening = Test-PortListening $BackendPort "Backend"
$frontendListening = Test-PortListening $FrontendPort "Frontend"

if ($backendListening) {
    Test-Health
    Test-AccessControl
    Test-Chat
    Test-FileAndRag
    Cleanup-SmokeData
}

if ($frontendListening) {
    Test-Frontend
}

Write-Host ""
if ($script:Failures.Count -gt 0) {
    Write-Host "Smoke test failed with $($script:Failures.Count) issue(s):" -ForegroundColor Red
    foreach ($failure in $script:Failures) {
        Write-Host " - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Smoke test passed." -ForegroundColor Green
