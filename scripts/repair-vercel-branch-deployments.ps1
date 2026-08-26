Param(
  [string]$ProjectId = "prj_GNoFcXJpKuwDUz7IeGttAfwCxMFl",
  [string]$ProjectName = "stellaroid-earn-demo",
  [string]$Scope = "marksiazon-dev",
  [string]$Repo = "Iron-Mark/Hackathon-Stellaroid_Earn",
  [string[]]$OnlyDomain = @(),
  [switch]$Deploy,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$projectLinkPath = Join-Path $repoRoot ".vercel\project.json"
$v0TemplateRoot = Join-Path $repoRoot "scripts\templates\v0-archive-showcase"
$expected = @(
  @{
    Domain = "beta.stellaroid.tech"
    Branch = "staging"
    Kind = "worktree"
  },
  @{
    Domain = "v2.stellaroid.tech"
    Branch = "june-monthly-builder"
    Kind = "worktree"
  },
  @{
    Domain = "v4.stellaroid.tech"
    Branch = "august-monthly-builder"
    Kind = "worktree"
  },
  @{
    Domain = "v3.stellaroid.tech"
    Branch = "july-monthly-builder"
    Kind = "worktree"
  },
  @{
    Domain = "v1.stellaroid.tech"
    Branch = "april-monthly-builder"
    Kind = "worktree"
  },
  @{
    Domain = "v0.stellaroid.tech"
    Branch = "april-bootcamp"
    Kind = "template"
  }
)

if ($OnlyDomain.Count -gt 0) {
  $expected = @($expected | Where-Object { $OnlyDomain -contains $_["Domain"] })
  if ($expected.Count -eq 0) {
    throw "No configured branch showcase domains match -OnlyDomain: $($OnlyDomain -join ', ')"
  }
}

$failures = New-Object System.Collections.Generic.List[string]
$actions = New-Object System.Collections.Generic.List[hashtable]

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

function Add-Info {
  Param([string]$Message)
  Write-Host "INFO $Message" -ForegroundColor Cyan
}

function Add-Warn {
  Param([string]$Message)
  Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Get-JsonProperty {
  Param(
    [object]$Object,
    [string]$Name
  )

  if ($null -eq $Object) {
    return $null
  }

  $property = $Object.PSObject.Properties[$Name]
  if ($null -eq $property) {
    return $null
  }

  return $property.Value
}

function Invoke-VercelJson {
  Param([string]$Path)

  $json = & vercel api $Path --scope $Scope --raw
  if ($LASTEXITCODE -ne 0) {
    throw "vercel api failed for $Path"
  }

  return $json | ConvertFrom-Json
}

function Invoke-AliasJson {
  $json = & vercel alias ls --scope $Scope --format json --limit 100 --no-color
  if ($LASTEXITCODE -ne 0) {
    throw "vercel alias ls failed"
  }

  return ($json -join "`n") | ConvertFrom-Json
}

function Get-RemoteBranchShas {
  $branchNames = @($expected | ForEach-Object { $_["Branch"] } | Sort-Object -Unique)
  $output = & git -C $repoRoot ls-remote --heads origin @branchNames
  if ($LASTEXITCODE -ne 0) {
    throw "git ls-remote failed for origin"
  }

  $shas = @{}
  foreach ($line in $output) {
    if ($line -match "^([0-9a-f]{40})\s+refs/heads/(.+)$") {
      $shas[$Matches[2]] = $Matches[1]
    }
  }

  return $shas
}

function Get-ReadyDeploymentsForBranch {
  Param(
    [object]$Deployments,
    [string]$Branch
  )

  return @($Deployments.deployments | Where-Object {
    $meta = Get-JsonProperty $_ "meta"
    $ref = Get-JsonProperty $meta "githubCommitRef"
    if ([string]::IsNullOrWhiteSpace($ref)) {
      $ref = Get-JsonProperty $meta "gitCommitRef"
    }

    $readyState = Get-JsonProperty $_ "readyState"
    $state = Get-JsonProperty $_ "state"
    ($ref -eq $Branch) -and ($readyState -eq "READY" -or $state -eq "READY")
  } | Sort-Object -Property createdAt -Descending)
}

function Get-DeploymentSha {
  Param([object]$Deployment)

  $meta = Get-JsonProperty $Deployment "meta"
  $sha = Get-JsonProperty $meta "githubCommitSha"
  if ([string]::IsNullOrWhiteSpace($sha)) {
    $sha = Get-JsonProperty $meta "gitCommitSha"
  }

  return $sha
}

function New-TempPath {
  Param([string]$Name)

  $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  $safeName = ($Name -replace "[^A-Za-z0-9_.-]", "-")
  return Join-Path $tempRoot ("stellaroid-vercel-$safeName-$PID-" + [Guid]::NewGuid().ToString("N").Substring(0, 8))
}

function Assert-SafeTempPath {
  Param([string]$Path)

  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if (-not $fullPath.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean non-temp path: $fullPath"
  }

  if ((Split-Path -Leaf $fullPath) -notlike "stellaroid-vercel-*") {
    throw "Refusing to clean temp path without stellaroid-vercel prefix: $fullPath"
  }

  return $fullPath
}

function Copy-VercelProjectLink {
  Param([string]$Root)

  if (-not (Test-Path -LiteralPath $projectLinkPath)) {
    throw "Missing local Vercel project link at $projectLinkPath"
  }

  $rootVercel = Join-Path $Root ".vercel"
  New-Item -ItemType Directory -Force -Path $rootVercel | Out-Null
  Copy-Item -LiteralPath $projectLinkPath -Destination (Join-Path $rootVercel "project.json") -Force

  $frontendRoot = Join-Path $Root "frontend"
  if (Test-Path -LiteralPath $frontendRoot) {
    $frontendVercel = Join-Path $frontendRoot ".vercel"
    New-Item -ItemType Directory -Force -Path $frontendVercel | Out-Null
    Copy-Item -LiteralPath $projectLinkPath -Destination (Join-Path $frontendVercel "project.json") -Force
  }
}

function New-WorktreeSource {
  Param(
    [string]$Branch,
    [string]$Sha
  )

  $worktreePath = New-TempPath $Branch
  & git -C $repoRoot worktree add --detach $worktreePath "origin/$Branch" | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "git worktree add failed for $Branch"
  }

  $actualSha = (& git -C $worktreePath rev-parse HEAD).Trim()
  if ($actualSha -ne $Sha) {
    throw "Worktree for $Branch checked out $actualSha, expected $Sha"
  }

  Copy-VercelProjectLink $worktreePath
  return @{
    Path = $worktreePath
    IsWorktree = $true
  }
}

function New-V0TemplateSource {
  Param(
    [string]$Branch,
    [string]$Sha
  )

  if (-not (Test-Path -LiteralPath $v0TemplateRoot)) {
    throw "Missing v0 template at $v0TemplateRoot"
  }

  $tempPath = New-TempPath $Branch
  $frontendRoot = Join-Path $tempPath "frontend"
  New-Item -ItemType Directory -Force -Path $frontendRoot | Out-Null
  Copy-Item -Path (Join-Path $v0TemplateRoot "*") -Destination $frontendRoot -Recurse -Force

  $generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  $archiveDataPath = Join-Path $frontendRoot "src\app\archive-data.ts"
  $archiveData = @"
export const archiveData = {
  branch: "$Branch",
  commit: "$Sha",
  generatedAt: "$generatedAt",
  sourceRepo: "$Repo"
} as const;
"@
  Set-Content -LiteralPath $archiveDataPath -Value $archiveData -Encoding UTF8

  Copy-VercelProjectLink $tempPath
  return @{
    Path = $tempPath
    IsWorktree = $false
  }
}

function Remove-DeploymentSource {
  Param([hashtable]$Source)

  if ($null -eq $Source -or -not $Source.ContainsKey("Path")) {
    return
  }

  $path = Assert-SafeTempPath $Source["Path"]

  if ($Source["IsWorktree"] -eq $true) {
    & git -C $repoRoot worktree remove --force $path | Out-Host
    if ($LASTEXITCODE -ne 0) {
      Add-Warn "git worktree remove failed for $path; attempting safe temp cleanup"
    }
  }

  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

function Invoke-VercelDeploy {
  Param(
    [hashtable]$Item,
    [string]$Sha
  )

  $branch = $Item["Branch"]
  $kind = $Item["Kind"]
  $source = $null

  try {
    if ($kind -eq "template") {
      $source = New-V0TemplateSource -Branch $branch -Sha $Sha
    } else {
      $source = New-WorktreeSource -Branch $branch -Sha $Sha
    }

    Add-Info "Deploying $branch from $($source["Path"])"
    $deployOutput = & vercel deploy $source["Path"] `
      --yes `
      --scope $Scope `
      --format json `
      --no-color `
      --meta "githubCommitRef=$branch" `
      --meta "githubCommitSha=$Sha" `
      --meta "githubCommitRepo=Hackathon-Stellaroid_Earn" `
      --meta "githubCommitOrg=Iron-Mark" `
      --meta "githubOrg=Iron-Mark" `
      --meta "githubRepo=Hackathon-Stellaroid_Earn" `
      --meta "gitCommitRef=$branch" `
      --meta "gitCommitSha=$Sha" `
      --meta "actor=codex"

    if ($LASTEXITCODE -ne 0) {
      throw "vercel deploy failed for $branch"
    }

    $deployText = ($deployOutput -join "`n").Trim()
    $deploymentUrl = $null
    try {
      $deployJson = $deployText | ConvertFrom-Json
      $deploymentUrl = Get-JsonProperty $deployJson "url"
      if ([string]::IsNullOrWhiteSpace($deploymentUrl)) {
        $deploymentUrl = Get-JsonProperty $deployJson "deploymentUrl"
      }
    } catch {
      if ($deployText -match "(https?://)?([A-Za-z0-9.-]+\.vercel\.app)") {
        $deploymentUrl = $Matches[2]
      }
    }

    if ([string]::IsNullOrWhiteSpace($deploymentUrl)) {
      throw "Could not determine deployment URL from Vercel output: $deployText"
    }

    $deploymentUrl = $deploymentUrl -replace "^https?://", ""
    return $deploymentUrl
  } finally {
    Remove-DeploymentSource $source
  }
}

function Set-VercelAlias {
  Param(
    [string]$DeploymentUrl,
    [string]$Domain
  )

  Add-Info "Aliasing $DeploymentUrl to $Domain"
  & vercel alias set $DeploymentUrl $Domain --scope $Scope --no-color | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "vercel alias set failed for $Domain"
  }
}

Write-Section "Tooling"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is not available on PATH."
}
Add-Pass "Vercel CLI found"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not available on PATH."
}
Add-Pass "Git found"

Write-Section "Read Current State"
$projectDomains = Invoke-VercelJson "/v10/projects/$ProjectId/domains"
$deployments = Invoke-VercelJson "/v6/deployments?projectId=$ProjectId"
$aliases = Invoke-AliasJson
$branchShas = Get-RemoteBranchShas
Add-Pass "Read Vercel domains, recent deployments, aliases, and remote branch SHAs"

Write-Section "Evaluate Branch Domains"
foreach ($item in $expected) {
  $domain = $item["Domain"]
  $branch = $item["Branch"]
  $sha = $branchShas[$branch]

  if ([string]::IsNullOrWhiteSpace($sha)) {
    Add-Failure "$domain maps to missing remote branch $branch"
    continue
  }

  $domainInfo = @($projectDomains.domains | Where-Object { $_.name -eq $domain } | Select-Object -First 1)
  if ($domainInfo.Count -eq 0) {
    Add-Failure "$domain is not attached to Vercel project $ProjectName"
    continue
  }

  if ($domainInfo[0].gitBranch -ne $branch) {
    Add-Failure "$domain expected gitBranch $branch, found $($domainInfo[0].gitBranch)"
    continue
  }

  $readyDeployments = Get-ReadyDeploymentsForBranch -Deployments $deployments -Branch $branch
  $currentDeployment = @($readyDeployments | Where-Object { (Get-DeploymentSha $_) -eq $sha } | Select-Object -First 1)
  $latestDeployment = @($readyDeployments | Select-Object -First 1)
  $aliasInfo = @($aliases.aliases | Where-Object { $_.alias -eq $domain } | Select-Object -First 1)

  if ($currentDeployment.Count -eq 0) {
    if ($latestDeployment.Count -gt 0) {
      Add-Warn "$domain has a ready $branch deployment, but not for current SHA $sha"
    } else {
      Add-Warn "$domain has no ready deployment for $branch"
    }

    $actions.Add(@{
      Domain = $domain
      Branch = $branch
      Sha = $sha
      Action = "deploy-and-alias"
      Item = $item
    }) | Out-Null
    continue
  }

  $deployment = $currentDeployment[0]
  if ($aliasInfo.Count -eq 0) {
    Add-Warn "$domain has deployment $($deployment.uid) but no alias"
    $actions.Add(@{
      Domain = $domain
      Branch = $branch
      Sha = $sha
      Action = "alias"
      DeploymentUrl = $deployment.url
      DeploymentId = $deployment.uid
      Item = $item
    }) | Out-Null
    continue
  }

  if ($aliasInfo[0].deploymentId -ne $deployment.uid) {
    Add-Warn "$domain alias points to $($aliasInfo[0].deploymentId), expected $($deployment.uid)"
    $actions.Add(@{
      Domain = $domain
      Branch = $branch
      Sha = $sha
      Action = "alias"
      DeploymentUrl = $deployment.url
      DeploymentId = $deployment.uid
      Item = $item
    }) | Out-Null
    continue
  }

  Add-Pass "$domain maps to $branch@$sha with ready deployment $($deployment.uid)"
}

if ($failures.Count -gt 0) {
  Write-Section "Result"
  Write-Host "Vercel branch deployment evaluation failed before repair planning." -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Section "Repair Plan"
if ($actions.Count -eq 0 -and -not $Force) {
  Write-Host "No repair needed. Use -Deploy only when this dry run reports a concrete missing deployment or alias." -ForegroundColor Green
  exit 0
}

if ($Force -and $actions.Count -eq 0) {
  foreach ($item in $expected) {
    $branch = $item["Branch"]
    $actions.Add(@{
      Domain = $item["Domain"]
      Branch = $branch
      Sha = $branchShas[$branch]
      Action = "deploy-and-alias"
      Item = $item
    }) | Out-Null
  }
}

foreach ($action in $actions) {
  Write-Host "- $($action.Action): $($action.Branch)@$($action.Sha) -> $($action.Domain)"
}

if (-not $Deploy) {
  Write-Host ""
  Write-Host "Dry run only. Re-run with -Deploy to perform exactly the repair plan above." -ForegroundColor Yellow
  exit 1
}

Write-Section "Apply Repair"
foreach ($action in $actions) {
  if ($action.Action -eq "deploy-and-alias") {
    $deploymentUrl = Invoke-VercelDeploy -Item $action.Item -Sha $action.Sha
    Set-VercelAlias -DeploymentUrl $deploymentUrl -Domain $action.Domain
  } elseif ($action.Action -eq "alias") {
    Set-VercelAlias -DeploymentUrl $action.DeploymentUrl -Domain $action.Domain
  } else {
    throw "Unknown repair action: $($action.Action)"
  }
}

Write-Section "Result"
Write-Host "Repair actions finished. Run scripts\verify-vercel-branch-domains.ps1 to verify live domains." -ForegroundColor Green
