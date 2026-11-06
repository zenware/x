function Restore-AppData {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$BackupRoot,

        [Parameter(Mandatory)]
        [string]$RestoreRoot
    )

    $sourceRoot = Join-Path $BackupRoot "AppData"
    if (-not (Test-Path $sourceRoot)) {
        Write-Log "No AppData found in backup path: $sourceRoot" "Warning"
        return
    }

    foreach ($sub in @("Roaming", "Local")) {
        $src = Join-Path $sourceRoot $sub
        $dst = Join-Path $RestoreRoot "AppData\$sub"

        if (-not (Test-Path $src)) {
            Write-Log "Missing AppData $sub in backup - skipping" "Warning"
            continue
        }

        try {
            Write-Log "Restoring AppData $sub to $dst"
            New-Item -ItemType Directory -Path $dst -Force | Out-Null
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Log "Failed to restore AppData ${sub}: $_" "Error"
        }
    }
}
