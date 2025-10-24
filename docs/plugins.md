# Plugin System

Deploid's plugin system allows you to extend functionality and customize the build process. This document explains how to create, use, and manage plugins.

## Plugin Architecture

### Plugin Types

| Type | Purpose | Example |
|------|---------|---------|
| **Assets** | Generate icons, screenshots, and other assets | `@deploid/plugin-assets` |
| **Packaging** | Wrap web apps for different platforms | `@deploid/plugin-packaging-capacitor` |
| **Build** | Build platform-specific packages | `@deploid/plugin-build-android` |
| **Publish** | Distribute to app stores | `@deploid/plugin-publish-play` |
| **Audit** | Validate project readiness | `@deploid/plugin-audit` |

### Plugin Interface

```typescript
export type PipelineStep = (ctx: PipelineContext) => Promise<void>;

export interface PipelineContext {
  cwd: string;           // Current working directory
  config: DeploidConfig; // Project configuration
  logger: Logger;       // Logging instance
}
```

## Built-in Plugins

### Assets Plugin (`@deploid/plugin-assets`)

**Purpose**: Generate icons and screenshots from a source logo.

**Configuration**:
```typescript
export default {
  assets: {
    source: 'assets/logo.svg',    // Source logo path
    output: 'assets-gen/',        // Output directory
  },
};
```

**Generated Assets**:
- Android icons (all densities)
- PWA icons (192px, 512px)
- Apple touch icon
- Favicons (multiple sizes)

**Usage**:
```bash
deploid assets
```

### Packaging Capacitor Plugin (`@deploid/plugin-packaging-capacitor`)

**Purpose**: Wrap web apps using Capacitor for Android.

**Configuration**:
```typescript
export default {
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET'],
  },
};
```

**Features**:
- Capacitor initialization
- Web app building and syncing
- Android platform setup
- Configuration updates

**Usage**:
```bash
deploid package
```

### Build Android Plugin (`@deploid/plugin-build-android`)

**Purpose**: Build APK/AAB packages for Android.

**Configuration**:
```typescript
export default {
  android: {
    signing: {
      keystorePath: './android.keystore',
      alias: 'mykey',
      storePasswordEnv: 'ANDROID_STORE_PWD',
      keyPasswordEnv: 'ANDROID_KEY_PWD',
    },
  },
};
```

**Generated Packages**:
- Debug APK
- Release AAB (with signing)
- Release APK (with signing)

**Usage**:
```bash
deploid build
```

### Debug Network Plugin (`@deploid/plugin-debug-network`)

**Purpose**: Add network debugging tools to your project for troubleshooting connectivity issues.

**Generated Files**:
- `src/components/NetworkDebug.tsx` - React component for network testing

**Features**:
- API endpoint testing
- Domain connectivity testing
- Network analysis (online status, connection type, user agent)
- Error reporting with detailed information
- Alternative endpoint testing

**Usage**:
```bash
deploid debug
```

### Deploy Android Plugin (`@deploid/plugin-deploy-android`)

**Purpose**: Deploy APK to connected Android devices.

**Features**:
- Automatic device detection
- Multi-device deployment
- Auto-launch after installation
- ADB integration
- Error handling and reporting

**Requirements**:
- Android device connected via USB
- USB debugging enabled
- ADB (Android Debug Bridge) installed

**Usage**:
```bash
deploid deploy
deploid devices
deploid logs
deploid uninstall
```

### Prepare iOS Plugin (`@deploid/plugin-prepare-ios`)

**Purpose**: Prepare iOS project for Mac handoff.

**Generated Files**:
- `ios/` - Complete iOS Xcode project
- `ios/App/App/Info.plist` - iOS app configuration
- `ios/App/App/App.entitlements` - iOS capabilities
- `ios/Podfile` - CocoaPods dependencies
- `ios/Config/` - Build configuration files
- `docs/IOS_HANDBOOK.md` - Mac handoff instructions

**Features**:
- Capacitor iOS platform setup
- Bundle ID and app name configuration
- Privacy descriptions for camera, photo library, microphone
- URL schemes and deep linking
- App Transport Security (ATS) configuration
- iOS asset catalog structure
- Comprehensive handoff documentation

**Usage**:
```bash
deploid ios
deploid ios:assets
deploid ios:handbook
```

## Creating Custom Plugins

### 1. Plugin Structure

```
packages/plugins/my-plugin/
├── src/
│   └── index.ts              # Plugin implementation
├── package.json              # Plugin dependencies
├── tsconfig.json             # TypeScript configuration
└── dist/                     # Compiled output
```

### 2. Package Configuration

```json
{
  "name": "@deploid/plugin-my-plugin",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -b"
  },
  "dependencies": {
    "@deploid/core": "workspace:*"
  }
}
```

### 3. Plugin Implementation

```typescript
import { PipelineStep } from '../../../core/dist/index.js';

export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('My plugin executing...');
  
  // Plugin logic here
  try {
    // Do something useful
    logger.info('Plugin completed successfully');
  } catch (error) {
    logger.error(`Plugin failed: ${error}`);
    throw error;
  }
};
```

### 4. Register Plugin

Add to `packages/core/src/plugin-loader.ts`:

```typescript
case 'my-plugin':
  const myPluginPath = new URL('../../plugins/my-plugin/dist/index.js', import.meta.url).pathname;
  const { myPlugin } = await import(myPluginPath);
  return myPlugin();
```

### 5. Build Plugin

```bash
cd packages/plugins/my-plugin
pnpm install
pnpm build
```

## Plugin Development Best Practices

### 1. Error Handling

```typescript
export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  try {
    // Plugin logic
    logger.info('Plugin completed');
  } catch (error) {
    logger.error(`Plugin failed: ${error}`);
    throw error; // Re-throw to stop pipeline
  }
};
```

### 2. Configuration Validation

```typescript
export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  // Validate required configuration
  if (!config.myPlugin?.requiredOption) {
    throw new Error('myPlugin.requiredOption is required');
  }
  
  // Plugin logic
};
```

### 3. Logging

```typescript
export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.debug('Debug information');
  logger.info('General information');
  logger.warn('Warning message');
  logger.error('Error message');
};
```

### 4. File Operations

```typescript
import fs from 'node:fs';
import path from 'node:path';

export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  const outputPath = path.join(cwd, 'output');
  
  // Create directory if it doesn't exist
  fs.mkdirSync(outputPath, { recursive: true });
  
  // Write file
  fs.writeFileSync(path.join(outputPath, 'file.txt'), 'content');
};
```

### 5. External Commands

```typescript
import { execa } from 'execa';

export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  try {
    await execa('npm', ['run', 'build'], { cwd, stdio: 'inherit' });
    logger.info('Build completed');
  } catch (error) {
    logger.error(`Build failed: ${error}`);
    throw error;
  }
};
```

## Plugin Configuration

### Adding Configuration Types

```typescript
// In packages/core/src/types.ts
export interface DeploidConfig {
  // ... existing config
  myPlugin?: {
    option1: string;
    option2?: number;
  };
}
```

### Using Configuration

```typescript
export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  const pluginConfig = config.myPlugin || {};
  const option1 = pluginConfig.option1 || 'default';
  const option2 = pluginConfig.option2 || 42;
  
  // Use configuration
};
```

## Plugin Examples

### Custom Asset Plugin

```typescript
import { PipelineStep } from '../../../core/dist/index.js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

export const customAssetPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('Generating custom assets...');
  
  const sourcePath = path.join(cwd, 'assets/logo.svg');
  const outputDir = path.join(cwd, 'assets-gen/custom');
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Generate custom sizes
  const sizes = [64, 128, 256, 512];
  
  for (const size of sizes) {
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `custom-${size}.png`));
    
    logger.debug(`Generated custom-${size}.png`);
  }
  
  logger.info('Custom assets generated');
};
```

### Custom Build Plugin

```typescript
import { PipelineStep } from '../../../core/dist/index.js';
import { execa } from 'execa';

export const customBuildPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('Running custom build...');
  
  try {
    // Run custom build command
    await execa('npm', ['run', 'custom-build'], { cwd, stdio: 'inherit' });
    
    // Copy build artifacts
    await execa('cp', ['-r', 'dist/', 'android/app/src/main/assets/'], { cwd });
    
    logger.info('Custom build completed');
  } catch (error) {
    logger.error(`Custom build failed: ${error}`);
    throw error;
  }
};
```

### Custom Publish Plugin

```typescript
import { PipelineStep } from '../../../core/dist/index.js';
import { execa } from 'execa';

export const customPublishPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('Publishing to custom platform...');
  
  const publishConfig = config.publish?.custom || {};
  const apiKey = publishConfig.apiKey;
  const endpoint = publishConfig.endpoint;
  
  if (!apiKey || !endpoint) {
    throw new Error('Custom publish configuration missing');
  }
  
  try {
    // Upload to custom platform
    await execa('curl', [
      '-X', 'POST',
      '-H', `Authorization: Bearer ${apiKey}`,
      '-F', 'file=@android/app/build/outputs/apk/debug/app-debug.apk',
      endpoint
    ], { cwd, stdio: 'inherit' });
    
    logger.info('Published to custom platform');
  } catch (error) {
    logger.error(`Publish failed: ${error}`);
    throw error;
  }
};
```

## Plugin Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { myPlugin } from './index.js';

describe('My Plugin', () => {
  it('should execute successfully', async () => {
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    
    const mockConfig = {
      myPlugin: { option1: 'test' },
    };
    
    const step = myPlugin();
    await step({
      cwd: '/tmp/test',
      config: mockConfig,
      logger: mockLogger,
    });
    
    expect(mockLogger.info).toHaveBeenCalledWith('My plugin executing...');
  });
});
```

### Integration Testing

```typescript
import { describe, it } from 'vitest';
import { loadPlugin, runPipeline, createContext } from '@deploid/core';

describe('Plugin Integration', () => {
  it('should load and execute plugin', async () => {
    const config = {
      appName: 'TestApp',
      appId: 'com.test.app',
      web: { framework: 'vite', buildCommand: 'npm run build', webDir: 'dist' },
      android: { packaging: 'capacitor' },
    };
    
    const plugin = await loadPlugin('my-plugin', config);
    const ctx = createContext('/tmp/test', config);
    
    await runPipeline(ctx, [plugin]);
  });
});
```

## Plugin Distribution

### NPM Package

```json
{
  "name": "deploid-plugin-my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "files": ["dist"],
  "keywords": ["deploid", "plugin"],
  "peerDependencies": {
    "@deploid/core": "^1.0.0"
  }
}
```

### Local Development

```bash
# Link plugin for local development
cd packages/plugins/my-plugin
pnpm link

# Use in project
cd my-project
pnpm link deploid-plugin-my-plugin
```

## Plugin Registry (Future)

Planned features for plugin discovery and management:

- **NPM-based discovery**: `deploid-plugin-*` packages
- **Plugin validation**: Automated testing and validation
- **Version compatibility**: Plugin version requirements
- **Documentation**: Auto-generated plugin documentation
