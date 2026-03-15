# Run the app on a connected Android device or emulator using JDK 17/21 (required by Gradle 8.7).
# Run from repo root: npm run cap:run:android:tabata-ai
# Or from apps/tabata-ai: .\scripts\run-android.ps1
# To pick a specific device: npm run cap:run:android:tabata-ai -- --target <device-id>
# List devices: cd apps/tabata-ai && npx cap run android --list

$ErrorActionPreference = "Stop"

function Get-JavaMajorVersion {
    param([string]$JdkPath)
    $javaExe = Join-Path $JdkPath "bin\java.exe"
    if (-not (Test-Path $javaExe)) { return 0 }
    try {
        $versionLine = & $javaExe -version 2>&1 | Select-Object -First 1
        if ($versionLine -match '"1\.([0-9]+)\.[0-9_]+"') { return [int]$Matches[1] }
        if ($versionLine -match '"([0-9]+)\.') { return [int]$Matches[1] }
    } catch {}
    return 0
}

function Find-Jdk17Or21 {
    $globPaths = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Eclipse Adoptium\jdk-21*",
        "C:\Program Files\Microsoft\jdk-17*",
        "C:\Program Files\Microsoft\jdk-21*",
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Java\jdk-21*"
    )
    foreach ($pattern in $globPaths) {
        $resolved = Get-Item $pattern -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
        if ($resolved -and (Test-Path (Join-Path $resolved.FullName "bin\java.exe"))) {
            return $resolved.FullName
        }
    }
    $scanRoots = @(
        "C:\Program Files\Java",
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Microsoft",
        "$env:LOCALAPPDATA\Programs\Eclipse Adoptium",
        "$env:LOCALAPPDATA\Programs\Microsoft"
    )
    foreach ($root in $scanRoots) {
        if (-not (Test-Path $root)) { continue }
        $candidates = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue
        $jdk17 = $candidates | Where-Object { $_.Name -match '^jdk-17' } | Sort-Object Name -Descending | Select-Object -First 1
        $jdk21 = $candidates | Where-Object { $_.Name -match '^jdk-21' } | Sort-Object Name -Descending | Select-Object -First 1
        foreach ($dir in @($jdk17, $jdk21) + ($candidates | Where-Object { $_.Name -notmatch '^jdk-(17|21)' })) {
            if (-not $dir) { continue }
            $path = $dir.FullName
            $major = Get-JavaMajorVersion $path
            if ((Test-Path (Join-Path $path "bin\java.exe")) -and $major -ge 11 -and $major -le 21) {
                return $path
            }
        }
    }
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
        $major = Get-JavaMajorVersion $env:JAVA_HOME
        if ($major -ge 11 -and $major -le 21) { return $env:JAVA_HOME }
    }
    return $null
}

$jdk = Find-Jdk17Or21
if (-not $jdk) {
    Write-Host "JDK 17 or 21 not found. Gradle 8.7 does not support Java 25." -ForegroundColor Red
    Write-Host "Install Temurin JDK 17 or 21 from https://adoptium.net/ then run again." -ForegroundColor Yellow
    exit 1
}

$appRoot = Join-Path $PSScriptRoot ".." | Resolve-Path
$androidDir = Join-Path $appRoot "android"
$env:JAVA_HOME = $jdk
Write-Host "Using JAVA_HOME=$jdk" -ForegroundColor Cyan
Set-Location $appRoot

# Stop Gradle daemons so the next run uses JDK 17
try { cmd /c "android\gradlew.bat --stop 2>nul" } catch { }

# Run on device/emulator (pass through any args, e.g. --target <id>)
& npx cap run android @args
exit $LASTEXITCODE
