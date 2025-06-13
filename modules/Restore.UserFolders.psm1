function Restore-UserFolders {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$BackupRoot,

        [Parameter(Mandatory)]
        [string]$RestoreRoot
    )

    $sourcePath = Join-Path $BackupRoot "UserFolders"

    if (-not (Test-Path $sourcePath)) {
        Write-Log "No UserFolders found in backup path: $sourcePath" "Warning"
        return
    }

    Write-Log "Restoring user folders from $sourcePath to $RestoreRoot"

    Get-ChildItem -Path $sourcePath -Directory | ForEach-Object {
        $src = $_.FullName
        $dst = Join-Path $RestoreRoot $_.Name

        try {
            Write-Log "Copying $($_.Name) to $dst"
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Log "Failed to restore folder $($_.Name): $_" "Error"
        }
    }
}
