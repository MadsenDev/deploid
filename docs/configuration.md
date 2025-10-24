# Configuration Reference

This document provides a comprehensive reference for Deploid configuration options.

## Configuration File

Deploid supports multiple configuration file formats:

- `deploid.config.ts` (TypeScript - recommended)
- `deploid.config.js` (JavaScript)
- `deploid.config.mjs` (ES Modules)
- `deploid.config.cjs` (CommonJS)

## Basic Configuration

### Minimal Configuration

```typescript
export default {
  appName: 'MyApp',
  appId: 'com.example.myapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
  },
  android: {
    packaging: 'capacitor',
  },
};
```

### Complete Configuration

```typescript
export default {
  // App metadata
  appName: 'MyApp',
  appId: 'com.example.myapp',
  
  // Web app configuration
  web: {
    framework: 'vite', // 'vite' | 'next' | 'cra' | 'static'
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: {
      manifest: 'public/manifest.json',
      serviceWorker: true,
    },
  },
  
  // Android configuration
  android: {
    packaging: 'capacitor', // 'capacitor' | 'tauri' | 'twa'
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA'],
    signing: {
      keystorePath: './android.keystore',
      alias: 'mykey',
      storePasswordEnv: 'ANDROID_STORE_PWD',
      keyPasswordEnv: 'ANDROID_KEY_PWD',
    },
    version: {
      code: 1,
      name: '1.0.0',
    },
  },
  
  // Asset generation
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
  
  // Publishing configuration
  publish: {
    play: {
      track: 'internal', // 'internal' | 'alpha' | 'beta' | 'production'
      serviceAccountJson: 'secrets/play.json',
    },
    github: {
      repo: 'your-username/your-repo',
      draft: true,
    },
  },
  
  // Custom plugins
  plugins: ['custom-plugin'],
};
```

## Configuration Options

### App Metadata

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appName` | `string` | ✅ | Display name of your app |
| `appId` | `string` | ✅ | Unique identifier (reverse domain notation) |

### Web Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `framework` | `'vite' \| 'next' \| 'cra' \| 'static'` | ✅ | - | Web framework type |
| `buildCommand` | `string` | ✅ | - | Command to build the web app |
| `webDir` | `string` | ✅ | - | Directory containing built web assets |
| `pwa.manifest` | `string` | ❌ | - | Path to PWA manifest file |
| `pwa.serviceWorker` | `boolean` | ❌ | `false` | Enable service worker |

### Android Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `packaging` | `'capacitor' \| 'tauri' \| 'twa'` | ✅ | - | Android packaging engine |
| `targetSdk` | `number` | ❌ | `34` | Target Android SDK version |
| `minSdk` | `number` | ❌ | `24` | Minimum Android SDK version |
| `permissions` | `string[]` | ❌ | `['INTERNET']` | Android permissions |
| `signing.keystorePath` | `string` | ❌ | - | Path to Android keystore |
| `signing.alias` | `string` | ❌ | - | Keystore alias |
| `signing.storePasswordEnv` | `string` | ❌ | - | Environment variable for store password |
| `signing.keyPasswordEnv` | `string` | ❌ | - | Environment variable for key password |
| `version.code` | `number` | ❌ | `1` | Version code (integer) |
| `version.name` | `string` | ❌ | `'1.0.0'` | Version name (string) |

### Asset Configuration

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `source` | `string` | ✅ | - | Path to source logo (SVG/PNG) |
| `output` | `string` | ❌ | `'assets-gen/'` | Output directory for generated assets |

### Publish Configuration

#### Play Store

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `track` | `'internal' \| 'alpha' \| 'beta' \| 'production'` | ❌ | Play Store release track |
| `serviceAccountJson` | `string` | ❌ | Path to Google service account JSON |

#### GitHub Releases

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `repo` | `string` | ✅ | GitHub repository (owner/repo) |
| `draft` | `boolean` | ❌ | `false` | Create as draft release |

## Framework-Specific Configuration

### Vite Projects

```typescript
export default {
  appName: 'ViteApp',
  appId: 'com.example.viteapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
  },
  android: {
    packaging: 'capacitor',
  },
};
```

### Next.js Projects

```typescript
export default {
  appName: 'NextApp',
  appId: 'com.example.nextapp',
  web: {
    framework: 'next',
    buildCommand: 'npm run build',
    webDir: 'out', // Next.js static export
  },
  android: {
    packaging: 'capacitor',
  },
};
```

### Create React App

```typescript
export default {
  appName: 'CRAApp',
  appId: 'com.example.craapp',
  web: {
    framework: 'cra',
    buildCommand: 'npm run build',
    webDir: 'build',
  },
  android: {
    packaging: 'capacitor',
  },
};
```

### Static HTML

```typescript
export default {
  appName: 'StaticApp',
  appId: 'com.example.staticapp',
  web: {
    framework: 'static',
    buildCommand: 'echo "Static files ready"',
    webDir: 'public',
  },
  android: {
    packaging: 'capacitor',
  },
};
```

## Packaging Engine Configuration

### Capacitor

```typescript
export default {
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA', 'STORAGE'],
  },
};
```

### Tauri (Planned)

```typescript
export default {
  android: {
    packaging: 'tauri',
    targetSdk: 34,
    minSdk: 24,
  },
};
```

### TWA (Planned)

```typescript
export default {
  android: {
    packaging: 'twa',
    targetSdk: 34,
    minSdk: 24,
  },
};
```

## Environment Variables

### Android Signing

```bash
# Set in your environment or .env file
export ANDROID_STORE_PWD="your-store-password"
export ANDROID_KEY_PWD="your-key-password"
```

### Debug Logging

```bash
# Enable debug logging
export DEPLOID_LOG_LEVEL="debug"
```

## Configuration Validation

Deploid validates your configuration and provides helpful error messages:

```typescript
// ❌ Invalid configuration
export default {
  appName: 'MyApp',
  // Missing required fields
};

// ✅ Valid configuration
export default {
  appName: 'MyApp',
  appId: 'com.example.myapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
  },
  android: {
    packaging: 'capacitor',
  },
};
```

## Advanced Configuration

### Custom Plugins

```typescript
export default {
  // ... other config
  plugins: [
    'custom-asset-plugin',
    'custom-build-plugin',
  ],
};
```

### Multiple Environments

```typescript
// deploid.config.ts
const isProduction = process.env.NODE_ENV === 'production';

export default {
  appName: 'MyApp',
  appId: 'com.example.myapp',
  web: {
    framework: 'vite',
    buildCommand: isProduction ? 'npm run build:prod' : 'npm run build',
    webDir: 'dist',
  },
  android: {
    packaging: 'capacitor',
    targetSdk: isProduction ? 34 : 33,
    version: {
      code: isProduction ? 5 : 1,
      name: isProduction ? '1.0.4' : '1.0.0-dev',
    },
  },
};
```

## Configuration Examples

### Complete Production Setup

```typescript
export default {
  appName: 'MyAwesomeApp',
  appId: 'com.mycompany.myawesomeapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: {
      manifest: 'public/manifest.json',
      serviceWorker: true,
    },
  },
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA', 'STORAGE', 'NOTIFICATIONS'],
    signing: {
      keystorePath: './android.keystore',
      alias: 'mykey',
      storePasswordEnv: 'ANDROID_STORE_PWD',
      keyPasswordEnv: 'ANDROID_KEY_PWD',
    },
    version: {
      code: 10,
      name: '2.1.0',
    },
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
  publish: {
    play: {
      track: 'production',
      serviceAccountJson: 'secrets/play.json',
    },
    github: {
      repo: 'mycompany/myawesomeapp',
      draft: false,
    },
  },
};
```
