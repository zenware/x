<#
.SYNOPSIS
    Simple Windows Backup Entry Point Script
.DESCRIPTION
    Backs up user profile data to a target location using modular backup functions.
.PARAMETER User
    The username whose profile will be backed up.
.PARAMETER TargetPath
    The directory to which the backup will be written.
.PARAMETER Tasks
    Optional list of backup tasks to run (e.g. Documents, AppData).
.PARAMETER Interactive
    If specified, prompts the user for missing parameters interactively.
.EXAMPLE
    .\backup.ps1 -User "jml" -TargetPath "D:\Backups" -Tasks Documents,AppData
#>

param (
    [Parameter(Mandatory = $false)]
    [string]$User,

    [Parameter(Mandatory = $false)]
    [string]$TargetPath,

    [Parameter(Mandatory = $false)]
    [string[]]$Tasks,

    [switch]$Interactive
)

function Prompt-IfMissing {
    param (
        [string]$Name,
        [string]$PromptText
    )

    if (-not (Get-Variable -Name $Name -Scope 1).Value) {
        Set-Variable -Name $Name -Value (Read-Host $PromptText) -Scope 1
    }
}

Prompt-IfMissing -Name 'User' -PromptText "Enter the username to back up"
Prompt-IfMissing -Name 'TargetPath' -PromptText "Enter the destination backup folder path"

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Import-Module "$PSScriptRoot\helpers\Logging.psm1" -Force
Import-Module "$PSScriptRoot\helpers\Validations.psm1" -Force

# Dynamically load backup modules
Get-ChildItem "$PSScriptRoot\modules" -Filter "Backup.*.psm1" | ForEach-Object {
    Import-Module $_.FullName -Force
}

# Prompt for missing inputs
if ($Interactive) {
    if (-not $User)       { $User = Read-Host "Enter the user to back up" }
    if (-not $TargetPath) { $TargetPath = Read-Host "Enter the target backup directory" }
}

if (-not $User) {
    throw "Missing parameter: -User"
}

# Validate parameters
Test-UserExists $User
Test-TargetPathWritable $TargetPath

# Initialize Logging
$LogPath = Join-Path -Path $TargetPath -ChildPath "logs"
New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
Start-Log -LogDirectory $LogPath -Prefix "backup_$User"

Write-Log "Starting backup for user: $User"
$ProfileRoot = "$Env:SystemDrive\Users\$User"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupRoot = Join-Path $TargetPath "$User-$Timestamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

$RegisteredTasks = @{
    "AppData"         = { Backup-AppData         -User $User -ProfileRoot $ProfileRoot -TargetRoot $BackupRoot }
    "Registry"        = { Backup-Registry        -User $User -ProfileRoot $ProfileRoot -TargetRoot $BackupRoot }
    "Browsers"        = { Backup-Browsers        -User $User -ProfileRoot $ProfileRoot -TargetRoot $BackupRoot }
    "UserFolders"     = { Backup-UserFolders     -User $User -ProfileRoot $ProfileRoot -TargetRoot $BackupRoot }
    "PackageManagers" = { Backup-PackageManagers -User $User -ProfileRoot $ProfileRoot -TargetRoot $BackupRoot }
}

if (-not $Tasks) {
    $Tasks = $RegisteredTasks.Keys
}

# Execute selected tasks
foreach ($task in $Tasks) {
    if ($RegisteredTasks.ContainsKey($task)) {
        Write-Log "Starting task: $task"
        try {
            & $RegisteredTasks[$task]
            Write-Log "Completed task: $task"
        } catch {
            Write-Log "Task '$task' failed: $_" "Error"
        }
    } else {
        Write-Log "Unknown task: $task" "Warning"
    }
}

Write-Log "Backup completed. Output saved to: $BackupRoot"
Stop-Log
