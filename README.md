# Deploid

**From build to Android package — one command.**

Deploid automates the entire process of turning a web app into a ready-to-ship Android package.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @deploid/cli

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

# Publish support is planned for a future release
# (deploid publish currently returns "not implemented")
```

## ✨ Features

- **🖼️ Asset Generation**: Automatic icon generation for all Android densities and PWA
- **📦 Packaging**: Capacitor-based Android packaging
- **🔨 Build System**: APK/AAB generation with signing
- **☁️ Publishing**: Planned for a future release
- **🔧 Plugin Architecture**: Extensible and modular design
- **🔥 Firebase Integration**: Automated push notification setup
- **📱 Native Deployment**: Direct APK installation to devices
- **🍎 iOS Preparation**: Generate Xcode projects for Mac handoff

## 🎯 Supported Frameworks

- **Vite** (React, Vue, Svelte)
- **Next.js** (Static export)
- **Create React App**
- **Static HTML** projects

## 📦 Supported Packaging Engines

- **Capacitor** - Native WebView wrapper

## 🧩 Commands

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `deploid init`    | Setup config and base folders               |
| `deploid assets`  | Generate all required icons and screenshots |
| `deploid package` | Wrap app for Android (Capacitor)             |
| `deploid build`   | Build APK/AAB (debug/release)               |
| `deploid publish` | Not implemented in 2.0                      |

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [CLI Reference](docs/cli-reference.md)
- [Examples](docs/examples.md)
- [Contributing](docs/contributing.md)
- [Migration 2.0](docs/MIGRATION_2_0.md)
- [Deprecation Plan](docs/DEPRECATION_PLAN.md)

## 🖥️ Desktop GUI

Deploid Studio provides a desktop interface for running Deploid in a selected project folder.

```bash
npm install -g @deploid/studio
deploid-studio
```

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
