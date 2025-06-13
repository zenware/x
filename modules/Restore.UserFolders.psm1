# Uses robocopy for large folder copies. Operations may take a while on big datasets.
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

            $startInfo = @{
                FilePath    = "robocopy.exe"
                ArgumentList = "`"$src`" `"$dst`" $options"
                NoNewWindow = $true
                Wait        = $true
                PassThru    = $true
            }
            $proc = Start-Process @startInfo
            if ($proc.ExitCode -gt 7) {
                Write-Log "Robocopy failed for $($_.Name) (exit code $($proc.ExitCode))" "Error"
                throw "Robocopy failure"
            }
        } catch {
            Write-Log "Failed to restore folder $($_.Name): $_" "Error"
        }
    }
}
