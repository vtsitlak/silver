# Open Android Studio with the Tabata AI Android project
# This script clears conflicting Java environment variables
# Run from repo root or from apps/tabata-ai (script lives in apps/tabata-ai/scripts).

param(
    [string]$ProjectPath = "android"
)

# Use Android Studio2 - the only complete installation with idea.properties
$StudioPath = "C:\Program Files\Android\Android Studio2\bin\studio64.exe"

# Fallback to other locations if needed
if (-not (Test-Path $StudioPath)) {
    $StudioPath = "C:\Program Files\Android\Android Studio1\bin\studio64.exe"
}
if (-not (Test-Path $StudioPath)) {
    $StudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
}
if (-not (Test-Path $StudioPath)) {
    $StudioPath = "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe"
}

if (-not (Test-Path $StudioPath)) {
    Write-Error "Android Studio not found at: $StudioPath"
    Write-Host "Please install Android Studio from https://developer.android.com/studio"
    exit 1
}

# Script is in apps/tabata-ai/scripts; project is apps/tabata-ai/android
$FullProjectPath = Join-Path $PSScriptRoot "..\$ProjectPath" | Resolve-Path -ErrorAction SilentlyContinue

if (-not $FullProjectPath) {
    $FullProjectPath = Join-Path (Get-Location) $ProjectPath
}

if (-not (Test-Path $FullProjectPath)) {
    Write-Error "Project path not found: $FullProjectPath"
    exit 1
}

Write-Host "Opening Android Studio with project: $FullProjectPath"

# Start Android Studio without inheriting JAVA_HOME to avoid conflicts
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $StudioPath
$psi.Arguments = "`"$FullProjectPath`""
$psi.UseShellExecute = $false

# Remove conflicting environment variables
$psi.EnvironmentVariables.Remove("JAVA_HOME")
$psi.EnvironmentVariables.Remove("STUDIO_JDK")
$psi.EnvironmentVariables.Remove("JDK_HOME")

[System.Diagnostics.Process]::Start($psi) | Out-Null

Write-Host "Android Studio is starting..."
