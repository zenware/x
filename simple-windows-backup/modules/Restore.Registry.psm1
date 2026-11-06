function Restore-Registry {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$BackupRoot,

        [Parameter(Mandatory)]
        [string]$User
    )

    $regFile = Join-Path $BackupRoot "Registry-$User.reg"
    if (-not (Test-Path $regFile)) {
        Write-Log "Registry file not found: $regFile" "Warning"
        return
    }

    try {
        Write-Log "Restoring registry from $regFile"
        reg.exe import $regFile | Out-Null
    } catch {
        Write-Log "Registry import failed: $_" "Error"
    }
}
