function Restore-Browsers {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$BackupRoot,

        [Parameter(Mandatory)]
        [string]$RestoreRoot
    )

    $sourceBase = Join-Path $BackupRoot "Browsers"
    if (-not (Test-Path $sourceBase)) {
        Write-Log "No Browsers data found in backup path: $sourceBase" "Warning"
        return
    }

    $browserTargets = @{
        "Chrome"  = "$RestoreRoot\AppData\Local\Google\Chrome\User Data"
        "Firefox" = "$RestoreRoot\AppData\Roaming\Mozilla\Firefox\Profiles"
        "Edge"    = "$RestoreRoot\AppData\Local\Microsoft\Edge\User Data"
        "Brave"   = "$RestoreRoot\AppData\Local\BraveSoftware\Brave-Browser\User Data"
        "Arc"     = "$RestoreRoot\AppData\Local\Arc\User Data"
        "Zen"     = "$RestoreRoot\AppData\Local\ZenBrowser\User Data"
    }

    foreach ($browser in $browserTargets.Keys) {
        $src = Join-Path $sourceBase $browser
        $dst = $browserTargets[$browser]

        if (-not (Test-Path $src)) {
            Write-Log "Backup for $browser not found - skipping" "Warning"
            continue
        }

        try {
            Write-Log "Restoring $browser profile to $dst"
            New-Item -ItemType Directory -Path $dst -Force | Out-Null
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Log "Failed to restore $browser profile: $_" "Error"
        }
    }
}
