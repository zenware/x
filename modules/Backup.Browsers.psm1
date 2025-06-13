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
            Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
        } else {
            Write-Log "$browser profile not found - skipping" "Warning"
        }
    }
}
