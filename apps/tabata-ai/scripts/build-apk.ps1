# Build debug APK using JDK 17 or 21 (Gradle 8.7 does not support Java 25).
# Run from repo root: npm run build-apk:tabata-ai
# Or from apps/tabata-ai: .\scripts\build-apk.ps1

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

function Test-Jdk11OrNewer {
    param([string]$JdkPath)
    return (Get-JavaMajorVersion $JdkPath) -ge 11
}

function Find-Jdk17Or21 {
    # Prefer 17, then 21. Gradle 8.7 does not support Java 25 (class file version 69).
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
        $preferred = @($jdk17, $jdk21) | Where-Object { $_ }
        $others = $candidates | Where-Object { $_.Name -notmatch '^jdk-(17|21)' }
        foreach ($dir in $preferred + $others) {
            $path = $dir.FullName
            $major = Get-JavaMajorVersion $path
            if ((Test-Path (Join-Path $path "bin\java.exe")) -and $major -ge 11 -and $major -le 21) {
                return $path
            }
        }
    }

    $envJdk = $env:JAVA_HOME
    if ($envJdk -and (Test-Path (Join-Path $envJdk "bin\java.exe"))) {
        $major = Get-JavaMajorVersion $envJdk
        if ($major -ge 11 -and $major -le 21) { return $envJdk }
    }
    return $null
}

$jdk = Find-Jdk17Or21
if (-not $jdk) {
    Write-Host "JDK 17 or 21 not found. Gradle 8.7 does not support Java 25." -ForegroundColor Red
    Write-Host "Script checked: C:\Program Files\Java, Eclipse Adoptium, Microsoft; JAVA_HOME (if 17 or 21)." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Install Temurin JDK 17 or 21 LTS from https://adoptium.net/ (use default path), then run again." -ForegroundColor Yellow
    exit 1
}

$androidDir = Join-Path $PSScriptRoot "..\android" | Resolve-Path
$env:JAVA_HOME = $jdk
Write-Host "Using JAVA_HOME=$jdk" -ForegroundColor Cyan
Set-Location $androidDir

# Stop existing daemons (they may be using an older Java). Run via cmd so Java 25 stderr warning does not stop the script.
try { cmd /c "gradlew.bat --stop 2>nul" } catch { }

# Build debug APK
& .\gradlew.bat assembleDebug
$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    $apk = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
    Write-Host ""
    Write-Host "APK built: $apk" -ForegroundColor Green
}
exit $exitCode
