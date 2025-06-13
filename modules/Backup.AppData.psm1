function Backup-AppData {
    [CmdletBinding()]
    param (
        [string]$User,
        [string]$ProfileRoot,
        [string]$TargetRoot
    )

    $AppDataRoot = Join-Path $ProfileRoot "AppData"
    $DestRoot    = Join-Path $TargetRoot "AppData"

    foreach ($sub in @("Roaming", "Local")) {
        $src = Join-Path $AppDataRoot $sub
        $dst = Join-Path $DestRoot $sub
        if (Test-Path $src) {
            Write-Log "Backing up AppData $sub"
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
        } else {
            Write-Log "Missing AppData $sub - skipping" "Warning"
        }
    }
}
