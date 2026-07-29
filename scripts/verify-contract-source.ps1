# Verifies that the deployed testnet contract is reproducible from committed
# source.
#
# The deployed bytecode corresponds to a RELEASE TAG, not to the moving default
# branch, so by default this rebuilds $Ref (the tag that was actually deployed)
# in a temporary git worktree. Pass -Ref HEAD to check the current tree instead,
# but expect a mismatch whenever the toolchain or contract path has moved since
# the deploy: that is drift in the source tree, not a problem with the contract.
Param(
  [string]$ContractId = "CAD6C24POQGRYXMBNBEGVDHUROF5ZC37XRDC6NCVILTXWMYJIBMISZCV",
  [string]$ExpectedHash = "1b7479f1ca0f12846bbfdd8f0681670692e29e1f20618150912f010b7caf4b9f",
  [string]$RpcUrl = "https://soroban-testnet.stellar.org",
  [string]$NetworkPassphrase = "Test SDF Network ; September 2015",
  [string]$SourceRepo = "github:Iron-Mark/Hackathon-Stellaroid_Earn",
  [string]$HomeDomain = "stellaroid.tech",
  # The release tag whose source produced the deployed bytecode.
  [string]$Ref = "v3.0.0",
  # Manifest path as it exists at $Ref. Left empty, the script auto-detects
  # whichever of the known layouts is present in the checked-out ref.
  [string]$ManifestPath = "",
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

Write-Section "Build Source At $Ref"

# Build in a throwaway worktree so the ref is built exactly as committed and the
# working tree is never touched.
$worktree = Join-Path $auditRoot "src"
$worktreeAdded = $false
if ($Ref -eq "HEAD") {
  $buildRoot = $repoRoot
  Write-Host "Building the current working tree."
} else {
  & git -C $repoRoot worktree add --detach $worktree $Ref 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create a worktree at '$Ref'. Fetch tags first, or pass -Ref HEAD."
  }
  $worktreeAdded = $true
  $buildRoot = $worktree
  Write-Host "Building ref '$Ref' in a temporary worktree."
}

try {
  # The contract moved from contract/ to contracts/stellaroid_earn/ after the
  # deploy, so resolve whichever layout this ref actually has.
  $manifest = $ManifestPath
  if ($manifest -eq "") {
    foreach ($candidate in @("contract/Cargo.toml", "contracts/stellaroid_earn/Cargo.toml")) {
      if (Test-Path (Join-Path $buildRoot $candidate)) {
        $manifest = "./$candidate"
        break
      }
    }
  }
  if ($manifest -eq "") {
    throw "Could not find the contract manifest in ref '$Ref'. Pass -ManifestPath explicitly."
  }
  Write-Host "Manifest: $manifest"

  $sourceBuildOut = Join-Path $auditRoot "current-source-build.out.log"
  $sourceBuildErr = Join-Path $auditRoot "current-source-build.err.log"
  $sourceBuildExit = Invoke-NativeCommand `
    -FilePath $stellarPath `
    -Arguments @(
      "contract", "build",
      "--manifest-path", $manifest,
      "--locked",
      "--meta", "source_repo=$SourceRepo",
      "--meta", "home_domain=$HomeDomain",
      "--out-dir", $buildOut
    ) `
    -StdoutPath $sourceBuildOut `
    -StderrPath $sourceBuildErr `
    -WorkingDirectory $buildRoot
  if ($sourceBuildExit -ne 0) {
    Get-Content $sourceBuildOut, $sourceBuildErr | Out-Host
    throw "Source build failed for ref '$Ref'."
  }
} finally {
  if ($worktreeAdded) {
    & git -C $repoRoot worktree remove --force $worktree 2>&1 | Out-Null
  }
}

$currentWasm = Get-ChildItem -LiteralPath $buildOut -Filter "*.wasm" | Select-Object -First 1
if ($null -eq $currentWasm) {
  throw "Current source build did not produce a WASM artifact."
}

$currentHash = Get-Sha256 $currentWasm.FullName
Write-Host "Rebuilt hash ($Ref): $currentHash"

Write-Section "Verdict"
if ($currentHash -eq $deployedHash) {
  Write-Host "PASS source at '$Ref' reproduces the deployed WASM hash." -ForegroundColor Green
  exit 0
}

Write-Host "WARN source at '$Ref' does not reproduce the deployed WASM hash." -ForegroundColor Yellow
Write-Host "The deployed contract is active and fetchable, but this ref is not a source-verification match for the deployed bytecode." -ForegroundColor Yellow
if ($Ref -eq "HEAD") {
  Write-Host "This is expected on HEAD once the toolchain or contract path has moved since the deploy. Re-run without -Ref to verify the deployed release tag instead." -ForegroundColor Yellow
}

if ($RequireSourceMatch) {
  exit 1
}

exit 0
