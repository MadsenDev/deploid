# Deploid

**From build to publish — one command.**

Deploid automates the entire process of turning a web app into a ready-to-ship Android package.

## 🚀 Quick Start

```bash
# Install globally
npm install -g deploid

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

# Deploy to connected device
deploid deploy

# Setup Firebase for push notifications
deploid firebase

# Manage plugins
deploid plugin --list
deploid plugin --install storage
deploid plugin --remove debug-network

# Publish to stores
deploid publish
```

## ✨ Features

- **🖼️ Asset Generation**: Automatic icon generation for all Android densities and PWA
- **📦 Multi-Engine Packaging**: Capacitor, Tauri, and TWA support
- **🔨 Build System**: APK/AAB generation with signing
- **☁️ Publishing**: Play Store and GitHub Releases integration
- **🔧 Plugin Architecture**: Extensible and modular design
- **💾 Cross-Platform Storage**: Seamless storage across web and native environments
- **🔥 Firebase Integration**: Automated push notification setup
- **📱 Native Deployment**: Direct APK installation to devices
- **🍎 iOS Preparation**: Generate Xcode projects for Mac handoff

## 💾 Cross-Platform Storage

Deploid includes built-in cross-platform storage utilities that work seamlessly across web and native environments:

```bash
# Install storage plugin during init
deploid init
# Select "Cross-platform storage utilities" when prompted
```

### Usage

```typescript
import { crossPlatformStorage } from './lib/storage'
import { secureStorageUtil } from './lib/secureStorage'

// Store data
await crossPlatformStorage.set('theme', 'dark')
await secureStorageUtil.set('authToken', 'secret-token')

// Retrieve data
const theme = await crossPlatformStorage.get('theme')
const token = await secureStorageUtil.get('authToken')
```

**Features:**
- 🌐 **Web**: Uses localStorage/sessionStorage
- 📱 **Native**: Uses Capacitor Preferences + Secure Storage
- 🔒 **Security**: Encrypted storage for sensitive data
- 🔄 **Migration**: Easy transition from existing localStorage

## 🔧 Plugin Management

Deploid includes a powerful plugin system that you can manage after initialization:

```bash
# List all available plugins
deploid plugin --list

# Install a specific plugin
deploid plugin --install storage
deploid plugin --install debug-network

# Remove a plugin
deploid plugin --remove debug-network

# Interactive plugin manager
deploid plugin
```

### Available Plugins

- **📦 Assets** - Generate app icons and assets (required)
- **📱 Packaging** - Capacitor, Tauri, TWA support (required for packaging)
- **🔨 Build** - Android APK/AAB generation
- **📲 Deploy** - Direct device deployment via ADB
- **🍎 iOS** - iOS project preparation for Mac handoff
- **🐛 Debug** - Network debugging tools
- **💾 Storage** - Cross-platform storage utilities

## 🎯 Supported Frameworks

- **Vite** (React, Vue, Svelte)
- **Next.js** (Static export)
- **Create React App**
- **Static HTML** projects

## 📦 Supported Packaging Engines

- **Capacitor** - Native WebView wrapper
- **Tauri** - Rust-based desktop/mobile (planned)
- **TWA** - Trusted Web Activity (planned)

## 🧩 Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `deploid init`    | Setup config and base folders               |
| `deploid assets`  | Generate all required icons and screenshots |
| `deploid package` | Wrap app for Android (Capacitor/Tauri/TWA)  |
| `deploid build`   | Build APK/AAB (debug/release)               |
| `deploid publish` | Upload build to Play Store or GitHub        |

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [CLI Reference](docs/cli-reference.md)
- [Examples](docs/examples.md)
- [Contributing](docs/contributing.md)

## 🎯 Current Status

✅ **Milestone 1 — Core CLI + Capacitor** (Complete)
- [x] Config loader + basic CLI
- [x] Assets (icons) generation with Sharp
- [x] Capacitor packaging
- [x] Debug APK build system

🔄 **Next: Milestone 2 — Release + CI**
- [ ] Signing + release builds
- [ ] Play/GitHub publishing
- [ ] Auto GitHub Actions generator

## 🧠 Vision

> "Turn any web app into a publishable Android app with one command — including icons, signing, builds, and release automation."

The long-term goal: Expand to **multi-platform** (Windows .exe, macOS DMG, iOS IPA, and Web Deploy).

## 📄 License

MIT © [MadsenDev](https://github.com/MadsenDev)

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](docs/contributing.md) for details.

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/MadsenDev/deploid/issues)
- **GitHub Discussions**: [Ask questions and discuss](https://github.com/MadsenDev/deploid/discussions)

---

**Made with ❤️ by [MadsenDev](https://github.com/MadsenDev)**