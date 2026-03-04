# CLI Reference

This reference describes Deploid 2.0 command behavior.

## Global Options

| Option | Description |
| --- | --- |
| `-V, --version` | Output version |
| `-h, --help` | Display help |

## Core Commands

### `deploid init`

Initialize Deploid in the current project.

```bash
deploid init [options]
```

Options:

| Option | Default | Description |
| --- | --- | --- |
| `-f, --framework <framework>` | `vite` | `vite`, `next`, `cra`, `static` |
| `-p, --packaging <engine>` | `capacitor` | `capacitor` only in 2.0 |
| `--all-plugins` | `false` | Install all available plugins |
| `--debug` | `false` | Enable debug logging |

### `deploid assets`

Generate Android/PWA assets from your configured logo.

```bash
deploid assets [--debug]
```

### `deploid package`

Run Capacitor packaging flow.

```bash
deploid package [--debug]
```

Notes:
- `android.packaging` must be `capacitor` in 2.0.
- Uses your configured `web.buildCommand`.

### `deploid build`

Build Android artifacts.

```bash
deploid build [--debug]
```

Output:
- Debug APK always.
- Release AAB when signing config is present.

### `deploid deploy`

Deploy debug APK to connected devices.

```bash
deploid deploy [--debug] [-f|--force] [-l|--launch]
```

## Device Commands

### `deploid devices`

List connected Android devices.

```bash
deploid devices
```

### `deploid logs`

Stream Android logs.

```bash
deploid logs
```

### `deploid uninstall`

Uninstall app from connected device(s).

```bash
deploid uninstall
```

## Utility Commands

### `deploid debug`

Add network debugging component and troubleshooting guide.

```bash
deploid debug
```

### `deploid plugin`

Manage plugins.

```bash
deploid plugin --list
deploid plugin --install <plugin>
deploid plugin --remove <plugin>
```

### `deploid firebase`

Run Firebase setup helper.

```bash
deploid firebase [--project-id <id>] [--auto-create]
```

## iOS Commands

### `deploid ios`

Prepare iOS project handoff artifacts.

```bash
deploid ios
```

### `deploid ios:handbook`

Generate iOS handoff documentation.

```bash
deploid ios:handbook
```

### `deploid ios:assets`

```bash
deploid ios:assets
```

Status: not implemented in 2.0 (fails fast).

## Publish Command

### `deploid publish`

```bash
deploid publish
```

Status: not implemented in 2.0 (fails fast).

## Environment Variables

### Logging

```bash
export DEPLOID_LOG_LEVEL=debug
```

### Android Signing

```bash
export ANDROID_STORE_PWD="..."
export ANDROID_KEY_PWD="..."
```
