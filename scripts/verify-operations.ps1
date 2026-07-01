Param(
  [switch]$SkipHttp,
  [switch]$CheckLocalResolver,
  [switch]$SkipVercel,
  [switch]$SkipGitHub,
  [switch]$SkipDiffCheck
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$failures = New-Object System.Collections.Generic.List[string]

function Write-Section {
  Param([string]$Name)
  Write-Host ""
  Write-Host "== $Name =="
}

function Add-Failure {
  Param([string]$Message)
  $failures.Add($Message) | Out-Null
  Write-Host "FAIL $Message" -ForegroundColor Red
}

function Add-Pass {
  Param([string]$Message)
  Write-Host "PASS $Message" -ForegroundColor Green
}

function Get-PowerShellExe {
  $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($null -ne $pwsh) {
    return $pwsh.Source
  }

  $powershell = Get-Command powershell -ErrorAction SilentlyContinue
  if ($null -ne $powershell) {
    return $powershell.Source
  }

  throw "No PowerShell executable found for child verifier processes."
}

function Invoke-CheckScript {
  Param(
    [string]$Name,
    [string]$Path,
    [string[]]$Arguments = @()
  )

  Write-Section $Name
  $powershellExe = Get-PowerShellExe
  & $powershellExe -NoProfile -ExecutionPolicy Bypass -File $Path @Arguments
  if ($LASTEXITCODE -ne 0) {
    Add-Failure "$Name failed"
  } else {
    Add-Pass "$Name passed"
  }
}

if (-not $SkipVercel) {
  $vercelArgs = @()
  if ($SkipHttp) {
    $vercelArgs += "-SkipHttp"
  }
  if ($CheckLocalResolver) {
    $vercelArgs += "-CheckLocalResolver"
  }

  Invoke-CheckScript `
    -Name "Vercel Domain Verification" `
    -Path (Join-Path $PSScriptRoot "verify-vercel-branch-domains.ps1") `
    -Arguments $vercelArgs

  Invoke-CheckScript `
    -Name "Vercel Branch Deployment Dry Run" `
    -Path (Join-Path $PSScriptRoot "repair-vercel-branch-deployments.ps1")
}

if (-not $SkipGitHub) {
  Invoke-CheckScript `
    -Name "GitHub Branch Governance Verification" `
    -Path (Join-Path $PSScriptRoot "verify-github-branch-governance.ps1")
}

if (-not $SkipDiffCheck) {
  Write-Section "Git Diff Whitespace Check"
  & git -C $repoRoot diff --check
  if ($LASTEXITCODE -ne 0) {
    Add-Failure "git diff --check failed"
  } else {
    Add-Pass "git diff --check passed"
  }
}

Write-Section "Workspace Status"
& git -C $repoRoot status --short --branch | Out-Host
if ($LASTEXITCODE -ne 0) {
  Add-Failure "git status failed"
}

Write-Section "Result"
if ($failures.Count -gt 0) {
  Write-Host "Operations verification failed with $($failures.Count) issue(s)." -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Operations verification passed." -ForegroundColor Green
