# Getting Started with Deploid

This guide will help you get up and running with Deploid in minutes.

## Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Android Studio** (for APK/AAB building)
- **Java Development Kit** (JDK 11+)

## Installation

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/MadsenDev/deploid.git
cd deploid

# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Setup for development
./install-global.sh

# Now you can use the deploid command
./deploid --help

# Or add to your PATH for global access
export PATH=$PATH:$(pwd)
deploid --help
```

### Alternative: Run Directly

```bash
# Run CLI directly without global installation
node packages/cli/dist/index.js --help
```

### Global Installation (NPM Package)

```bash
# Install from npm (when published)
npm install -g deploid

# Or with pnpm
pnpm add -g deploid

# Or with yarn
yarn global add deploid

# Then use anywhere
deploid --help
deploid init
deploid assets
```

## Quick Start

### 1. Initialize a Project

```bash
# Navigate to your web app directory
cd my-web-app

# Initialize Deploid
node /path/to/deploid/packages/cli/dist/index.js init

# Or with specific options
node /path/to/deploid/packages/cli/dist/index.js init --framework vite --packaging capacitor
```

This creates:
- `deploid.config.ts` - Configuration file
- `assets/` - Directory for your logo
- `assets-gen/` - Generated assets output
- `capacitor.config.json` - Capacitor configuration

### 2. Add Your Logo

```bash
# Add your logo (SVG or PNG)
cp your-logo.svg assets/logo.svg
```

### 3. Generate Assets

```bash
# Generate all required icons and assets
node /path/to/deploid/packages/cli/dist/index.js assets
```

This generates:
- **Android icons**: All density variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **PWA icons**: 192px, 512px, Apple touch icon
- **Favicons**: Multiple sizes (16px, 32px, 48px, 64px)

### 4. Package for Android

```bash
# Wrap your web app for Android
node /path/to/deploid/packages/cli/dist/index.js package
```

This:
- Initializes Capacitor (if not already done)
- Builds your web app
- Syncs assets with Capacitor
- Adds Android platform
- Updates Android configuration

### 5. Build APK/AAB

```bash
# Build Android package
node /path/to/deploid/packages/cli/dist/index.js build
```

This generates:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab` (with signing)

## Configuration

### Basic Configuration

Create a `deploid.config.ts` file:

```typescript
export default {
  appName: 'MyApp',
  appId: 'com.example.myapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: { manifest: 'public/manifest.json', serviceWorker: true },
  },
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET'],
    version: { code: 1, name: '1.0.0' },
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
  publish: {
    github: { repo: 'your-username/your-repo', draft: true },
  },
};
```

### Advanced Configuration

```typescript
export default {
  appName: 'MyApp',
  appId: 'com.example.myapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: { 
      manifest: 'public/manifest.json', 
      serviceWorker: true 
    },
  },
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA', 'STORAGE'],
    signing: {
      keystorePath: './android.keystore',
      alias: 'mykey',
      storePasswordEnv: 'ANDROID_STORE_PWD',
      keyPasswordEnv: 'ANDROID_KEY_PWD',
    },
    version: { code: 5, name: '1.0.4' },
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
  publish: {
    play: { 
      track: 'internal', 
      serviceAccountJson: 'secrets/play.json' 
    },
    github: { 
      repo: 'your-username/your-repo', 
      draft: true 
    },
  },
};
```

## Supported Frameworks

### Vite (React, Vue, Svelte)

```bash
# Initialize for Vite
deploid init --framework vite
```

### Next.js (Static Export)

```bash
# Initialize for Next.js
deploid init --framework next
```

### Create React App

```bash
# Initialize for CRA
deploid init --framework cra
```

### Static HTML

```bash
# Initialize for static files
deploid init --framework static
```

## Troubleshooting

### Common Issues

**1. Capacitor CLI not found**
```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli
```

**2. Android Studio not found**
- Install Android Studio
- Set up Android SDK
- Add to PATH: `ANDROID_HOME` and `ANDROID_SDK_ROOT`

**3. Java not found**
- Install JDK 11+
- Set `JAVA_HOME` environment variable

**4. Build fails**
```bash
# Check Android Studio setup
npx @capacitor/cli doctor

# Clean and rebuild
rm -rf android/
deploid package
```

### Debug Mode

```bash
# Enable debug logging
DEPLOID_LOG_LEVEL=debug deploid assets
```

## Next Steps

- [Configuration Reference](configuration.md)
- [CLI Commands](cli-reference.md)
- [Plugin Development](plugins.md)
- [Examples](examples.md)
