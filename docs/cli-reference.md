# CLI Reference

This document provides a comprehensive reference for all Deploid CLI commands and options.

## Global Options

| Option | Description |
|--------|-------------|
| `-V, --version` | Output the version number |
| `-h, --help` | Display help for command |

## Commands

### `deploid init`

Initialize a new Deploid project.

```bash
deploid init [options]
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `-f, --framework <framework>` | `string` | `vite` | Web framework (vite\|next\|cra\|static) |
| `-p, --packaging <engine>` | `string` | `capacitor` | Android packaging engine (capacitor\|tauri\|twa) |

#### Examples

```bash
# Initialize with defaults (Vite + Capacitor)
deploid init

# Initialize for Next.js with Capacitor
deploid init --framework next --packaging capacitor

# Initialize for Vite with Tauri
deploid init --framework vite --packaging tauri
```

#### Generated Files

- `deploid.config.ts` - Configuration file
- `assets/` - Directory for your logo
- `assets-gen/` - Generated assets output
- `capacitor.config.json` - Capacitor configuration (if using Capacitor)

### `deploid assets`

Generate all required icons and screenshots from your logo.

```bash
deploid assets
```

#### Generated Assets

**Android Icons**:
- `assets-gen/android/mipmap-mdpi/ic_launcher.png` (48x48)
- `assets-gen/android/mipmap-hdpi/ic_launcher.png` (72x72)
- `assets-gen/android/mipmap-xhdpi/ic_launcher.png` (96x96)
- `assets-gen/android/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `assets-gen/android/mipmap-xxxhdpi/ic_launcher.png` (192x192)

**PWA Icons**:
- `assets-gen/icon-192.png` (192x192)
- `assets-gen/icon-512.png` (512x512)
- `assets-gen/apple-touch-icon.png` (180x180)

**Favicons**:
- `assets-gen/favicon-16x16.png` (16x16)
- `assets-gen/favicon-32x32.png` (32x32)
- `assets-gen/favicon-48x48.png` (48x48)
- `assets-gen/favicon-64x64.png` (64x64)

#### Requirements

- Source logo at `assets/logo.svg` (or path specified in config)
- Logo should be at least 512x512 pixels for best results

### `deploid package`

Wrap your web app for Android using the configured packaging engine.

```bash
deploid package
```

#### Capacitor Packaging

For Capacitor packaging, this command:

1. **Checks Capacitor CLI** - Installs if not found
2. **Initializes Capacitor** - Creates `capacitor.config.json`
3. **Builds Web App** - Runs your build command
4. **Syncs Assets** - Copies web assets to Capacitor
5. **Adds Android Platform** - Creates Android project
6. **Updates Configuration** - Sets SDK versions, permissions, etc.

#### Generated Files

- `android/` - Android project directory
- `capacitor.config.json` - Capacitor configuration
- `android/app/src/main/AndroidManifest.xml` - Android manifest

### `deploid build`

Build APK/AAB packages for Android.

```bash
deploid build
```

#### Generated Packages

**Debug Build**:
- `android/app/build/outputs/apk/debug/app-debug.apk`

**Release Build** (with signing):
- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release.apk`

#### Requirements

- Android project must exist (run `deploid package` first)
- Android Studio and SDK must be installed
- For release builds: signing configuration required

### `deploid debug`

Add network debugging tools to your project for troubleshooting connectivity issues.

```bash
deploid debug
```

#### Generated Files

- `src/components/NetworkDebug.tsx` - React component for network testing
- Adds network connectivity testing to your app
- Tests API endpoints, domain connectivity, and provides debug information

#### Usage

The debug component will be added to your project and can be imported and used in your React components for testing network connectivity during development.

### `deploid deploy`

Deploy APK to connected Android devices.

```bash
deploid deploy [options]
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `-f, --force` | `boolean` | Force install (overwrite existing app) |
| `-l, --launch` | `boolean` | Launch app after installation |

#### Requirements

- Android device connected via USB with USB debugging enabled
- ADB (Android Debug Bridge) installed
- APK must be built (run `deploid build` first)

#### Examples

```bash
# Deploy to all connected devices
deploid deploy

# Force install and launch app
deploid deploy --force --launch
```

### `deploid devices`

List connected Android devices.

```bash
deploid devices
```

#### Output

Shows all connected Android devices with their device IDs and connection status.

### `deploid logs`

View app logs from connected device.

```bash
deploid logs
```

#### Requirements

- Android device connected
- App must be installed on device

### `deploid uninstall`

Uninstall app from connected devices.

```bash
deploid uninstall
```

#### Requirements

- Android device connected
- App must be installed on device

### `deploid ios`

Prepare iOS project for Mac handoff.

```bash
deploid ios
```

#### Generated Files

- `ios/` - Complete iOS Xcode project
- `ios/App/App/Info.plist` - iOS app configuration
- `ios/App/App/App.entitlements` - iOS capabilities
- `ios/Podfile` - CocoaPods dependencies
- `ios/Config/` - Build configuration files
- `docs/IOS_HANDBOOK.md` - Mac handoff instructions

#### Requirements

- Capacitor CLI installed
- Node.js and npm available

### `deploid ios:assets`

Generate iOS app icons and launch screens.

```bash
deploid ios:assets
```

#### Generated Assets

- iOS app icon set (all required sizes)
- Launch screen assets
- Asset catalog structure

### `deploid ios:handbook`

Generate iOS handoff documentation.

```bash
deploid ios:handbook
```

#### Generated Files

- `docs/IOS_HANDBOOK.md` - Complete Mac setup guide
- Step-by-step Xcode instructions
- Troubleshooting guide
- TestFlight distribution steps

### `deploid publish`

Upload build to Play Store or GitHub Releases.

```bash
deploid publish
```

#### Supported Targets

**Play Store**:
- Internal testing track
- Alpha testing track
- Beta testing track
- Production track

**GitHub Releases**:
- Draft releases
- Published releases
- Release notes from CHANGELOG.md

#### Requirements

**Play Store**:
- Google service account JSON file
- App must be created in Play Console
- Release track must be configured

**GitHub Releases**:
- GitHub repository access
- Personal access token or GitHub Actions

## Environment Variables

### Debug Logging

```bash
# Enable debug logging
export DEPLOID_LOG_LEVEL="debug"
deploid assets
```

### Android Signing

```bash
# Set keystore passwords
export ANDROID_STORE_PWD="your-store-password"
export ANDROID_KEY_PWD="your-key-password"
```

### GitHub Publishing

```bash
# Set GitHub token
export GITHUB_TOKEN="your-github-token"
```

## Log Levels

| Level | Description |
|-------|-------------|
| `debug` | Detailed debugging information |
| `info` | General information (default) |
| `warn` | Warning messages |
| `error` | Error messages only |

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Configuration error |
| `3` | Plugin error |
| `4` | Build error |

## Examples

### Complete Workflow

```bash
# 1. Initialize project
deploid init --framework vite --packaging capacitor

# 2. Add your logo
cp your-logo.svg assets/logo.svg

# 3. Generate assets
deploid assets

# 4. Package for Android
deploid package

# 5. Build APK/AAB
deploid build

# 6. Publish to stores
deploid publish
```

### Development Workflow

```bash
# Quick development build
deploid assets
deploid package
deploid build
```

### Production Release

```bash
# Production release with signing
export ANDROID_STORE_PWD="production-password"
export ANDROID_KEY_PWD="production-key-password"
deploid build
deploid publish
```

## Troubleshooting

### Common Issues

**1. "No deploid config found"**
```bash
# Make sure you're in the project directory
cd your-project
deploid init
```

**2. "Source logo not found"**
```bash
# Add your logo to the assets directory
cp your-logo.svg assets/logo.svg
```

**3. "Capacitor CLI not found"**
```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli
```

**4. "Android project not found"**
```bash
# Run package command first
deploid package
```

**5. "Build failed"**
```bash
# Check Android Studio setup
npx @capacitor/cli doctor

# Clean and rebuild
rm -rf android/
deploid package
deploid build
```

### Debug Mode

```bash
# Enable debug logging for troubleshooting
DEPLOID_LOG_LEVEL=debug deploid assets
DEPLOID_LOG_LEVEL=debug deploid package
DEPLOID_LOG_LEVEL=debug deploid build
```

### Configuration Validation

```bash
# Check if configuration is valid
deploid init --help
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Build and Publish
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Deploid
        run: npm install -g deploid
      
      - name: Generate Assets
        run: deploid assets
      
      - name: Package for Android
        run: deploid package
      
      - name: Build APK/AAB
        run: deploid build
        env:
          ANDROID_STORE_PWD: ${{ secrets.ANDROID_STORE_PWD }}
          ANDROID_KEY_PWD: ${{ secrets.ANDROID_KEY_PWD }}
      
      - name: Publish to GitHub
        run: deploid publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Local Development

```bash
# Development script
#!/bin/bash
set -e

echo "🚀 Building with Deploid..."

# Generate assets
echo "📸 Generating assets..."
deploid assets

# Package for Android
echo "📦 Packaging for Android..."
deploid package

# Build APK
echo "🔨 Building APK..."
deploid build

echo "✅ Build complete!"
```
