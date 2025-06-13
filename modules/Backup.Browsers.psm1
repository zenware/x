# Uses robocopy for large profile copies. Operations may take a while on big datasets.
function Backup-Browsers {
    [CmdletBinding()]
    param (
        [string]$User,
        [string]$ProfileRoot,
        [string]$TargetRoot
    )

    $browserRoots = @{
        "Chrome"  = "$ProfileRoot\AppData\Local\Google\Chrome\User Data"
        "Firefox" = "$ProfileRoot\AppData\Roaming\Mozilla\Firefox\Profiles"
        "Edge"    = "$ProfileRoot\AppData\Local\Microsoft\Edge\User Data"
        "Brave"   = "$ProfileRoot\AppData\Local\BraveSoftware\Brave-Browser\User Data"
        "Arc"     = "$ProfileRoot\AppData\Local\Arc\User Data"
        "Zen"     = "$ProfileRoot\AppData\Local\ZenBrowser\User Data"
    }

    foreach ($browser in $browserRoots.Keys) {
        $src = $browserRoots[$browser]
        $dst = Join-Path $TargetRoot "Browsers\$browser"
        if (Test-Path $src) {
            Write-Log "Backing up $browser profiles"

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
                    Write-Log "Robocopy failed for $browser (exit code $($proc.ExitCode))" "Error"
                    throw "Robocopy failure"
                }
            } catch {
                Write-Log "Exception during robocopy of $browser: $_" "Error"
            }
        } else {
            Write-Log "$browser profile not found - skipping" "Warning"
        }
    }
}
