
# Simple Windows Backup

PowerShell-based user data backup script for Windows desktops, laptops, and homelab systems. Ideal for full profile backups before OS reinstall or migration.

## Features
- Modular backup tasks (Documents, AppData, Registry, etc.)
- Logs to file and console
- Idempotent/Safe to run multiple times
- Works interactive or headless
- Ideal for use with removable drives and network shares

## Usage

```powershell
.\backup.ps1 -User jml -TargetPath D:\Backups\jml -Tasks Documents,AppData
```

## Manual Checklist

- [ ] Close All Running Applications (Helps avoid file-busy interference)
- [ ] Mount NAS or Attach External Drive
- [ ] Confirm Target Path is Accessible
- [ ] Ensure sufficient disk space

**Note:** These scripts generally need to run in an elevated PowerShell session
so they can access registry hives and protected system folders.

## Restore Usage

```powershell
./restore.ps1 -User jml -BackupPath D:\Backups\jml -Tasks Documents,Registry
```
