# Mobile Preview Guide for Tabata AI

This guide explains how to preview the Tabata AI app on Android and iOS devices/emulators from Cursor.

**Web browser:** When viewing the app in a desktop browser, switch to **mobile view** (Chrome DevTools device toolbar or responsive mode) for the best experience. The UI is designed for mobile-first layout.

## Prerequisites

### For Android Development

1. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
2. **Android SDK** - Installed via Android Studio
3. **Android Emulator** or a physical Android device with USB debugging enabled
4. **Java JDK 17+** - Required for Gradle builds

### For iOS Development (macOS only)

1. **Xcode** - Download from the Mac App Store
2. **Xcode Command Line Tools** - Run `xcode-select --install`
3. **CocoaPods** - Run `sudo gem install cocoapods`
4. **iOS Simulator** or a physical iOS device with a valid provisioning profile

## Quick Start Commands

### Using npm Scripts

```bash
# Build and sync to all platforms
npm run cap:sync:tabata-ai

# Open in Android Studio (build + sync + open IDE)
npm run cap:android:tabata-ai

# Open in Xcode (build + sync + open IDE)
npm run cap:ios:tabata-ai

# Run directly on Android device/emulator
npm run cap:run:android:tabata-ai

# Run directly on iOS simulator
npm run cap:run:ios:tabata-ai

# Live reload on Android (hot reload during development)
npm run cap:live:android:tabata-ai

# Live reload on iOS (hot reload during development)
npm run cap:live:ios:tabata-ai
```

### Using Cursor Tasks

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Type "Tasks: Run Task"
3. Select one of the Tabata AI tasks:
    - **Tabata AI: Build & Sync** - Build and sync to native platforms
    - **Tabata AI: Open Android Studio** - Open project in Android Studio
    - **Tabata AI: Open Xcode (iOS)** - Open project in Xcode
    - **Tabata AI: Run on Android Device/Emulator** - Deploy to Android
    - **Tabata AI: Run on iOS Simulator** - Deploy to iOS
    - **Tabata AI: Live Reload Android** - Development with hot reload
    - **Tabata AI: Live Reload iOS** - Development with hot reload

## Development Workflows

### Standard Development (Recommended)

1. **Start the dev server** for web preview:

    ```bash
    npm run start:tabata-ai
    ```

    This opens the app at http://localhost:4200 with hot reload.

2. **Use Chrome DevTools** to simulate mobile devices:
    - Open Chrome DevTools (F12)
    - Click the device toolbar icon or press `Ctrl+Shift+M`
    - Select a device preset (iPhone, Pixel, etc.)

### Native Preview (Android)

1. **Start an Android Emulator** from Android Studio:
    - Open Android Studio
    - Go to Tools > Device Manager
    - Create or start an emulator

2. **Run the app**:
    ```bash
    npm run cap:run:android:tabata-ai
    ```

### Native Preview (iOS - macOS only)

1. **Run the app on simulator**:

    ```bash
    npm run cap:run:ios:tabata-ai
    ```

2. **Or open in Xcode** for more control:
    ```bash
    npm run cap:ios:tabata-ai
    ```
    Then press the Play button in Xcode.

### Live Reload Development

For the fastest development experience with native features:

1. **Start the dev server**:

    ```bash
    npm run start:tabata-ai
    ```

2. **In a separate terminal**, run with live reload:

    ```bash
    # For Android
    npm run cap:live:android:tabata-ai

    # For iOS
    npm run cap:live:ios:tabata-ai
    ```

This allows you to see changes instantly on the device/emulator.

## Capacitor CLI Commands

For more control, use the Capacitor CLI directly from the app directory:

```bash
cd apps/tabata-ai

# Sync web assets to native projects
npx cap sync

# Sync only to Android
npx cap sync android

# Sync only to iOS
npx cap sync ios

# Open Android Studio
npx cap open android

# Open Xcode
npx cap open ios

# Run on device (auto-selects connected device or emulator)
npx cap run android
npx cap run ios

# Run on specific device
npx cap run android --target <device-id>
npx cap run ios --target <simulator-name>

# List available devices
npx cap run android --list
npx cap run ios --list
```

## Building an APK (Android)

`npm run cap:android:tabata-ai` only builds the web app, syncs to Android, and opens Android Studio. It does **not** build an APK.

### Build APK (one command)

From the **repo root**, you can build the debug APK without setting `JAVA_HOME` manually. The script finds JDK 17 (or 21), stops old Gradle daemons, and runs the build:

```bash
npm run build-apk:tabata-ai
```

The APK is written to `apps/tabata-ai/android/app/build/outputs/apk/debug/app-debug.apk`. If no JDK 17/21 is found, the script prints where to install it (e.g. [Adoptium](https://adoptium.net/)).

### Build APK (manual Gradle)

To produce an APK using Gradle directly (ensure `JAVA_HOME` points to JDK 17+ first):

1. **On Windows** (from repo root or from `apps/tabata-ai/android`):

   ```bash
   cd apps/tabata-ai/android
   .\gradlew.bat assembleDebug
   ```

2. **On macOS/Linux:**

   ```bash
   cd apps/tabata-ai/android
   ./gradlew assembleDebug
   ```

3. Wait until the end of the run. You must see **`BUILD SUCCESSFUL`**. The first run can take several minutes (Gradle download, daemon, dependencies). If the build fails, fix the reported errors before looking for the APK.

4. **Where the APK is saved:**

   - Full path: `apps/tabata-ai/android/app/build/outputs/apk/debug/app-debug.apk`
   - The `app/build` folder is gitignored, but the file is on disk after a successful build.

If you only see a `logs` folder under `android/build/outputs`, that is from the root project; the APK is under **`android/app/build/outputs/apk/debug/`**. If that folder or `app-debug.apk` is missing, the build did not finish successfully—re-run `.\gradlew.bat assembleDebug` and wait for `BUILD SUCCESSFUL`.

From Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)** creates the same debug APK in the path above.

## Troubleshooting

### Android Issues

**"SDK location not found"**

- Set `ANDROID_HOME` environment variable to your Android SDK path
- Or create `apps/tabata-ai/android/local.properties` with:
    ```
    sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
    ```

**"No connected devices"**

- Start an emulator from Android Studio Device Manager
- Or connect a physical device with USB debugging enabled

**Gradle build fails**

- Ensure Java JDK 17+ is installed
- Run `cd apps/tabata-ai/android && ./gradlew clean`

**"No matching variant... compatible with Java 8" / "Java 11" when running `gradlew assembleDebug`**

The Android Gradle Plugin and Google Services require **Java 11+**. Gradle is using Java 8 (often from an old `JAVA_HOME`). Fix:

1. Install [JDK 17 or 21 LTS](https://adoptium.net/) if needed. **Java 25 is not supported** by Gradle 8.7 ("Unsupported class file major version 69"); use Temurin 17 or 21.
2. Point `JAVA_HOME` at JDK 17 **before** running Gradle. In PowerShell (one-time for that terminal):
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot"   # or your JDK 17 path
   cd apps\tabata-ai\android
   .\gradlew.bat assembleDebug
   ```
   Or set `JAVA_HOME` in System Environment Variables to the JDK 17 folder, then reopen the terminal.
3. Stop any old Gradle daemons that might be using Java 8: `.\gradlew.bat --stop`, then run `.\gradlew.bat assembleDebug` again.

**"Unsupported class file major version 69" or Java 25**

Gradle 8.7 does not support Java 25. Use **JDK 17 or 21 LTS** for the Android build. Install [Temurin 17 or 21](https://adoptium.net/) (default path is fine); the `build-apk:tabata-ai` script will pick it up and ignore Java 25.

**"Could not find installation home path" or Java-related errors**
This happens when an old `JAVA_HOME` environment variable conflicts with Android Studio's bundled JDK.

Solution 1 - Use the provided script:

```bash
npm run cap:android:tabata-ai
```

Solution 2 - Open Android Studio directly:

```powershell
# Clear Java environment and open Android Studio
$env:JAVA_HOME = $null
Start-Process "C:\Program Files\Android\Android Studio\bin\studio64.exe" -ArgumentList "apps\tabata-ai\android"
```

Solution 3 - Fix system environment:

1. Open System Properties > Environment Variables
2. Remove or update `JAVA_HOME` to point to JDK 17+
3. Remove `STUDIO_JDK` if present
4. Restart your terminal/IDE

### iOS Issues

**"CocoaPods not installed"**

```bash
sudo gem install cocoapods
cd apps/tabata-ai/ios/App && pod install
```

**"Signing certificate required"**

- Open the project in Xcode
- Go to Signing & Capabilities
- Select your development team

**Simulator not starting**

- Open Xcode > Window > Devices and Simulators
- Create a new simulator if needed

### General Issues

**Changes not appearing**

```bash
# Full rebuild and sync
npm run cap:sync:tabata-ai
```

**"Web assets not found"**

- Ensure you've built the app first:
    ```bash
    npx nx build tabata-ai --configuration=development
    ```

## Project Structure

```
apps/tabata-ai/
├── android/          # Android native project (Android Studio)
│   ├── app/
│   │   └── src/main/
│   │       ├── java/         # Native Android code
│   │       └── res/          # Android resources
│   └── build.gradle
├── ios/              # iOS native project (Xcode)
│   └── App/
│       ├── App/              # Native iOS code
│       ├── App.xcodeproj/
│       └── Podfile
├── src/              # Angular source code
└── capacitor.config.ts
```

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Ionic Framework Docs](https://ionicframework.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
