# Deploid CLI

**From build to Android package — one command.**

Deploid CLI turns a web app into a packaged Android app using a Capacitor-based pipeline.

## Quick Start

```bash
# Install globally
npm install -g @deploid/cli

# Initialize in your web app directory
deploid init

# Add logo
cp your-logo.svg assets/logo.svg

# Generate assets
deploid assets

# Package for Android (Capacitor)
deploid package

# Build APK/AAB
deploid build

# Deploy debug APK to connected device
deploid deploy
```

## Deploid 2.0 Status

- Packaging engine support: `capacitor` only.
- `deploid publish`: not implemented yet.
- `deploid ios:assets`: not implemented yet.

## Commands

| Command | Description |
| --- | --- |
| `deploid init` | Create config and project structure |
| `deploid assets` | Generate required app assets |
| `deploid package` | Package app for Android (Capacitor) |
| `deploid build` | Build Android artifacts |
| `deploid deploy` | Install built APK on connected devices |
| `deploid devices` | List connected Android devices |
| `deploid logs` | Stream Android logs |
| `deploid uninstall` | Uninstall app from device |
| `deploid debug` | Add network debug component |
| `deploid ios` | Prepare iOS project handoff |
| `deploid ios:handbook` | Generate iOS handoff docs |
| `deploid plugin` | Manage Deploid plugins |
| `deploid firebase` | Setup Firebase integration |
| `deploid publish` | Not implemented in 2.0 |

## Plugin Notes

- Runtime plugin contract supports `validate`, `plan`, and `run`.
- Core runtime is centralized in `@deploid/core`.

## Docs

- [Top-level README](../../README.md)
- [CLI Reference](../../docs/cli-reference.md)
- [Migration 2.0](../../docs/MIGRATION_2_0.md)
- [Deprecation Plan](../../docs/DEPRECATION_PLAN.md)
