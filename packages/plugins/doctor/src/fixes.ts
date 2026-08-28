import fs from 'node:fs';
import path from 'node:path';
import type { SharedDoctorState } from './tooling.js';
import type { CheckResult, FixResult, ProjectState } from './types.js';

const ANDROID_SDK_LICENSE_HASHES = ['8933bad161af4178b1185d1a37fbf41ea5269c55', 'd56f5187479451eabf01fb78af6dfcb131a6481e'];
const ANDROID_SDK_PREVIEW_LICENSE_HASHES = ['84831b9409646a918e30573bab4c9c91346d8abd'];

export function applyFixes(state: ProjectState, checks: CheckResult[], doctorState?: SharedDoctorState): FixResult[] {
  const fixes: FixResult[] = [];
  const sdkPath = doctorState?.toolchain?.androidSdk?.root;

  if (checks.some((check) => check.id === 'assets-source' && check.status === 'fail')) {
    const source = state.config?.assets?.source;
    if (source) {
      const dir = path.join(state.cwd, path.dirname(source));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        fixes.push(applied('assets-dir', 'Asset directory', `Created ${path.relative(state.cwd, dir)}.`));
      }
    }
  }

  if (checks.some((check) => ['capacitor-config', 'capacitor-sync'].includes(check.id) && check.status !== 'pass') && state.config?.android?.packaging === 'capacitor') {
    const next = {
      appId: state.config.appId || 'com.example.myapp',
      appName: state.config.appName || 'MyApp',
      webDir: state.config.web?.webDir || 'dist'
    };
    fs.writeFileSync(state.capacitorConfigPath, `${JSON.stringify(next, null, 2)}\n`);
    fixes.push(applied('capacitor-config', 'Capacitor config', 'Synced capacitor.config.json from Deploid config.'));
  }

  if (sdkPath && fs.existsSync(state.androidDir)) {
    const localProperties = path.join(state.androidDir, 'local.properties');
    const configured = readSdkDirProperty(localProperties);
    if (configured !== sdkPath) {
      writeSdkDirProperty(localProperties, sdkPath);
      fixes.push(applied('android-local-properties', 'Android SDK path', `Pinned sdk.dir to ${sdkPath}.`));
    }
  }

  if (sdkPath && checks.some((check) => check.id === 'android-sdk-licenses' && check.status !== 'pass')) {
    try {
      writeAndroidLicenseFiles(sdkPath);
      fixes.push(applied('android-sdk-licenses', 'Android SDK licenses', 'Wrote standard Android SDK license hash files.'));
    } catch (error) {
      fixes.push({ id: 'android-sdk-licenses', title: 'Android SDK licenses', status: 'failed', message: error instanceof Error ? error.message : String(error) });
    }
  }

  ensureSensitivePathsIgnored(state, fixes);

  if (fixes.length === 0) {
    fixes.push({ id: 'noop', title: 'Auto-fix', status: 'skipped', message: 'No safe automatic fixes were available.' });
  }
  return fixes;
}

function ensureSensitivePathsIgnored(state: ProjectState, fixes: FixResult[]): void {
  const entries = [
    state.config?.android?.signing?.keystorePath,
    state.config?.publish?.play?.serviceAccountJson,
    '.env.deploid',
    '.env.deploid.local'
  ].filter((value): value is string => Boolean(value));
  if (entries.length === 0) return;
  const gitignorePath = path.join(state.cwd, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const missing = entries.filter((entry) => !existing.split(/\r?\n/).includes(entry));
  if (missing.length === 0) return;
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  fs.appendFileSync(gitignorePath, `${prefix}${missing.join('\n')}\n`);
  fixes.push(applied('gitignore-release', 'Release gitignore', 'Updated .gitignore with release-sensitive paths.'));
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

function applied(id: string, title: string, message: string): FixResult {
  return { id, title, status: 'applied', message };
}
