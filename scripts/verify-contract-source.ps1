Param(
  [string]$ContractId = "CDMUOHMARNVOJZM3IVOCJUPGBHDTHFBMZCCZXEZPQDVJGILH3NIKTTW3",
  [string]$ExpectedHash = "59ca403e347f4c24b1dd16fbcb65662c2837cc852946e3ae88374eed509d6f7f",
  [string]$RpcUrl = "https://soroban-testnet.stellar.org",
  [string]$NetworkPassphrase = "Test SDF Network ; September 2015",
  [string]$SourceRepo = "github:Iron-Mark/Hackathon-Stellaroid_Earn",
  [string]$HomeDomain = "stellaroid.tech",
  [switch]$RequireSourceMatch
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$stellar = Get-Command stellar -ErrorAction SilentlyContinue
if ($null -eq $stellar) {
  $localStellar = Join-Path $env:USERPROFILE ".local\bin\stellar.exe"
  if (Test-Path $localStellar) {
    $stellarPath = $localStellar
  } else {
    throw "Stellar CLI was not found on PATH. Install it from https://developers.stellar.org/docs/tools/cli/install-cli."
  }
} else {
  $stellarPath = $stellar.Source
}

function Write-Section {
  Param([string]$Name)
  Write-Host ""
  Write-Host "== $Name =="
}

function Get-Sha256 {
  Param([string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Invoke-NativeCommand {
  Param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$StdoutPath,
    [string]$StderrPath,
    [string]$WorkingDirectory = ""
  )

  $quotedArguments = foreach ($argument in $Arguments) {
    if ($argument -match '[\s"]') {
      '"' + ($argument -replace '"', '\"') + '"'
    } else {
      $argument
    }
  }

  $startProcessArgs = @{
    FilePath = $FilePath
    ArgumentList = ($quotedArguments -join " ")
    RedirectStandardOutput = $StdoutPath
    RedirectStandardError = $StderrPath
    Wait = $true
    PassThru = $true
    NoNewWindow = $true
  }

  if ($WorkingDirectory -ne "") {
    $startProcessArgs.WorkingDirectory = $WorkingDirectory
  }

  $process = Start-Process @startProcessArgs
  return $process.ExitCode
}

$auditRoot = Join-Path $env:TEMP "stellaroid-contract-audit"
$deployedWasm = Join-Path $auditRoot "deployed.wasm"
$buildOut = Join-Path $auditRoot "current-source-build"
Remove-Item -LiteralPath $auditRoot -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $auditRoot, $buildOut | Out-Null

Write-Section "Tooling"
& $stellarPath --version

Write-Section "Fetch Deployed WASM"
& $stellarPath contract fetch `
  --id $ContractId `
  --rpc-url $RpcUrl `
  --network-passphrase $NetworkPassphrase `
  --out-file $deployedWasm

$deployedHash = Get-Sha256 $deployedWasm
Write-Host "Contract: $ContractId"
Write-Host "Deployed hash: $deployedHash"
Write-Host "Expected hash: $ExpectedHash"

if ($deployedHash -ne $ExpectedHash.ToLowerInvariant()) {
  throw "Fetched deployed hash does not match the expected hash."
}

Write-Section "Deployed Metadata"
$metaOut = Join-Path $auditRoot "meta.out.log"
$metaErr = Join-Path $auditRoot "meta.err.log"
$metaExit = Invoke-NativeCommand `
  -FilePath $stellarPath `
  -Arguments @("contract", "info", "meta", "--wasm", $deployedWasm) `
  -StdoutPath $metaOut `
  -StderrPath $metaErr
Get-Content -Encoding UTF8 $metaOut | Out-Host
if ($metaExit -ne 0) {
  Get-Content -Encoding UTF8 $metaErr | Out-Host
  throw "Unable to read deployed WASM metadata."
}

Write-Section "Build Attestation Lookup"
$buildInfoOut = Join-Path $auditRoot "build-info.out.log"
$buildInfoErr = Join-Path $auditRoot "build-info.err.log"
$buildInfoExit = Invoke-NativeCommand `
  -FilePath $stellarPath `
  -Arguments @("contract", "info", "build", "--wasm", $deployedWasm) `
  -StdoutPath $buildInfoOut `
  -StderrPath $buildInfoErr
if ($buildInfoExit -ne 0) {
  Write-Host "Build-attestation lookup did not complete for the deployed WASM." -ForegroundColor Yellow
  Select-String -Path $buildInfoOut, $buildInfoErr -Pattern "source_repo|Wasm Hash|error:" | ForEach-Object {
    Write-Host $_.Line
  }
} else {
  Get-Content $buildInfoOut | Out-Host
}

Write-Section "Build Current Source"
$sourceBuildOut = Join-Path $auditRoot "current-source-build.out.log"
$sourceBuildErr = Join-Path $auditRoot "current-source-build.err.log"
$sourceBuildExit = Invoke-NativeCommand `
  -FilePath $stellarPath `
  -Arguments @(
    "contract", "build",
    "--manifest-path", ".\contract\Cargo.toml",
    "--locked",
    "--meta", "source_repo=$SourceRepo",
    "--meta", "home_domain=$HomeDomain",
    "--out-dir", $buildOut
  ) `
  -StdoutPath $sourceBuildOut `
  -StderrPath $sourceBuildErr `
  -WorkingDirectory $repoRoot
if ($sourceBuildExit -ne 0) {
  Get-Content $sourceBuildOut, $sourceBuildErr | Out-Host
  throw "Current source build failed."
}

$currentWasm = Get-ChildItem -LiteralPath $buildOut -Filter "*.wasm" | Select-Object -First 1
if ($null -eq $currentWasm) {
  throw "Current source build did not produce a WASM artifact."
}

$currentHash = Get-Sha256 $currentWasm.FullName
Write-Host "Current source hash: $currentHash"

Write-Section "Verdict"
if ($currentHash -eq $deployedHash) {
  Write-Host "PASS current source reproduces the deployed WASM hash." -ForegroundColor Green
  exit 0
}

Write-Host "WARN current source does not reproduce the deployed WASM hash." -ForegroundColor Yellow
Write-Host "The deployed contract is active and fetchable, but this source tree is not a source-verification match for the deployed bytecode." -ForegroundColor Yellow

if ($RequireSourceMatch) {
  exit 1
}

exit 0
