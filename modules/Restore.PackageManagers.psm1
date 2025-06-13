# Uses robocopy for large folder copies. Operations may take a while on big datasets.
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

    $logicalCores = [Environment]::ProcessorCount
    $threadCount = [Math]::Max(1, [Math]::Floor($logicalCores / 2))
    $options = @(
        "/MIR",
        "/Z",
        "/R:3",
        "/W:5",
        "/NP",
        "/NFL",
        "/NDL",
        "/MT:$threadCount"
    ) -join " "

    try {
        $startInfo = @{
            FilePath    = "robocopy.exe"
            ArgumentList = "`"$pkgDir`" `"$target`" $options"
            NoNewWindow = $true
            Wait        = $true
            PassThru    = $true
        }
        $proc = Start-Process @startInfo
        if ($proc.ExitCode -gt 7) {
            Write-Log "Robocopy failed restoring PackageManagers (exit code $($proc.ExitCode))" "Error"
            throw "Robocopy failure"
        }
    } catch {
        Write-Log "Exception during robocopy of PackageManagers: $_" "Error"
    }
    Write-Log "Saved package list copied to $target"
}
