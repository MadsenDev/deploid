# Deploid Documentation

**From build to publish — one command.**

Deploid is a unified build pipeline for web apps that turns them into Android apps (APK/AAB).

## 📚 Table of Contents

- [Getting Started](getting-started.md)
- [Architecture](architecture.md)
- [Configuration](configuration.md)
- [Plugins](plugins.md)
- [CLI Reference](cli-reference.md)
- [Examples](examples.md)
- [Contributing](contributing.md)
- [Migration 2.0](MIGRATION_2_0.md)
- [Deprecation Plan](DEPRECATION_PLAN.md)

## 🎯 What is Deploid?

Deploid automates the entire process of turning a web app into a ready-to-ship Android package. It replaces the fragmented manual steps (Capacitor, Gradle, Bubblewrap, Fastlane, icons, screenshots, signing, etc.) with one consistent workflow.

### Key Features

- **🖼️ Asset Generation**: Automatic icon generation for all Android densities and PWA
- **📦 Packaging**: Capacitor-based Android packaging
- **🔨 Build System**: APK/AAB generation with signing
- **📱 iOS Preparation**: Complete iOS project setup for Mac handoff
- **🚀 Deployment**: Direct APK deployment to Android devices
- **🐛 Debug Tools**: Network debugging and troubleshooting components
- **☁️ Publishing**: Planned for future release
- **🔧 Plugin Architecture**: Extensible and modular design
- **⚙️ CI/CD Ready**: GitHub Actions generator

### Supported Frameworks

- **Vite** (React, Vue, Svelte)
- **Next.js** (Static export)
- **Create React App**
- **Static HTML** projects

### Supported Packaging Engines

- **Capacitor** - Native WebView wrapper

### Desktop GUI

Deploid Studio is available as a desktop app wrapper around CLI workflows:

```bash
npm install -g @deploid/studio
deploid-studio
```

## 🚀 Quick Start

```bash
# Setup Deploid (first time)
git clone https://github.com/MadsenDev/deploid.git
cd deploid
pnpm install
./install-global.sh

# Initialize a project
deploid init

# Add your logo
cp your-logo.svg assets/logo.svg

# Generate all required assets
deploid assets

# Package for Android
deploid package

# Build APK/AAB
deploid build

# Deploy to a connected device
deploid deploy
```

## 📁 Project Structure

```
deploid/
├── packages/
│   ├── cli/                    # Command line interface
│   ├── core/                   # Config loader, logger, pipeline runner
│   └── plugins/
│       ├── assets/             # Icon/screenshot generation
│       ├── packaging-capacitor/ # Capacitor packaging
│       └── build-android/      # APK/AAB building
├── examples/                   # Example projects
└── docs/                       # Documentation
```

## 🧩 Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `deploid init`    | Setup config and base folders               |
| `deploid assets`  | Generate all required icons and screenshots |
| `deploid package` | Wrap app for Android (Capacitor)             |
| `deploid build`   | Build APK/AAB (debug/release)               |
| `deploid debug`   | Add network debugging tools to your project  |
| `deploid deploy`  | Deploy APK to connected Android devices     |
| `deploid devices` | List connected Android devices               |
| `deploid logs`   | View app logs from connected device          |
| `deploid uninstall` | Uninstall app from connected devices      |
| `deploid ios`     | Prepare iOS project for Mac handoff          |
| `deploid ios:assets` | Not implemented in 2.0                    |
| `deploid ios:handbook` | Generate iOS handoff documentation      |
| `deploid publish` | Not implemented in 2.0                       |

## 🎯 Current Status

✅ **Milestone 1 — Core CLI + Capacitor** (Complete)
- [x] Config loader + basic CLI
- [x] Assets (icons) generation with Sharp
- [x] Capacitor packaging
- [x] Debug APK build system
- [x] Network debugging tools
- [x] Android deployment system
- [x] iOS project preparation

🔄 **Next: Milestone 2 — Release + CI**
- [ ] Signing + release builds
- [ ] Play/GitHub publishing
- [ ] Auto GitHub Actions generator

## 🧠 Vision

> "Turn any web app into a publishable Android app with one command — including icons, signing, builds, and release automation."

The long-term goal: Expand to **multi-platform** (Windows .exe, macOS DMG, iOS IPA, and Web Deploy).
