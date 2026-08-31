Param(
  [string]$Repo = "Iron-Mark/Hackathon-Stellaroid_Earn",
  [string]$MonthlyRulesetName = "Protect monthly builder branches"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$protectedIntegrationBranches = @("main", "staging")
$syncedBranches = @("main", "staging")
$activeMonthlyBuilderBranches = @("august-monthly-builder")
$archiveBranches = @("april-bootcamp-and-monthly-builder", "june-monthly-builder", "july-monthly-builder")
$lockedArchiveBranches = @("june-monthly-builder", "july-monthly-builder")
$monthlyBuilderBranches = @($activeMonthlyBuilderBranches + $archiveBranches)
$legacyBranchesExpectedAbsent = @("dev", "dev-archive-before-staging", "old-ver", "mark-siazon")
$monthlyPattern = "refs/heads/*-monthly-builder"
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

function Add-Info {
  Param([string]$Message)
  Write-Host "INFO $Message" -ForegroundColor Cyan
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

function Invoke-GhJson {
  Param([string]$Path)

  $json = & gh api $Path
  if ($LASTEXITCODE -ne 0) {
    throw "gh api failed for $Path"
  }

  return $json | ConvertFrom-Json
}

function Get-RemoteBranchShas {
  $branchNames = @(
    $syncedBranches
    $activeMonthlyBuilderBranches
    $archiveBranches
    $legacyBranchesExpectedAbsent
  ) | ForEach-Object { $_ } | Sort-Object -Unique

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

function Update-RemoteBranchObjects {
  Param([string[]]$Branches)

  & git -C $repoRoot fetch --quiet origin @Branches
  if ($LASTEXITCODE -ne 0) {
    throw "git fetch failed for branch content-sync verification"
  }
}

function Get-CommitTree {
  Param([string]$Sha)

  $treeRef = "$Sha^{tree}"
  $tree = (& git -C $repoRoot rev-parse $treeRef).Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "git rev-parse failed for tree $treeRef"
  }

  return $tree
}

function Test-ProtectionDisabledFlag {
  Param(
    [object]$Protection,
    [string]$PropertyName,
    [string]$Branch
  )

  $flag = Get-JsonProperty $Protection $PropertyName
  $enabled = Get-JsonProperty $flag "enabled"
  if ($enabled -eq $true) {
    Add-Failure "$Branch protection should have $PropertyName disabled"
  } else {
    Add-Pass "$Branch protection has $PropertyName disabled"
  }
}

function Test-IntegrationBranchProtection {
  Param([string]$Branch)

  $branchInfo = Invoke-GhJson "repos/$Repo/branches/$Branch"
  if ($branchInfo.protected -ne $true) {
    Add-Failure "$Branch is not reported as protected"
    return
  }
  Add-Pass "$Branch is reported as protected"

  $protection = Invoke-GhJson "repos/$Repo/branches/$Branch/protection"

  $reviews = Get-JsonProperty $protection "required_pull_request_reviews"
  if ($null -eq $reviews) {
    Add-Failure "$Branch does not require pull-request based updates"
  } elseif ($reviews.required_approving_review_count -ne 0) {
    Add-Failure "$Branch expected 0 required approvals, found $($reviews.required_approving_review_count)"
  } else {
    Add-Pass "$Branch requires pull-request based updates with 0 approvals"
  }

  $conversationResolution = Get-JsonProperty $protection "required_conversation_resolution"
  if ((Get-JsonProperty $conversationResolution "enabled") -ne $true) {
    Add-Failure "$Branch should require conversation resolution"
  } else {
    Add-Pass "$Branch requires conversation resolution"
  }

  $admins = Get-JsonProperty $protection "enforce_admins"
  if ((Get-JsonProperty $admins "enabled") -ne $true) {
    Add-Failure "$Branch should enforce protection for admins"
  } else {
    Add-Pass "$Branch enforces protection for admins"
  }

  Test-ProtectionDisabledFlag -Protection $protection -PropertyName "allow_force_pushes" -Branch $Branch
  Test-ProtectionDisabledFlag -Protection $protection -PropertyName "allow_deletions" -Branch $Branch

  $lockBranch = Get-JsonProperty $protection "lock_branch"
  if ((Get-JsonProperty $lockBranch "enabled") -eq $true) {
    Add-Failure "$Branch should not be locked; it is an active integration branch"
  } else {
    Add-Pass "$Branch is not locked"
  }
}

function Test-LockedArchiveProtection {
  Param([string]$Branch)

  $branchInfo = Invoke-GhJson "repos/$Repo/branches/$Branch"
  if ($branchInfo.protected -ne $true) {
    Add-Failure "$Branch archive is not reported as protected"
    return
  }
  Add-Pass "$Branch archive is reported as protected"

  $protection = Invoke-GhJson "repos/$Repo/branches/$Branch/protection"
  $lockBranch = Get-JsonProperty $protection "lock_branch"
  if ((Get-JsonProperty $lockBranch "enabled") -ne $true) {
    Add-Failure "$Branch archive should be locked"
  } else {
    Add-Pass "$Branch archive is locked"
  }

  $admins = Get-JsonProperty $protection "enforce_admins"
  if ((Get-JsonProperty $admins "enabled") -ne $true) {
    Add-Failure "$Branch archive should enforce protection for admins"
  } else {
    Add-Pass "$Branch archive enforces protection for admins"
  }

  Test-ProtectionDisabledFlag -Protection $protection -PropertyName "allow_force_pushes" -Branch $Branch
  Test-ProtectionDisabledFlag -Protection $protection -PropertyName "allow_deletions" -Branch $Branch
}

Write-Section "Tooling"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI is not available on PATH."
}
Add-Pass "GitHub CLI found"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not available on PATH."
}
Add-Pass "Git found"

Write-Section "Remote Branches"
$branchShas = Get-RemoteBranchShas

foreach ($branch in (($syncedBranches + $activeMonthlyBuilderBranches + $archiveBranches) | Sort-Object -Unique)) {
  if (-not $branchShas.ContainsKey($branch)) {
    Add-Failure "Missing remote branch $branch"
  } else {
    Add-Pass "$branch exists at $($branchShas[$branch])"
  }
}

foreach ($branch in $legacyBranchesExpectedAbsent) {
  if ($branchShas.ContainsKey($branch)) {
    Add-Failure "Legacy branch $branch still exists remotely"
  } else {
    Add-Pass "Legacy branch $branch is absent remotely"
  }
}

if ($syncedBranches | Where-Object { -not $branchShas.ContainsKey($_) }) {
  Add-Failure "Cannot compare synced branch content because one or more branches are missing"
} else {
  Update-RemoteBranchObjects -Branches ($syncedBranches + $activeMonthlyBuilderBranches)

  $mainSha = $branchShas["main"]
  $mainTree = Get-CommitTree -Sha $mainSha
  $syncFailures = 0

  foreach ($branch in $syncedBranches) {
    $branchSha = $branchShas[$branch]
    $branchTree = Get-CommitTree -Sha $branchSha
    if ($branchTree -ne $mainTree) {
      Add-Failure "$branch tree is $branchTree at $branchSha, expected tree $mainTree from main@$mainSha"
      $syncFailures += 1
    }
  }

  if ($syncFailures -eq 0) {
    Add-Pass "$($syncedBranches -join ', ') are content-synced at tree $mainTree"
  }

  foreach ($branch in $activeMonthlyBuilderBranches) {
    if (-not $branchShas.ContainsKey($branch)) {
      continue
    }

    $branchSha = $branchShas[$branch]
    & git -C $repoRoot merge-base --is-ancestor $mainSha $branchSha
    if ($LASTEXITCODE -ne 0) {
      Add-Failure "$branch does not contain main@$mainSha"
    } else {
      Add-Pass "$branch contains main@$mainSha and may be ahead for active August work"
    }
  }
}

Write-Section "Integration Branch Protection"
foreach ($branch in $protectedIntegrationBranches) {
  Test-IntegrationBranchProtection -Branch $branch
}

Write-Section "Archive Branch Protection"
foreach ($branch in $lockedArchiveBranches) {
  Test-LockedArchiveProtection -Branch $branch
}

Write-Section "Monthly Builder Ruleset"
$rulesets = Invoke-GhJson "repos/$Repo/rulesets"
$rulesetSummary = @($rulesets | Where-Object { $_.name -eq $MonthlyRulesetName } | Select-Object -First 1)
if ($rulesetSummary.Count -eq 0) {
  Add-Failure "Missing ruleset '$MonthlyRulesetName'"
} else {
  $ruleset = Invoke-GhJson "repos/$Repo/rulesets/$($rulesetSummary[0].id)"
  if ($ruleset.enforcement -ne "active") {
    Add-Failure "Ruleset '$MonthlyRulesetName' should be active, found $($ruleset.enforcement)"
  } else {
    Add-Pass "Ruleset '$MonthlyRulesetName' is active"
  }

  if ($ruleset.target -ne "branch") {
    Add-Failure "Ruleset '$MonthlyRulesetName' should target branches, found $($ruleset.target)"
  } else {
    Add-Pass "Ruleset '$MonthlyRulesetName' targets branches"
  }

  $includeRefs = @($ruleset.conditions.ref_name.include)
  if ($includeRefs -notcontains $monthlyPattern) {
    Add-Failure "Ruleset '$MonthlyRulesetName' should include $monthlyPattern"
  } else {
    Add-Pass "Ruleset '$MonthlyRulesetName' includes $monthlyPattern"
  }

  $ruleTypes = @($ruleset.rules | ForEach-Object { $_.type })
  foreach ($requiredRule in @("deletion", "non_fast_forward")) {
    if ($ruleTypes -notcontains $requiredRule) {
      Add-Failure "Ruleset '$MonthlyRulesetName' is missing $requiredRule rule"
    } else {
      Add-Pass "Ruleset '$MonthlyRulesetName' has $requiredRule rule"
    }
  }

  foreach ($branch in $monthlyBuilderBranches) {
    $branchInfo = Invoke-GhJson "repos/$Repo/branches/$branch"
    if ($branchInfo.protected -ne $true) {
      Add-Failure "$branch should be protected by the monthly-builder ruleset"
    } else {
      Add-Pass "$branch is protected by branch governance"
    }
  }
}

Write-Section "Result"
if ($failures.Count -gt 0) {
  Write-Host "GitHub branch governance verification failed with $($failures.Count) issue(s)." -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "GitHub branch governance verification passed." -ForegroundColor Green
