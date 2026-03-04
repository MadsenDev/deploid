# Plugin System

Deploid 2.0 uses a package-based plugin system with a runtime contract supported by `@deploid/core`.

## Plugin Contract

Plugins should export a default object with this shape:

```typescript
export interface DeploidPlugin {
  name: string;
  requirements?: string[];
  validate?: (ctx: { cwd: string; config: DeploidConfig; logger: Logger }) => Promise<void>;
  plan?: (ctx: { cwd: string; config: DeploidConfig }) => Promise<string[]> | string[];
  run: (ctx: { cwd: string; config: DeploidConfig; logger: Logger; debug?: boolean }) => Promise<void>;
}
```

## Loading Behavior

`@deploid/core` resolves plugins in this order:

1. Installed package: `deploid-plugin-<name>`
2. Monorepo dev fallback: `packages/plugins/<name>/dist/index.js`

## Built-in Plugin Packages

- `deploid-plugin-assets`
- `deploid-plugin-packaging-capacitor`
- `deploid-plugin-build-android`
- `deploid-plugin-deploy-android`
- `deploid-plugin-debug-network`
- `deploid-plugin-prepare-ios`
- `deploid-plugin-storage`

Status notes:
- Packaging in 2.0 is `capacitor` only.
- `deploid publish` is not implemented in 2.0.
- `deploid ios:assets` is not implemented in 2.0.

## Example Plugin

```typescript
import type { DeploidPlugin } from '@deploid/core';

const plugin: DeploidPlugin = {
  name: 'my-plugin',
  requirements: ['node'],
  async validate({ cwd }) {
    // check prerequisites here
  },
  async plan() {
    return ['Check prerequisites', 'Run main task'];
  },
  async run({ logger }) {
    logger.info('my-plugin running');
  }
};

export default plugin;
```

## Local Development

```bash
# Build plugin package
pnpm --filter deploid-plugin-my-plugin build

# Link into a consuming project
pnpm link --global
pnpm link --global deploid-plugin-my-plugin
```

## Operational Guidelines

- Make plugin steps idempotent where possible.
- Use `validate` for command/tool preflight checks.
- Keep side effects in `run` only.
- Prefer actionable error messages over generic failures.
