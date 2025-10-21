<#
.SYNOPSIS
  Orchestrate UWP development debug setup: build/copy packs, prepare launch config, add loopback, and tail logs.

.DESCRIPTION
  Runs the project's npm scripts (update-manifest-names, copy:packs, prepare:launch), optionally copies
  the generated launch to active launch.json, ensures UWP loopback exemption, and tails the ContentLog
  until the addon startup marker is observed.

.PARAMETER TailLogs
  When provided, tails ContentLog* and waits for the startup marker (default: true).

.PARAMETER CopyLaunch
  When provided, copies .vscode/launch.generated.json to .vscode/launch.json (default: true).

.PARAMETER Loopback
  When provided, attempts to add the UWP loopback exemption (requires elevation). Default: true.

EXAMPLE
  .\dev_debug_setup.ps1 -TailLogs -CopyLaunch -Loopback
#>

[CmdletBinding()]
param(
  [bool] $TailLogs = $true,
  [bool] $CopyLaunch = $true,
  [bool] $Loopback = $true,
  [bool] $Interactive = $false,
  [int] $MarkerTimeout = 60,
  [bool] $VerifyMarker = $true
)

function Write-Info { param($m) Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn { param($m) Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "[ERROR] $m" -ForegroundColor Red }

Set-Location -Path (Resolve-Path (Join-Path $PSScriptRoot '..'))
$repoRoot = Get-Location

function Invoke-RunNpm([string]$script) {
  Write-Info "Running: npm run $script"
  $p = Start-Process -FilePath npm -ArgumentList @('run', $script) -NoNewWindow -Wait -PassThru
  if ($p.ExitCode -ne 0) {
    Write-Err "npm run $script failed with exit code $($p.ExitCode)"
    throw "npm script failed"
  }
}

  try {
  # Compute marker path and record pre-copy timestamp (if any)
  $localAppData = $env:LOCALAPPDATA
  $markerPath = Join-Path $localAppData 'lbff_inventory_sorter_startup.txt'
  $preTimestamp = $null
  if (Test-Path $markerPath) {
    $preTimestamp = (Get-Item $markerPath).LastWriteTimeUtc
    Write-Info "Pre-copy marker exists. LastWriteTimeUtc = $preTimestamp"
  } else {
    Write-Info "Pre-copy marker not present at $markerPath"
  }

  Invoke-RunNpm 'update-manifest-names'
  Invoke-RunNpm 'copy:packs'
  # After copying packs, verify checksums between source and destination to ensure files were copied correctly
  function Get-HashMap([string]$root) {
    $map = @{}
    if (-not (Test-Path $root)) { return $map }
    Get-ChildItem -Path $root -Recurse -File | ForEach-Object {
      $rel = $_.FullName.Substring($root.Length + 1).TrimStart('\') -replace '\\','/'
      try {
        $h = Get-FileHash -Path $_.FullName -Algorithm SHA256
        $map[$rel] = $h.Hash
      } catch {
        Write-Warn "Failed to hash file: $($_.FullName)"
      }
    }
    return $map
  }

  # Source pack folders in repo
  $srcBP = Join-Path $repoRoot 'lbff_bedrock_inventory_sorter_BP'
  $srcRP = Join-Path $repoRoot 'lbff_bedrock_inventory_sorter_RP'

  $uwpBase = Join-Path $env:LOCALAPPDATA 'Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang'
  $candidates = @(
    @{ type='behavior'; src=$srcBP; dests=@(Join-Path $uwpBase 'development_behavior_packs\lbff_bedrock_inventory_sorter_BP', Join-Path $uwpBase 'behavior_packs\lbff_bedrock_inventory_sorter_BP') },
    @{ type='resource'; src=$srcRP; dests=@(Join-Path $uwpBase 'development_resource_packs\lbff_bedrock_inventory_sorter_RP', Join-Path $uwpBase 'resource_packs\lbff_bedrock_inventory_sorter_RP') }
  )

  $verificationFailed = $false
  foreach ($c in $candidates) {
    if (-not (Test-Path $c.src)) { Write-Warn "Source folder not found: $($c.src). Skipping verification for $($c.type)."; continue }
    Write-Info "Verifying $($c.type) pack checksums from $($c.src)"
    $srcMap = Get-HashMap $c.src
    foreach ($dest in $c.dests) {
      if (-not (Test-Path $dest)) { Write-Warn "Destination not found: $dest. Skipping."; continue }
      Write-Info "Comparing to destination: $dest"
      $dstMap = Get-HashMap $dest
      # Compare keys
      foreach ($k in $srcMap.Keys) {
        if (-not $dstMap.ContainsKey($k)) {
          Write-Err "Missing file in destination: $k"
          $verificationFailed = $true
          continue
        }
        if ($srcMap[$k] -ne $dstMap[$k]) {
          Write-Err "Hash mismatch: $k\n  src: $($srcMap[$k])\n  dst: $($dstMap[$k])"
          $verificationFailed = $true
        }
      }
      # Extra files in destination are not a failure, but warn
      foreach ($k in $dstMap.Keys) {
        if (-not $srcMap.ContainsKey($k)) {
          Write-Warn "Extra file in destination (not in source): $k"
        }
      }
    }
  }

  if ($verificationFailed) {
    Write-Err "Checksum verification failed. Aborting further steps."
    exit 2
  } else {
    Write-Info "Checksum verification passed for all checked packs."
  }

  # Quick post-copy verification: check if marker was created/updated by addon startup
  $markerFoundAfterCopy = $false
  if ($VerifyMarker) {
    if (Test-Path $markerPath) {
      $cur = (Get-Item $markerPath).LastWriteTimeUtc
      if ($null -eq $preTimestamp -or $cur -gt $preTimestamp) {
        Write-Info "Marker file created/updated immediately after copy (LastWriteTimeUtc = $cur)"
        $markerFoundAfterCopy = $true
      } else {
        Write-Info "Marker present after copy but not updated (LastWriteTimeUtc = $cur)"
      }
    } else {
      Write-Info "Marker not present immediately after copy"
    }
  }

  Invoke-RunNpm 'prepare:launch'

  $vscodeDir = Join-Path $repoRoot '.vscode'
  $generated = Join-Path $vscodeDir 'launch.generated.json'
  $active = Join-Path $vscodeDir 'launch.json'

  if ($CopyLaunch) {
    if ($Interactive) { Read-Host 'Press Enter to copy generated launch to active launch.json (or Ctrl+C to abort)' | Out-Null }
    if (Test-Path $generated) {
      Copy-Item -Path $generated -Destination $active -Force
      Write-Info "Copied $generated -> $active"
    } else {
      Write-Warn "Generated launch file not found: $generated"
    }
  }

  if ($Loopback) {
    Write-Info "Ensuring UWP loopback exemption for Microsoft.MinecraftUWP_8wekyb3d8bbwe"
    try {
      $list = & CheckNetIsolation.exe LoopbackExempt -s 2>$null
      if ($list -and $list -match 'Microsoft.MinecraftUWP_8wekyb3d8bbwe') {
        Write-Info "Loopback exemption already present"
      } else {
        Write-Info "Attempting to add loopback exemption (UAC prompt may appear)."
        Start-Process -FilePath CheckNetIsolation.exe -ArgumentList 'LoopbackExempt -a -n="Microsoft.MinecraftUWP_8wekyb3d8bbwe"' -Verb RunAs -Wait
        Write-Info "Loopback exemption command executed."
      }
    } catch {
      Write-Warn "Could not add loopback exemption automatically. Run PowerShell as Administrator and execute: CheckNetIsolation.exe LoopbackExempt -a -n=\"Microsoft.MinecraftUWP_8wekyb3d8bbwe\""
    }
  }

  if ($TailLogs) {
    # Prefer the file-marker approach: check for startup file under LOCALAPPDATA
    $localAppData = $env:LOCALAPPDATA
    $markerPath = Join-Path $localAppData 'lbff_inventory_sorter_startup.txt'
    Write-Info "Waiting for startup marker file: $markerPath (timeout ${MarkerTimeout}s)"

    $preTimestamp = $null
    if ($VerifyMarker -and (Test-Path $markerPath)) {
      $preTimestamp = (Get-Item $markerPath).LastWriteTimeUtc
      Write-Info "Marker pre-existing. LastWriteTimeUtc = $preTimestamp"
    }

    if ($markerFoundAfterCopy) {
      Write-Info "Marker was created/updated during copy; skipping wait loop."
    } else {
      $maxWait = [int]$MarkerTimeout
      $elapsed = 0
      $found = $false
      while ($elapsed -lt $maxWait) {
        if (Test-Path $markerPath) {
          if ($VerifyMarker -and $preTimestamp) {
            $cur = (Get-Item $markerPath).LastWriteTimeUtc
            if ($cur -gt $preTimestamp) {
              Write-Info "Found updated startup marker (LastWriteTimeUtc = $cur)"
              $found = $true
              break
            }
          } else {
            Write-Info "Found startup marker file: $markerPath"
            $found = $true
            break
          }
        }
        Start-Sleep -Seconds 1
        $elapsed += 1
      }

      if (-not $found) {
        Write-Warn "Startup marker not found/updated after $maxWait seconds — falling back to log tailing."
        # fall back to previous behavior
        $node = Get-Command node -ErrorAction SilentlyContinue
        if ($null -eq $node) {
          Write-Warn "Node not found in PATH. Run 'npm run verify:start' manually or install Node."
        } else {
          & node (Join-Path $repoRoot 'scripts' 'wait_for_startup_log.js')
        }
      }
    }
  }

  Write-Info "dev_debug_setup completed."
} catch {
  Write-Err "Dev setup failed: $_"
  exit 1
}
