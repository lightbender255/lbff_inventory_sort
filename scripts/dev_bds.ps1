<#
Dev helper for Bedrock Dedicated Server (BDS).

Usage:
  .\dev_bds.ps1 start            # start BDS (foreground)
  .\dev_bds.ps1 stop             # stop BDS (by killing process)
  .\dev_bds.ps1 restart          # stop then start
  .\dev_bds.ps1 tail             # tail server.log
  .\dev_bds.ps1 deploy -World my_world [-ServerWide]

Environment variables:
  BDS_ROOT  - root folder of the BDS installation (defaults to C:\game\game_servers\bedrock-server-1.21)
  BDS_WORLD - default world name (defaults to 'worlds')

This script is intended for development convenience only.
#>

param(
  [Parameter(Position=0, Mandatory=$true)]
  [ValidateSet('start','stop','restart','tail','deploy')]
  [string]$Action,

  [string]$World,

  [switch]$ServerWide
)

Set-StrictMode -Version Latest

$script:DefaultBdsRoot = 'C:\game\game_servers\bedrock-server-1.21'
$bdsRoot = $env:BDS_ROOT ? $env:BDS_ROOT : $script:DefaultBdsRoot
$bdsExe = Join-Path $bdsRoot 'bedrock_server.exe'

function Start-Bds {
  if (-not (Test-Path $bdsExe)) {
    Write-Error "bedrock_server.exe not found at $bdsExe"
    return 1
  }
  Write-Output "Starting BDS from $bdsExe"
  Start-Process -FilePath $bdsExe -WorkingDirectory $bdsRoot -NoNewWindow -PassThru | Out-Null
}

function Stop-Bds {
  $proc = Get-Process -Name bedrock_server -ErrorAction SilentlyContinue
  if ($proc) {
    Write-Output "Stopping bedrock_server (Id=$($proc.Id))"
    $proc | Stop-Process -Force
  } else {
    Write-Output "bedrock_server process not found"
  }
}

function Get-BdsLog {
  $log = Join-Path $bdsRoot 'server.log'
  if (-not (Test-Path $log)) {
    Write-Error "Log file not found: $log"
    return 1
  }
  Write-Output "Tailing $log (Ctrl+C to exit)"
  Get-Content -Path $log -Wait -Tail 100
}

function Deploy-Packs {
  param(
    [string]$WorldName,
    [switch]$ServerWide
  )

  $repoRoot = Split-Path -Parent $PSScriptRoot
  $copyScript = Join-Path $repoRoot 'scripts\copy_packs.js'
  if (-not (Test-Path $copyScript)) { Write-Error "copy_packs.js not found at $copyScript"; return 1 }

  if ($ServerWide) {
    Write-Output "Deploying packs server-wide to BDS root: $bdsRoot"
    # Use COPY_BDS_WORLD to indicate server-wide -- will be ignored by script
    $env:COPY_BDS_ROOT = $bdsRoot
    & node $copyScript bds
  } else {
    if (-not $WorldName) { Write-Error "World name is required unless using -ServerWide"; return 1 }
    Write-Output "Deploying packs to world '$WorldName' under BDS root: $bdsRoot"
    $env:COPY_BDS_ROOT = $bdsRoot
    $env:COPY_BDS_WORLD = $WorldName
    & node $copyScript bds
  }
}

switch ($Action) {
  'start' { Start-Bds }
  'stop' { Stop-Bds }
  'restart' { Stop-Bds; Start-Sleep -Seconds 1; Start-Bds }
  'tail' { Get-BdsLog }
  'deploy' { Deploy-Packs -WorldName $World -ServerWide:$ServerWide }
  default { Write-Error "Unknown action: $Action" }
}

exit 0
