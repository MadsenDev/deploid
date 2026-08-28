import fs from 'node:fs';
import path from 'node:path';
import type { SharedDoctorState } from './tooling.js';
import type { CheckResult, FixResult, ProjectState } from './types.js';

const ANDROID_SDK_LICENSE_HASHES = ['8933bad161af4178b1185d1a37fbf41ea5269c55', 'd56f5187479451eabf01fb78af6dfcb131a6481e'];
const ANDROID_SDK_PREVIEW_LICENSE_HASHES = ['84831b9409646a918e30573bab4c9c91346d8abd'];
const DEFAULT_KEYSTORE = 'secrets/android-upload-keystore.jks';
const DEFAULT_PLAY_ACCOUNT = 'secrets/play-service-account.json';
const STORE_PASSWORD_ENV = 'DEPLOID_ANDROID_STORE_PASSWORD';
const KEY_PASSWORD_ENV = 'DEPLOID_ANDROID_KEY_PASSWORD';

export function applyFixes(state: ProjectState, checks: CheckResult[], doctorState?: SharedDoctorState): FixResult[] {
  const fixes: FixResult[] = [];
  const sdkPath = doctorState?.toolchain?.androidSdk?.root;

  ensureAssetsDirectory(state, checks, fixes);
  ensureCapacitorConfig(state, checks, fixes);
  ensureAndroidSdkFiles(state, checks, sdkPath, fixes);
  ensureReleaseConfig(state, fixes);
  ensureEnvExample(state, fixes);
  ensureSensitivePathsIgnored(state, fixes);

  if (fixes.length === 0) {
    fixes.push({ id: 'noop', title: 'Auto-fix', status: 'skipped', message: 'No safe automatic fixes were available.' });
  }
  return fixes;
}

function ensureAssetsDirectory(state: ProjectState, checks: CheckResult[], fixes: FixResult[]): void {
  if (!checks.some((check) => check.id === 'assets-source' && check.status === 'fail')) return;
  const source = state.config?.assets?.source;
  if (!source) return;
  const dir = path.join(state.cwd, path.dirname(source));
  if (fs.existsSync(dir)) return;
  fs.mkdirSync(dir, { recursive: true });
  fixes.push(applied('assets-dir', 'Asset directory', `Created ${path.relative(state.cwd, dir)}.`));
}

function ensureCapacitorConfig(state: ProjectState, checks: CheckResult[], fixes: FixResult[]): void {
  const needsSync = checks.some((check) => ['capacitor-config', 'capacitor-sync'].includes(check.id) && check.status !== 'pass');
  if (!needsSync || state.config?.android?.packaging !== 'capacitor') return;
  const next = {
    appId: state.config.appId || 'com.example.myapp',
    appName: state.config.appName || 'MyApp',
    webDir: state.config.web?.webDir || 'dist'
  };
  fs.writeFileSync(state.capacitorConfigPath, `${JSON.stringify(next, null, 2)}\n`);
  fixes.push(applied('capacitor-config', 'Capacitor config', 'Synced capacitor.config.json from Deploid config.'));
}

function ensureAndroidSdkFiles(state: ProjectState, checks: CheckResult[], sdkPath: string | undefined, fixes: FixResult[]): void {
  if (!sdkPath) return;
  if (fs.existsSync(state.androidDir)) {
    const localProperties = path.join(state.androidDir, 'local.properties');
    if (readSdkDirProperty(localProperties) !== sdkPath) {
      writeSdkDirProperty(localProperties, sdkPath);
      fixes.push(applied('android-local-properties', 'Android SDK path', `Pinned sdk.dir to ${sdkPath}.`));
    }
  }
  if (!checks.some((check) => check.id === 'android-sdk-licenses' && check.status !== 'pass')) return;
  try {
    writeAndroidLicenseFiles(sdkPath);
    fixes.push(applied('android-sdk-licenses', 'Android SDK licenses', 'Wrote standard Android SDK license hash files.'));
  } catch (error) {
    fixes.push({ id: 'android-sdk-licenses', title: 'Android SDK licenses', status: 'failed', message: error instanceof Error ? error.message : String(error) });
  }
}

function ensureReleaseConfig(state: ProjectState, fixes: FixResult[]): void {
  if (!state.configPath || !state.config) return;
  const original = fs.readFileSync(state.configPath, 'utf8');
  let updated = original;

  updated = ensureNestedProperty(updated, ['android'], 'signing', {
    keystorePath: state.config.android?.signing?.keystorePath || DEFAULT_KEYSTORE,
    alias: state.config.android?.signing?.alias || slugify(state.config.appName || 'upload'),
    storePasswordEnv: state.config.android?.signing?.storePasswordEnv || STORE_PASSWORD_ENV,
    keyPasswordEnv: state.config.android?.signing?.keyPasswordEnv || KEY_PASSWORD_ENV
  });
  updated = ensureNestedProperty(updated, ['android'], 'version', {
    code: state.config.android?.version?.code && state.config.android.version.code >= 1 ? state.config.android.version.code : 1,
    name: state.config.android?.version?.name || '1.0.0'
  });
  updated = ensureNestedProperty(updated, ['publish'], 'play', {
    track: state.config.publish?.play?.track || 'internal',
    serviceAccountJson: state.config.publish?.play?.serviceAccountJson || DEFAULT_PLAY_ACCOUNT
  });

  const githubRepo = state.config.publish?.github?.repo || inferGithubRepo(state.packageJson);
  if (githubRepo) {
    updated = ensureNestedProperty(updated, ['publish'], 'github', {
      repo: githubRepo,
      draft: state.config.publish?.github?.draft ?? true
    });
  }

  if (updated === original) return;
  fs.writeFileSync(state.configPath, updated);
  fixes.push(applied('release-config', 'Release config', `Updated ${path.basename(state.configPath)} with deterministic release defaults.`));
}

function ensureEnvExample(state: ProjectState, fixes: FixResult[]): void {
  const filePath = path.join(state.cwd, '.env.deploid.example');
  const required = [
    '# Deploid signing placeholders',
    `${state.config?.android?.signing?.storePasswordEnv || STORE_PASSWORD_ENV}=replace-me`,
    `${state.config?.android?.signing?.keyPasswordEnv || KEY_PASSWORD_ENV}=replace-me`,
    `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=${state.config?.publish?.play?.serviceAccountJson || DEFAULT_PLAY_ACCOUNT}`
  ];
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const missing = required.filter((line) => !existing.includes(line));
  if (missing.length === 0) return;
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(filePath, `${prefix}${missing.join('\n')}\n`);
  fixes.push(applied('signing-env-example', 'Signing env template', fs.existsSync(filePath) ? 'Updated .env.deploid.example.' : 'Created .env.deploid.example.'));
}

function ensureSensitivePathsIgnored(state: ProjectState, fixes: FixResult[]): void {
  const entries = [
    state.config?.android?.signing?.keystorePath || DEFAULT_KEYSTORE,
    state.config?.publish?.play?.serviceAccountJson || DEFAULT_PLAY_ACCOUNT,
    '.env.deploid',
    '.env.deploid.local'
  ];
  const gitignorePath = path.join(state.cwd, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const existingLines = existing.split(/\r?\n/);
  const missing = entries.filter((entry) => !existingLines.includes(entry));
  if (missing.length === 0) return;
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(gitignorePath, `${prefix}${missing.join('\n')}\n`);
  fixes.push(applied('gitignore-release', 'Release gitignore', 'Updated .gitignore with release-sensitive paths.'));
}

function ensureNestedProperty(source: string, parentPath: string[], propertyName: string, value: unknown): string {
  let current = source;
  for (let index = 0; index < parentPath.length; index += 1) {
    current = ensureObjectProperty(current, parentPath.slice(0, index), parentPath[index]);
  }
  const range = findObjectRange(current, parentPath);
  if (!range) return current;
  const body = current.slice(range.open + 1, range.close);
  if (new RegExp(`(^|\\n)\\s*${escapeRegExp(propertyName)}\\s*:`, 'm').test(body)) return current;
  const indent = `${lineIndentAt(current, range.open)}  `;
  const rendered = renderValue(value, indent);
  const insertion = `\n${indent}${propertyName}: ${rendered},`;
  return `${current.slice(0, range.close)}${insertion}\n${lineIndentAt(current, range.open)}${current.slice(range.close)}`;
}

function ensureObjectProperty(source: string, parentPath: string[], propertyName: string): string {
  const range = findObjectRange(source, parentPath);
  if (!range) return source;
  const body = source.slice(range.open + 1, range.close);
  if (new RegExp(`(^|\\n)\\s*${escapeRegExp(propertyName)}\\s*:`, 'm').test(body)) return source;
  const indent = `${lineIndentAt(source, range.open)}  `;
  const insertion = `\n${indent}${propertyName}: {},`;
  return `${source.slice(0, range.close)}${insertion}\n${lineIndentAt(source, range.open)}${source.slice(range.close)}`;
}

function findObjectRange(source: string, pathSegments: string[]): { open: number; close: number } | null {
  const rootMatch = /(export\s+default|module\.exports\s*=)\s*\{/.exec(source);
  if (!rootMatch) return null;
  let open = source.indexOf('{', rootMatch.index);
  let close = findMatchingBrace(source, open);
  if (close < 0) return null;
  for (const segment of pathSegments) {
    const body = source.slice(open + 1, close);
    const match = new RegExp(`(^|\\n)\\s*${escapeRegExp(segment)}\\s*:\\s*\\{`, 'm').exec(body);
    if (!match) return null;
    const relativeOpen = body.indexOf('{', match.index);
    open = open + 1 + relativeOpen;
    close = findMatchingBrace(source, open);
    if (close < 0) return null;
  }
  return { open, close };
}

function findMatchingBrace(source: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    const prev = source[i - 1];
    if (quote) {
      if (char === quote && prev !== '\\') quote = null;
      continue;
    }
    if ((char === '\'' || char === '"' || char === '`') && prev !== '\\') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return i;
  }
  return -1;
}

function renderValue(value: unknown, indent: string): string {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{\n${entries.map(([key, entry]) => `${indent}  ${key}: ${renderValue(entry, `${indent}  `)}`).join(',\n')}\n${indent}}`;
  }
  return 'undefined';
}

function inferGithubRepo(packageJson: Record<string, unknown> | null): string | undefined {
  const repository = packageJson?.repository;
  const url = typeof repository === 'string'
    ? repository
    : repository && typeof repository === 'object' && 'url' in repository
      ? String((repository as { url?: unknown }).url || '')
      : '';
  return url.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
}

function readSdkDirProperty(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  const line = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).find((entry) => entry.trim().startsWith('sdk.dir='));
  return line?.slice('sdk.dir='.length).trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
}

function writeSdkDirProperty(filePath: string, sdkPath: string): void {
  const sdkLine = `sdk.dir=${sdkPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}`;
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const next = existing.match(/^sdk\.dir=/m)
    ? existing.replace(/^sdk\.dir=.*$/m, sdkLine)
    : `${existing}${existing.length > 0 && !existing.endsWith('\n') ? '\n' : ''}${sdkLine}\n`;
  fs.writeFileSync(filePath, next);
}

function writeAndroidLicenseFiles(sdkPath: string): void {
  const licensesDir = path.join(sdkPath, 'licenses');
  fs.mkdirSync(licensesDir, { recursive: true });
  fs.writeFileSync(path.join(licensesDir, 'android-sdk-license'), `${ANDROID_SDK_LICENSE_HASHES.join('\n')}\n`);
  fs.writeFileSync(path.join(licensesDir, 'android-sdk-preview-license'), `${ANDROID_SDK_PREVIEW_LICENSE_HASHES.join('\n')}\n`);
}

function lineIndentAt(source: string, index: number): string {
  const start = source.lastIndexOf('\n', index) + 1;
  return source.slice(start, index).match(/^\s*/)?.[0] || '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function applied(id: string, title: string, message: string): FixResult {
  return { id, title, status: 'applied', message };
}
