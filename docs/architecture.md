# Deploid Architecture

This document explains the internal architecture of Deploid and how its components work together.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Deploid    │    │   Android App   │
│   (React/Vue)   │───▶│   Pipeline      │───▶│   (APK/AAB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Monorepo Structure

```
deploid/
├── packages/
│   ├── cli/                    # Command line interface
│   ├── core/                   # Core functionality
│   └── plugins/                # Modular plugins
│       ├── assets/             # Asset generation
│       ├── packaging-capacitor/ # Capacitor integration
│       └── build-android/      # Android building
├── templates/                  # Project templates
├── examples/                   # Example projects
└── docs/                       # Documentation
```

## 🧩 Core Components

### 1. CLI Package (`@deploid/cli`)

**Purpose**: Command-line interface and user interaction

**Key Files**:
- `src/index.ts` - Main CLI entry point with Commander.js
- `src/init.ts` - Project initialization logic

**Responsibilities**:
- Parse command-line arguments
- Load configuration
- Orchestrate plugin execution
- Provide user feedback

### 2. Core Package (`@deploid/core`)

**Purpose**: Shared functionality and plugin orchestration

**Key Files**:
- `src/logger.ts` - Logging system with configurable levels
- `src/config.ts` - Configuration loading and validation
- `src/pipeline.ts` - Plugin execution pipeline
- `src/plugin-loader.ts` - Dynamic plugin loading
- `src/types.ts` - TypeScript type definitions

**Responsibilities**:
- Configuration management
- Plugin orchestration
- Logging and error handling
- Type safety

### 3. Plugin System

**Purpose**: Modular, extensible functionality

**Plugin Types**:
- **Assets**: Icon and screenshot generation
- **Packaging**: Web app wrapping (Capacitor, Tauri, TWA)
- **Build**: APK/AAB generation
- **Publish**: Store distribution

## 🔄 Pipeline Execution

### 1. Command Flow

```
User Command → CLI → Config Loader → Plugin Loader → Pipeline → Plugins
```

### 2. Plugin Loading

```typescript
// Dynamic plugin loading
const plugin = await loadPlugin('assets', config);
await runPipeline(ctx, [plugin]);
```

### 3. Plugin Interface

```typescript
export type PipelineStep = (ctx: PipelineContext) => Promise<void>;

export interface PipelineContext {
  cwd: string;
  config: DeploidConfig;
  logger: Logger;
}
```

## 🧩 Plugin Architecture

### Plugin Structure

```
packages/plugins/plugin-name/
├── src/
│   └── index.ts              # Plugin implementation
├── package.json              # Plugin dependencies
├── tsconfig.json             # TypeScript configuration
└── dist/                     # Compiled output
```

### Plugin Interface

```typescript
// Plugin factory function
export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('Plugin executing...');
  // Plugin logic here
};
```

### Plugin Loading

```typescript
// Dynamic loading with relative paths
const pluginPath = new URL('../../plugins/plugin-name/dist/index.js', import.meta.url).pathname;
const { myPlugin } = await import(pluginPath);
```

## 🔧 Configuration System

### Configuration Loading

```typescript
// Multiple format support
const candidates = [
  'deploid.config.ts',
  'deploid.config.js',
  'deploid.config.mjs',
  'deploid.config.cjs'
];
```

### Configuration Types

```typescript
export interface DeploidConfig {
  appName: string;
  appId: string;
  web: WebConfig;
  android: AndroidConfig;
  assets?: AssetConfig;
  publish?: PublishConfig;
  plugins?: string[];
}
```

## 📊 Data Flow

### 1. Initialization Flow

```
init command → Generate config → Create directories → Setup templates
```

### 2. Asset Generation Flow

```
assets command → Load config → Sharp processing → Generate icons → Save files
```

### 3. Packaging Flow

```
package command → Load config → Initialize Capacitor → Build web app → Sync assets → Add Android platform
```

### 4. Build Flow

```
build command → Load config → Capacitor build → Generate APK/AAB → Sign packages
```

## 🔌 Plugin Development

### Creating a Plugin

1. **Create plugin directory**:
```bash
mkdir packages/plugins/my-plugin
cd packages/plugins/my-plugin
```

2. **Setup package.json**:
```json
{
  "name": "@deploid/plugin-my-plugin",
  "version": "0.0.0",
  "type": "module",
  "main": "dist/index.js",
  "dependencies": {
    "@deploid/core": "workspace:*"
  }
}
```

3. **Implement plugin**:
```typescript
import { PipelineStep } from '../../../core/dist/index.js';

export const myPlugin = (): PipelineStep => async ({ logger, config, cwd }) => {
  logger.info('My plugin executing...');
  // Plugin implementation
};
```

4. **Register in plugin loader**:
```typescript
case 'my-plugin':
  const myPluginPath = new URL('../../plugins/my-plugin/dist/index.js', import.meta.url).pathname;
  const { myPlugin } = await import(myPluginPath);
  return myPlugin();
```

## 🎯 Design Principles

### 1. Modularity
- Each plugin is independent
- Loose coupling between components
- Easy to add/remove functionality

### 2. Extensibility
- Plugin system allows custom functionality
- Template system for different frameworks
- Configuration-driven behavior

### 3. Type Safety
- Full TypeScript coverage
- Strong typing for configuration
- Compile-time error checking

### 4. Developer Experience
- Clear error messages
- Debug logging
- Comprehensive documentation

## 🔄 Future Architecture

### Planned Enhancements

1. **Plugin Registry**: NPM-based plugin discovery
2. **Template Engine**: Dynamic template generation
3. **CI/CD Integration**: GitHub Actions generator
4. **Multi-Platform**: iOS, Windows, macOS support
5. **Cloud Build**: Remote build services

### Scalability Considerations

- **Plugin Caching**: Avoid repeated loading
- **Parallel Execution**: Multi-plugin concurrency
- **Resource Management**: Memory and CPU optimization
- **Error Recovery**: Graceful failure handling
