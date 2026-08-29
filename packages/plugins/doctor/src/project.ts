import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { CheckResult, DeploidConfigShape, ProjectState, WorkflowId } from './types.js';
import { fail, pass, warn } from './types.js';

const CONFIG_CANDIDATES = ['deploid.config.ts', 'deploid.config.js', 'deploid.config.mjs', 'deploid.config.cjs'];

export async function loadProjectState(cwd: string): Promise<ProjectState> {
  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJson = readJson<Record<string, unknown>>(packageJsonPath);
  const configPath = findExistingPath(cwd, CONFIG_CANDIDATES);
  const config = configPath ? await loadProjectConfig(configPath) : null;
  const capacitorConfigPath = path.join(cwd, 'capacitor.config.json');
  const capacitorConfig = readJson<Record<string, unknown>>(capacitorConfigPath);
  return {
    cwd,
    packageJsonPath,
    packageJson,
    configPath,
    config,
    capacitorConfigPath,
    capacitorConfig,
    androidDir: path.join(cwd, 'android'),
    androidBuildGradlePath: path.join(cwd, 'android', 'app', 'build.gradle'),
    packageDeps: { ...asRecord(packageJson?.dependencies), ...asRecord(packageJson?.devDependencies) },
    packageScripts: asRecord(packageJson?.scripts)
  };
}

export function collectProjectChecks(state: ProjectState): CheckResult[] {
  const checks: CheckResult[] = [
    fs.existsSync(state.packageJsonPath)
      ? pass('package-json', 'package.json', 'Found package.json in project root.', ['init'])
      : fail('package-json', 'package.json', 'package.json is missing from the project root.', ['init']),
    state.configPath
      ? pass('deploid-config', 'Deploid config', `Found ${path.basename(state.configPath)}.`, ['init', 'build', 'release'])
      : fail('deploid-config', 'Deploid config', 'No Deploid config file was found.', ['init', 'build', 'release'])
  ];

  if (!state.config) {
    checks.push(
      warn('web-output', 'Web output directory', 'Skipped because no Deploid config was loaded.', ['init', 'build']),
      warn('assets-source', 'Asset source', 'Skipped because no Deploid config was loaded.', ['init']),
      warn('android-signing', 'Android signing', 'Skipped because no Deploid config was loaded.', ['release']),
      warn('capacitor-config', 'Capacitor config', 'Skipped because no Deploid config was loaded.', ['build']),
      warn('android-project', 'Android project', 'Skipped because no Deploid config was loaded.', ['build', 'deploy']),
      warn('versioning', 'Version metadata', 'Skipped because no Deploid config was loaded.', ['release']),
      warn('plugin-state', 'Plugin surface', 'Skipped because no Deploid config was loaded.', ['init'])
    );
    return checks;
  }

  checks.push(
    checkBuildCommand(state),
    checkWebDir(state),
    checkAssetsSource(state),
    checkCapacitorConfig(state),
    checkAndroidProject(state),
    checkSigning(state),
    checkVersioning(state),
    ...collectConsistencyChecks(state),
    ...collectReleaseChecks(state),
    ...collectPluginChecks(state)
  );
  return checks;
}

export function collectRuntimeChecks(): CheckResult[] {
  return [
    checkCommand('node', ['--version'], 'Node.js', 'Required to run Deploid.', ['init', 'build', 'release', 'deploy']),
    checkNpm(),
    checkCommand('npx', ['--version'], 'npx', 'Used to invoke Capacitor CLI commands.', ['build', 'release'])
  ];
}

function collectConsistencyChecks(state: ProjectState): CheckResult[] {
  const checks: CheckResult[] = [];
  const config = state.config!;
  if (config.android?.packaging === 'capacitor' && state.capacitorConfig) {
    const mismatches: string[] = [];
    if (state.capacitorConfig.appId && state.capacitorConfig.appId !== config.appId) mismatches.push('appId');
    if (state.capacitorConfig.appName && state.capacitorConfig.appName !== config.appName) mismatches.push('appName');
    if (state.capacitorConfig.webDir && state.capacitorConfig.webDir !== config.web?.webDir) mismatches.push('webDir');
    checks.push(mismatches.length === 0
      ? pass('capacitor-sync', 'Capacitor sync', 'Capacitor metadata matches Deploid config.', ['build', 'release'])
      : warn('capacitor-sync', 'Capacitor sync', `Capacitor metadata differs from Deploid config (${mismatches.join(', ')}).`, ['build', 'release'], 'Run `deploid package` to resync generated native metadata.', true));
  }
  if (fs.existsSync(state.androidBuildGradlePath) && config.appId) {
    const appId = safeRead(state.androidBuildGradlePath).match(/applicationId\s+"([^"]+)"/)?.[1];
    if (appId === config.appId) checks.push(pass('android-app-id', 'Android appId', 'Gradle applicationId matches config.', ['build', 'release']));
    else if (appId) checks.push(warn('android-app-id', 'Android appId', `Gradle applicationId is ${appId} but config uses ${config.appId}.`, ['build', 'release'], 'Run `deploid package` before your next build.'));
  }
  return checks;
}

function collectReleaseChecks(state: ProjectState): CheckResult[] {
  const config = state.config!;
  const checks: CheckResult[] = [];
  const play = config.publish?.play;
  const github = config.publish?.github;
  checks.push(play?.serviceAccountJson
    ? (fs.existsSync(path.join(state.cwd, play.serviceAccountJson))
      ? pass('play-service-account', 'Play credentials', `Found ${play.serviceAccountJson}.`, ['release'])
      : fail('play-service-account', 'Play credentials', `${play.serviceAccountJson} does not exist.`, ['release'], 'Add the Play service account JSON before automating Play uploads.'))
    : warn('play-service-account', 'Play credentials', 'No Play service account configured.', ['release']));
  checks.push(github?.repo
    ? pass('github-release', 'GitHub release target', `Configured for ${github.repo}.`, ['release'])
    : warn('github-release', 'GitHub release target', 'No GitHub release repo configured.', ['release']));
  return checks;
}

function collectPluginChecks(state: ProjectState): CheckResult[] {
  const checks: CheckResult[] = [];
  const deps = state.packageDeps;
  if (state.config?.android?.packaging === 'capacitor') {
    checks.push(typeof deps['@capacitor/core'] === 'string' && typeof deps['@capacitor/cli'] === 'string'
      ? pass('capacitor-dependency', 'Capacitor packages', 'Capacitor dependencies are present.', ['build', 'deploy'])
      : warn('capacitor-dependency', 'Capacitor packages', 'Capacitor dependencies are incomplete in package.json.', ['build', 'deploy'], 'Install @capacitor/core and @capacitor/cli in the app project.'));
  }
  return checks;
}

function checkBuildCommand(state: ProjectState): CheckResult {
  const command = state.config?.web?.buildCommand;
  if (!command) return fail('build-command', 'Build command', 'No `web.buildCommand` configured.', ['init', 'build']);
  const script = command.match(/(?:npm|pnpm|bun)\s+run\s+([a-zA-Z0-9:_-]+)/)?.[1] || command.match(/yarn\s+([a-zA-Z0-9:_-]+)/)?.[1];
  if (script && typeof state.packageScripts[script] !== 'string') return warn('build-command', 'Build command', `Configured build command references missing script "${script}".`, ['init', 'build']);
  return pass('build-command', 'Build command', `Configured build command: ${command}.`, ['init', 'build']);
}

function checkWebDir(state: ProjectState): CheckResult {
  const webDir = state.config?.web?.webDir;
  if (!webDir) return fail('web-output', 'Web output directory', 'No `web.webDir` configured.', ['init', 'build']);
  const full = path.join(state.cwd, webDir);
  if (!fs.existsSync(full)) return warn('web-output', 'Web output directory', `${webDir} does not exist yet.`, ['build'], 'Run the web build before packaging.');
  if (!fs.existsSync(path.join(full, 'index.html'))) return warn('web-output', 'Web output directory', `${webDir} exists but index.html is missing.`, ['build']);
  return pass('web-output', 'Web output directory', `Found ${webDir}.`, ['build']);
}

function checkAssetsSource(state: ProjectState): CheckResult {
  const source = state.config?.assets?.source;
  if (!source) return warn('assets-source', 'Asset source', 'No `assets.source` configured.', ['init']);
  return fs.existsSync(path.join(state.cwd, source))
    ? pass('assets-source', 'Asset source', `Found ${source}.`, ['init'])
    : fail('assets-source', 'Asset source', `${source} does not exist.`, ['init'], 'Add the source asset or update `assets.source`.', true);
}

function checkCapacitorConfig(state: ProjectState): CheckResult {
  if (state.config?.android?.packaging !== 'capacitor') return warn('capacitor-config', 'Capacitor config', `Packaging engine is ${state.config?.android?.packaging || 'unknown'}.`, ['build']);
  return fs.existsSync(state.capacitorConfigPath)
    ? pass('capacitor-config', 'Capacitor config', 'Found capacitor.config.json.', ['build'])
    : warn('capacitor-config', 'Capacitor config', 'capacitor.config.json is missing.', ['build'], 'Run `deploid package` or `deploid doctor --fix`.', true);
}

function checkAndroidProject(state: ProjectState): CheckResult {
  return fs.existsSync(state.androidDir)
    ? pass('android-project', 'Android project', 'Found android/ project.', ['build', 'deploy'])
    : warn('android-project', 'Android project', 'android/ project has not been generated yet.', ['build', 'deploy'], 'Run `deploid package` before building or deploying Android artifacts.');
}

function checkSigning(state: ProjectState): CheckResult {
  const signing = state.config?.android?.signing;
  if (!signing?.keystorePath) return warn('android-signing', 'Android signing', 'No Android signing config found.', ['release']);
  if (!fs.existsSync(path.join(state.cwd, signing.keystorePath))) return fail('android-signing', 'Android signing', `Keystore file is missing: ${signing.keystorePath}.`, ['release']);
  const missing = [signing.storePasswordEnv, signing.keyPasswordEnv].filter((name): name is string => Boolean(name)).filter((name) => !process.env[name]);
  return missing.length > 0 ? warn('android-signing', 'Android signing', `Keystore found, but env vars are missing: ${missing.join(', ')}.`, ['release']) : pass('android-signing', 'Android signing', 'Signing keystore and env vars look ready.', ['release']);
}

function checkVersioning(state: ProjectState): CheckResult {
  const version = state.config?.android?.version;
  if (!version?.code || !version?.name) return warn('versioning', 'Version metadata', 'Android version code/name are incomplete.', ['release']);
  if (version.code < 1) return fail('versioning', 'Version metadata', 'Android version code must be >= 1.', ['release']);
  return pass('versioning', 'Version metadata', `Configured version ${version.name} (${version.code}).`, ['release']);
}

function checkCommand(command: string, args: string[], title: string, details: string, workflows: WorkflowId[]): CheckResult {
  const run = spawnSync(command, args, { encoding: 'utf8' });
  const output = `${run.stdout || ''} ${run.stderr || ''}`.trim().split('\n')[0]?.trim();
  return run.status === 0 ? pass(command, title, `${command} is available.`, workflows, output || details) : fail(command, title, `${command} is not available.`, workflows, run.error?.message || output || details);
}

function checkNpm(): CheckResult {
  const check = checkCommand('npm', ['--version'], 'npm', 'Used by init, plugin setup, and Capacitor workflows.', ['init', 'build', 'release']);
  const major = Number.parseInt((check.details || '').split('.')[0] || '0', 10);
  return check.status === 'pass' && major > 0 && major < 9 ? warn('npm', 'npm', `npm ${check.details} is available but older than recommended.`, ['init', 'build', 'release']) : check;
}

export function safeRead(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T; } catch { return null; }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function findExistingPath(cwd: string, candidates: string[]): string | null {
  return candidates.map((candidate) => path.join(cwd, candidate)).find((candidate) => fs.existsSync(candidate)) || null;
}

async function loadProjectConfig(configPath: string): Promise<DeploidConfigShape | null> {
  try {
    const url = new URL(`file://${path.resolve(configPath)}`);
    const mod = await import(url.href);
    return (mod.default || mod) as DeploidConfigShape;
  } catch { return null; }
}
