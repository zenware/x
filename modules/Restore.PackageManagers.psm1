function Restore-PackageManagers {
    [CmdletBinding()]
    param (
        [string]$BackupRoot,
        [switch]$Staging
    )

    $pkgDir = Join-Path $BackupRoot "PackageManagers"
    if (-not (Test-Path $pkgDir)) {
        Write-Log "PackageManagers folder not found — skipping" "Warning"
        return
    }

    Write-Log "Restoring package manager logs to staging (manual reinstallation required)"
    $target = $Staging ? (Join-Path $BackupRoot "restored_preview\PackageManagers") : "$env:TEMP\restored_packages"
    Copy-Item -Path $pkgDir -Destination $target -Recurse -Force -ErrorAction Stop
    Write-Log "Saved package list copied to $target"
}
