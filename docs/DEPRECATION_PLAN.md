# Deprecation Plan

## Scope

This plan tracks removals that were part of the 2.0 cleanup.

## Completed in 2.0

- Removed legacy runtime naming (`shipwright`).
- Removed duplicated CLI core implementation.
- Removed bundled plugin artifacts from `packages/cli/plugins`.
- Removed legacy compatibility aliasing for config types in runtime core.

## Post-2.0 Follow-up

- Keep all new features on top of `@deploid/core`.
- Do not reintroduce duplicated runtime layers in CLI.
- Keep plugin contracts on `validate/plan/run` for consistency.
