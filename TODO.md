# Deploid Refactor TODO

## Cleanup and Baseline
- [x] Remove generated and duplicate artifacts from git (e.g., `*.tsbuildinfo`, stale compiled outputs if redundant).
- [x] Standardize naming: remove all runtime/user-facing `shipwright` references.
- [x] Align package metadata (homepage/repo/bugs/bin naming) across workspace.
- [x] Bump workspace packages to `2.0.0` and mark monorepo root as private.
- [x] Add/update `.gitignore` for generated build metadata.
- [x] Run build/tests to establish a green baseline after cleanup.

## Architecture Consolidation
- [x] Choose one core runtime path and remove duplicate core implementation.
- [x] Define a single `DeploidConfig` type and remove the legacy alias.
- [x] Centralize config loading/validation in one package.
- [x] Replace ad-hoc plugin loading with one shared plugin loader.
- [x] Ensure CLI is a thin orchestration layer only.

## Plugin and Pipeline Improvements
- [x] Define a stable plugin contract (`validate`, `plan`, `run`).
- [x] Add capability/preflight checks (ADB, Java, Android SDK, Node).
- [x] Make plugin operations idempotent and rerunnable.
- [x] Remove placeholder commands or guard them behind clear experimental flags.

## Quality and Tooling
- [x] Add integration fixtures for `vite`, `next`, `cra`, and static projects.
- [x] Expand CLI integration tests for real command flows.
- [x] Add CI matrix for supported Node versions.
- [x] Add release/versioning workflow and enforce source-of-truth from `src`.

## Docs and Migration
- [x] Update docs to match real command behavior and supported features.
- [x] Document migration notes for renamed config/types.
- [x] Publish a deprecation plan for legacy naming/commands.
