function Backup-PackageManagers {
    [CmdletBinding()]
    param (
        [string]$User,
        [string]$ProfileRoot,
        [string]$TargetRoot
    )

    $exportRoot = Join-Path $TargetRoot "PackageManagers"
    New-Item -ItemType Directory -Path $exportRoot -Force | Out-Null

    # WinGet
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        try {
            Write-Log "Exporting WinGet packages"
            winget list --source winget | Out-File -Encoding UTF8 -FilePath (Join-Path $exportRoot "winget.txt")
        } catch {
            Write-Log "Failed to export WinGet packages: $_" "Error"
        }
    } else {
        Write-Log "winget not found - skipping" "Warning"
    }

    # Scoop
    if (Test-Path "$env:USERPROFILE\scoop\shims\scoop.cmd") {
        try {
            Write-Log "Exporting Scoop packages"
            & "$env:USERPROFILE\scoop\shims\scoop.cmd" list | Out-File -Encoding UTF8 -FilePath (Join-Path $exportRoot "scoop.txt")
        } catch {
            Write-Log "Failed to export Scoop packages: $_" "Error"
        }
    } else {
        Write-Log "Scoop not detected - skipping" "Warning"
    }

    # Chocolatey
    if (Get-Command "choco" -ErrorAction SilentlyContinue) {
        try {
            Write-Log "Exporting Chocolatey packages"
            choco list -lo | Out-File -Encoding UTF8 -FilePath (Join-Path $exportRoot "chocolatey.txt")
        } catch {
            Write-Log "Failed to export Chocolatey packages: $_" "Error"
        }
    } else {
        Write-Log "choco not found - skipping" "Warning"
    }
}
