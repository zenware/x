function Backup-Documents {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$User,

        [Parameter(Mandatory)]
        [string]$ProfileRoot,

        [Parameter(Mandatory)]
        [string]$TargetRoot,

        [switch]$FullProfile
    )

    $logicalCores = [Environment]::ProcessorCount
    $threadCount = [Math]::Max(1, [Math]::Floor($logicalCores / 2))

    $options = @(
        "/MIR",  # Mirror source to destination (adds/deletes to match source)
        "/Z",    # Use restartable mode (for resilience during network interruptions)
        "/R:3",  # Retry 3 times on failed file copies
        "/W:5",  # Wait 5 seconds between retries
        "/NP",   # No progress output (keep the log clean)
        "/NFL",  # No file list ~
        "/NDL",  # No directory list ~
        "/MT:$threadCount"
    ) -join " "

    if ($FullProfile) {
        $excluded = @(
            "AppData", 
            "NTUSER.DAT", 
            "ntuser.dat.log", 
            "Local Settings", 
            "Start Menu", 
            "Cookies", 
            "Recent", 
            "Temp"
        )
        
        $foldersToCopy = Get-ChildItem -Path $ProfileRoot -Directory -Force | Where-Object {
            $_.Name -notin $excluded
        } | ForEach-Object { $_.Name }
        Write-Log "FullProfile mode: backing up all visible and hidden folders (except exclusions)"
    } else {
        $foldersToCopy = @("Documents", "Downloads", "Pictures", "Videos", "Music", "Desktop")
        Write-Log "Standard mode: backing up primary user folders only"
    }

    foreach ($folder in $foldersToCopy) {
        $Source = Join-Path $ProfileRoot $folder
        $Destination = Join-Path $TargetRoot "UserFolders/$folder"
        
        if (-not (Test-Path $Source)) {
            Write-Log "Skipping missing folder: $Source" "Warning"
            continue
        }
        
        try {
            Write-Log "Copying '$Source' to '$Destination'"
            $startInfo = @{
                FilePath = "robocopy.exe"
                ArgumentList = "`"$source`" `"$destination`" $options"
                NoNewWindow = $true
                Wait = $true
                PassThru = $true
            }
            $proc = Start-Process @startInfo
            if ($proc.ExitCode -gt 7) {
                Write-Log "Robocopy failed for $folder (exit code $($proc.ExitCode))" "Error"
                throw "Robocopy failure"
            }
        } catch {
            Write-Log "Exception during robocopy of ${folder}: $_" "Error"
        }
    }
}
