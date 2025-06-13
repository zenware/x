<#
.SYNOPSIS
    Restores user profile data from a structured backup directory.
.DESCRIPTION
    Designed to reverse a backup performed by `backup.ps1`, supporting selective restore of profile components.
.PARAMETER User
    The username to restore data to (can be an existing or freshly created user).
.PARAMETER BackupPath
    The root path of the backup (e.g., D:\Backups\jml-2025-06-12_18-32-04).
.PARAMETER Tasks
    Optional list of restore tasks to run (e.g. UserFolders, Registry, PackageManagers).
.PARAMETER RestoreRoot
    Optional override for destination path (defaults to C:\Users\$User).
.PARAMETER Staging
    If specified, restores to staging folder instead of original paths.
.EXAMPLE
    .\restore.ps1 -User "jml" -BackupPath "D:\Backups\jml-2025-06-12_18-32-04" -Tasks UserFolders
#>

param (
    [Parameter(Mandatory = $true)]
    [string]$User,

    [Parameter(Mandatory = $true)]
    [string]$BackupPath,

    [string[]]$Tasks,

    [string]$RestoreRoot = $(Join-Path $env:SystemDrive "Users\$User"),

    [switch]$Staging
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Import-Module "$PSScriptRoot\helpers\Logging.psm1" -Force

# Dynamically load restore modules
Get-ChildItem "$PSScriptRoot\modules" -Filter "Restore.*.psm1" | ForEach-Object {
    Import-Module $_.FullName -Force
}

$LogPath = Join-Path $BackupPath "logs"
Start-Log -LogDirectory $LogPath -Prefix "restore_$User"

Write-Log "Starting restore for user: $User"
Write-Log "Backup path: $BackupPath"
Write-Log "Restore path: $RestoreRoot"
if ($Staging) {
    Write-Log "Running in STAGING mode — no writes to user profile!"
    $RestoreRoot = Join-Path $BackupPath "restored_preview"
    New-Item -ItemType Directory -Path $RestoreRoot -Force | Out-Null
}

# TODO: Add more Restore modules as needed.
$RegisteredTasks = @{
    "UserFolders"     = { Restore-UserFolders -BackupRoot $BackupPath -RestoreRoot $RestoreRoot }
    "Registry"        = { Restore-Registry -BackupRoot $BackupPath -User $User }
    "PackageManagers" = { Restore-PackageManagers -BackupRoot $BackupPath -Staging:$Staging }
}

if (-not $Tasks) {
    $Tasks = $RegisteredTasks.Keys
}

foreach ($task in $Tasks) {
    if ($RegisteredTasks.ContainsKey($task)) {
        Write-Log "Restoring task: $task"
        try {
            & $RegisteredTasks[$task]
            Write-Log "Completed restore for task: $task"
        } catch {
            Write-Log "Task '$task' failed: $_" "Error"
        }
    } else {
        Write-Log "Unknown task: $task" "Warning"
    }
}

Write-Log "Restore complete. Output located at: $RestoreRoot"
Stop-Log
                                                                                        
