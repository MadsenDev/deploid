# Deploid 2.0 Migration Guide

## Breaking Changes

- Packaging engines `tauri` and `twa` are no longer supported in 2.0.
- `deploid publish` and `deploid ios:assets` now fail fast with explicit "not implemented" errors.
- CLI core internals were removed from `packages/cli/src/core`; runtime core is now `@deploid/core`.
- Legacy `shipwright` naming has been removed from runtime behavior and commands.
- Debug log env var changed to `DEPLOID_LOG_LEVEL`.

## Required Actions

1. Ensure your config uses:
   - `android.packaging: 'capacitor'`
2. Ensure your project has local Capacitor dependencies:
   - `@capacitor/cli`
   - `@capacitor/core`
   - `@capacitor/android`
3. Update any scripts that used legacy names or paths.

## Validation

Run:

```bash
pnpm install
pnpm -r build
pnpm -r --if-present test
```
