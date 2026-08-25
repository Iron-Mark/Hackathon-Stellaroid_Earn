Param(
  [string]$ProjectId = "prj_GNoFcXJpKuwDUz7IeGttAfwCxMFl",
  [string]$ProjectName = "stellaroid-earn-demo",
  [string]$Scope = "marksiazon-dev",
  [int]$TimeoutSec = 30,
  [string]$DohUrl = "",
  [switch]$SkipHttp,
  [switch]$CheckLocalResolver
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$expected = @(
  @{
    Domain = "stellaroid.tech"
    Branch = $null
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "beta.stellaroid.tech"
    Branch = "staging"
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "v2.stellaroid.tech"
    Branch = "june-monthly-builder"
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "v4.stellaroid.tech"
    Branch = "august-monthly-builder"
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "v3.stellaroid.tech"
    Branch = "july-monthly-builder"
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "v1.stellaroid.tech"
    Branch = "april-monthly-builder"
    TitleContains = "Stellaroid Earn"
    Public = $true
  },
  @{
    Domain = "v0.stellaroid.tech"
    Branch = "april-bootcamp"
    TitleContains = "Stellar PH Bootcamp Archive"
    Public = $true
  }
)

$expectedCname = "82586c23ca506f63.vercel-dns-017.com."
$expectedAValues = @("216.150.1.1", "216.150.16.1")
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

function Invoke-VercelJson {
  Param([string]$Path)

  $json = & vercel api $Path --scope $Scope --raw
  if ($LASTEXITCODE -ne 0) {
    throw "vercel api failed for $Path"
  }

  return $json | ConvertFrom-Json
}

Write-Section "Tooling"
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "Vercel CLI is not available on PATH."
}
Add-Pass "Vercel CLI found"

Write-Section "Project Domains"
$projectDomains = Invoke-VercelJson "/v10/projects/$ProjectId/domains"

foreach ($item in $expected) {
  $domain = $item.Domain
  $domainInfo = $projectDomains.domains | Where-Object { $_.name -eq $domain } | Select-Object -First 1

  if (-not $domainInfo) {
    Add-Failure "$domain is not attached to Vercel project $ProjectName"
    continue
  }

  if ($domainInfo.verified -ne $true) {
    Add-Failure "$domain is attached but not verified by Vercel"
  } else {
    Add-Pass "$domain is verified in Vercel"
  }

  if ($null -eq $item.Branch) {
    if ($null -ne $domainInfo.gitBranch) {
      Add-Failure "$domain should not have a gitBranch mapping, found $($domainInfo.gitBranch)"
    } else {
      Add-Pass "$domain is production/root domain without branch mapping"
    }
  } elseif ($domainInfo.gitBranch -ne $item.Branch) {
    Add-Failure "$domain expected branch $($item.Branch), found $($domainInfo.gitBranch)"
  } else {
    Add-Pass "$domain maps to branch $($item.Branch)"
  }
}

Write-Section "DNS Configuration"
foreach ($item in $expected | Where-Object { $_.Domain -ne "stellaroid.tech" }) {
  $domain = $item.Domain
  $config = Invoke-VercelJson "/v6/domains/$domain/config"

  if ($config.misconfigured -eq $true) {
    Add-Failure "$domain is misconfigured in Vercel DNS config"
    continue
  }

  $cnames = @($config.cnames)
  $aValues = @($config.aValues)
  if ($config.configuredBy -eq "CNAME" -and $cnames -contains $expectedCname) {
    Add-Pass "$domain DNS config uses expected CNAME"
  } elseif ($config.configuredBy -eq "A" -and (@($expectedAValues | Where-Object { $aValues -contains $_ }).Count -eq $expectedAValues.Count)) {
    Add-Pass "$domain DNS config uses expected Vercel A records"
  } else {
    Add-Failure "$domain DNS config is $($config.configuredBy), expected CNAME $expectedCname or A records $($expectedAValues -join ', ')"
  }
}

if ($CheckLocalResolver) {
  Write-Section "Local Resolver"
  foreach ($item in $expected | Where-Object { $_.Domain -ne "stellaroid.tech" }) {
    $domain = $item.Domain
    try {
      $records = Resolve-DnsName $domain -ErrorAction Stop
      $nameHosts = @($records | ForEach-Object {
        if ($_.PSObject.Properties["NameHost"]) {
          $_.NameHost
        }
      })
      $ipAddresses = @($records | ForEach-Object {
        if ($_.PSObject.Properties["IPAddress"]) {
          $_.IPAddress
        }
      })
      if ($nameHosts -contains $expectedCname.TrimEnd(".")) {
        Add-Pass "$domain resolves locally to expected CNAME"
      } elseif (@($expectedAValues | Where-Object { $ipAddresses -contains $_ }).Count -eq $expectedAValues.Count) {
        Add-Pass "$domain resolves locally to expected Vercel A records"
      } else {
        Add-Failure "$domain local resolver returned hosts '$($nameHosts -join ', ')' and IPs '$($ipAddresses -join ', ')'"
      }
    } catch {
      Add-Failure "$domain local resolver lookup failed: $($_.Exception.Message)"
    }
  }
}

Write-Section "Public Access"
$protection = & vercel project protection $ProjectName --scope $Scope --format json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
  throw "vercel project protection failed for $ProjectName"
}

if ($null -ne $protection.ssoProtection -and $protection.ssoProtection -ne $false) {
  Add-Failure "SSO deployment protection is enabled; public showcase domains will redirect to Vercel SSO"
} else {
  Add-Pass "SSO deployment protection is disabled for public showcase domains"
}

if (-not $SkipHttp) {
  Write-Section "HTTPS"
  foreach ($item in $expected) {
    $domain = $item.Domain
    $bodyPath = [System.IO.Path]::GetTempFileName()
    try {
      $curlArgs = @("-L", "-sS", "--max-time", "$TimeoutSec", "-o", $bodyPath, "-w", "%{http_code}")
      if (-not [string]::IsNullOrWhiteSpace($DohUrl)) {
        $curlArgs = @("--doh-url", $DohUrl) + $curlArgs
      }
      $curlArgs += "https://$domain"

      $statusOutput = & curl.exe @curlArgs
      if ($LASTEXITCODE -ne 0) {
        throw "curl exited with code $LASTEXITCODE"
      }

      $statusCode = [int]($statusOutput | Select-Object -Last 1)
      $content = Get-Content -LiteralPath $bodyPath -Raw
      $titleMatch = [regex]::Match($content, "<title>(.*?)</title>", "IgnoreCase")
      $title = [System.Net.WebUtility]::HtmlDecode($titleMatch.Groups[1].Value)

      if ($statusCode -ne 200) {
        Add-Failure "$domain returned HTTP $statusCode"
      } elseif ($title -notlike "*$($item.TitleContains)*") {
        Add-Failure "$domain title '$title' does not contain '$($item.TitleContains)'"
      } else {
        Add-Pass "$domain returned 200 with title '$title'"
      }
    } catch {
      Add-Failure "$domain HTTPS check failed: $($_.Exception.Message)"
    } finally {
      if (Test-Path $bodyPath) {
        Remove-Item -LiteralPath $bodyPath -Force
      }
    }
  }
}

Write-Section "Result"
if ($failures.Count -gt 0) {
  Write-Host "Deployment verification failed with $($failures.Count) issue(s)." -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host "- $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Deployment verification passed." -ForegroundColor Green
