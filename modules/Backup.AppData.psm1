# Uses robocopy for large profile copies. Operations may take a while on big datasets.
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
                    ArgumentList = "`"$src`" `"$dst`" $options"
                    NoNewWindow = $true
                    Wait        = $true
                    PassThru    = $true
                }
                $proc = Start-Process @startInfo
                if ($proc.ExitCode -gt 7) {
                    Write-Log "Robocopy failed for $sub (exit code $($proc.ExitCode))" "Error"
                    throw "Robocopy failure"
                }
            } catch {
                Write-Log "Exception during robocopy of AppData $sub: $_" "Error"
            }
        } else {
            Write-Log "Missing AppData $sub - skipping" "Warning"
        }
    }
}
