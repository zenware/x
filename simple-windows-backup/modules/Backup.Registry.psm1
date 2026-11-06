function Backup-Registry {
    [CmdletBinding()]
    param (
        [string]$User,
        [string]$ProfileRoot,
        [string]$TargetRoot
    )

    $regPath = Join-Path $TargetRoot "Registry-$User.reg"
    try {
        Write-Log "Exporting registry for user $User"
        $sid = (Get-LocalUser -Name $User).SID.Value
        reg.exe export "HKU\$sid" $regPath /y | Out-Null
    } catch {
        Write-Log "Failed to export registry: $_" "Error"
        throw
    }
}
