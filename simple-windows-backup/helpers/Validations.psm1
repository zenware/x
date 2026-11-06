function Test-UserExists {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$User
    )

    if (-not (Get-LocalUser -Name $User -ErrorAction SilentlyContinue)) {
        throw "User '$User' does not exist on this system."
    }
}

function Test-TargetPathWritable {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )

    try {
        if (-not (Test-Path $Path)) {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
        }
        $testFile = Join-Path $Path "test_write.tmp"
        Set-Content -Path $testFile -Value "test" -Force
        Remove-Item $testFile -Force
    } catch {
        throw "Target path '$Path' is not writable. $_"
    }
}
