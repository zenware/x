$global:LogFile = $null

function Start-Log {
    param (
        [string]$LogDirectory,
        [string]$Prefix = "backup"
    )
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $global:LogFile = Join-Path $LogDirectory "$Prefix-$timestamp.log"
    Write-Log "Logging started at $LogFile"
}

function Write-Log {
    param (
        [string]$Message,
        [ValidateSet("Info", "Warning", "Error")]
        [string]$Level = "Info"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "[$timestamp] [$Level] $Message"
    Write-Host $entry
    if ($global:LogFile) {
        Add-Content -Path $global:LogFile -Value $entry
    }
}

function Stop-Log {
    Write-Log "Logging finished."
}
