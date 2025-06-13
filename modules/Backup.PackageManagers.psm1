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
    $scoopCmd = Join-Path $ProfileRoot 'scoop\shims\scoop.cmd'
    if (Test-Path $scoopCmd) {
        try {
            Write-Log "Exporting Scoop packages"
            & $scoopCmd list | Out-File -Encoding UTF8 -FilePath (Join-Path $exportRoot "scoop.txt")
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
