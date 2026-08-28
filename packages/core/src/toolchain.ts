import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type ToolchainSource =
  | 'override'
  | 'deploid-env'
  | 'environment'
  | 'local-properties'
  | 'android-studio'
  | 'known-location'
  | 'path'
  | 'gradle-wrapper';

export interface ResolvedTool {
  path: string;
  source: ToolchainSource;
  version?: string;
}

export interface JavaTool extends ResolvedTool {
  home: string;
  major?: number;
  compatible: boolean;
  minimumMajor: number;
}

export interface AndroidSdkTool extends ResolvedTool {
  root: string;
}

export interface GradleTool extends ResolvedTool {
  wrapper: boolean;
}

export interface AndroidToolchain {
  java?: JavaTool;
  androidSdk?: AndroidSdkTool;
  adb?: ResolvedTool;
  sdkmanager?: ResolvedTool;
  gradle?: GradleTool;
  issues: ToolchainIssue[];
}

export interface ToolchainIssue {
  code:
    | 'JAVA_NOT_FOUND'
    | 'JAVA_VERSION_INCOMPATIBLE'
    | 'ANDROID_SDK_NOT_FOUND'
    | 'ADB_NOT_FOUND'
    | 'SDKMANAGER_NOT_FOUND'
    | 'GRADLE_WRAPPER_NOT_FOUND';
  severity: 'warning' | 'error';
  message: string;
  fix?: string;
}

export interface ToolchainOverrides {
  javaHome?: string;
  androidSdk?: string;
}

export interface ResolveAndroidToolchainOptions {
  cwd?: string;
  overrides?: ToolchainOverrides;
  env?: NodeJS.ProcessEnv;
  minimumJavaMajor?: number;
  platform?: NodeJS.Platform;
  homeDir?: string;
}

interface Candidate {
  value: string;
  source: ToolchainSource;
}

/**
 * Resolve the Android build toolchain using one deterministic precedence order.
 * The resolver never mutates global environment or project files.
 */
export function resolveAndroidToolchain(options: ResolveAndroidToolchainOptions = {}): AndroidToolchain {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const homeDir = options.homeDir ?? os.homedir();
  const minimumJavaMajor = options.minimumJavaMajor ?? 17;

  const java = resolveJava({ cwd, env, platform, homeDir, minimumJavaMajor, overrides: options.overrides });
  const androidSdk = resolveAndroidSdk({ cwd, env, platform, homeDir, overrides: options.overrides });
  const gradle = resolveGradleWrapper(cwd, platform);
  const adb = androidSdk ? resolveSdkTool(androidSdk.root, 'adb', platform) : resolvePathTool('adb', env, platform);
  const sdkmanager = androidSdk
    ? resolveSdkManager(androidSdk.root, platform)
    : resolvePathTool('sdkmanager', env, platform);

  const issues: ToolchainIssue[] = [];
  if (!java) {
    issues.push({
      code: 'JAVA_NOT_FOUND',
      severity: 'error',
      message: `No JDK was found. Android builds require Java ${minimumJavaMajor} or newer.`,
      fix: `Install a compatible JDK or set DEPLOID_JAVA_HOME/JAVA_HOME.`
    });
  } else if (!java.compatible) {
    issues.push({
      code: 'JAVA_VERSION_INCOMPATIBLE',
      severity: 'error',
      message: `Java ${java.major ?? java.version ?? 'unknown'} at ${java.home} is older than required Java ${minimumJavaMajor}.`,
      fix: 'Point Deploid at a compatible JDK without changing the system-wide Java installation.'
    });
  }

  if (!androidSdk) {
    issues.push({
      code: 'ANDROID_SDK_NOT_FOUND',
      severity: 'error',
      message: 'No Android SDK installation was found.',
      fix: 'Set DEPLOID_ANDROID_SDK/ANDROID_HOME, configure android/local.properties, or install Android Studio.'
    });
  }

  if (androidSdk && !adb) {
    issues.push({
      code: 'ADB_NOT_FOUND',
      severity: 'warning',
      message: `ADB was not found in ${androidSdk.root}.`,
      fix: 'Install Android SDK Platform-Tools.'
    });
  }

  if (androidSdk && !sdkmanager) {
    issues.push({
      code: 'SDKMANAGER_NOT_FOUND',
      severity: 'warning',
      message: `sdkmanager was not found in ${androidSdk.root}.`,
      fix: 'Install Android SDK Command-line Tools.'
    });
  }

  if (fs.existsSync(path.join(cwd, 'android')) && !gradle) {
    issues.push({
      code: 'GRADLE_WRAPPER_NOT_FOUND',
      severity: 'error',
      message: 'The Android project exists but its Gradle wrapper is missing.',
      fix: 'Regenerate or repair the Android project. Deploid should use the project wrapper, not a global Gradle installation.'
    });
  }

  return { java, androidSdk, adb, sdkmanager, gradle, issues };
}

function resolveJava(input: {
  cwd: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  homeDir: string;
  minimumJavaMajor: number;
  overrides?: ToolchainOverrides;
}): JavaTool | undefined {
  const candidates: Candidate[] = [];
  addCandidate(candidates, input.overrides?.javaHome, 'override');
  addCandidate(candidates, input.env.DEPLOID_JAVA_HOME, 'deploid-env');
  addCandidate(candidates, input.env.JAVA_HOME, 'environment');

  for (const javaHome of androidStudioJavaHomes(input.platform, input.homeDir)) {
    addCandidate(candidates, javaHome, 'android-studio');
  }
  for (const javaHome of knownJavaHomes(input.platform)) {
    addCandidate(candidates, javaHome, 'known-location');
  }

  for (const candidate of uniqueCandidates(candidates)) {
    const executable = javaExecutable(candidate.value, input.platform);
    if (!fs.existsSync(executable)) continue;
    const version = commandVersion(executable, ['-version']);
    const major = parseJavaMajor(version);
    return {
      home: path.resolve(candidate.value),
      path: executable,
      source: candidate.source,
      version,
      major,
      compatible: major !== undefined ? major >= input.minimumJavaMajor : false,
      minimumMajor: input.minimumJavaMajor
    };
  }

  const pathJava = findOnPath('java', input.env, input.platform);
  if (!pathJava) return undefined;
  const home = inferJavaHome(pathJava);
  const version = commandVersion(pathJava, ['-version']);
  const major = parseJavaMajor(version);
  return {
    home,
    path: pathJava,
    source: 'path',
    version,
    major,
    compatible: major !== undefined ? major >= input.minimumJavaMajor : false,
    minimumMajor: input.minimumJavaMajor
  };
}

function resolveAndroidSdk(input: {
  cwd: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  homeDir: string;
  overrides?: ToolchainOverrides;
}): AndroidSdkTool | undefined {
  const candidates: Candidate[] = [];
  addCandidate(candidates, input.overrides?.androidSdk, 'override');
  addCandidate(candidates, input.env.DEPLOID_ANDROID_SDK, 'deploid-env');
  addCandidate(candidates, input.env.ANDROID_HOME, 'environment');
  addCandidate(candidates, input.env.ANDROID_SDK_ROOT, 'environment');

  const localSdk = readLocalPropertiesSdk(path.join(input.cwd, 'android', 'local.properties'));
  addCandidate(candidates, localSdk, 'local-properties');

  for (const sdkPath of knownAndroidSdkPaths(input.platform, input.homeDir)) {
    addCandidate(candidates, sdkPath, 'known-location');
  }

  for (const candidate of uniqueCandidates(candidates)) {
    const root = path.resolve(candidate.value);
    if (!looksLikeAndroidSdk(root)) continue;
    return { root, path: root, source: candidate.source };
  }
  return undefined;
}

function resolveGradleWrapper(cwd: string, platform: NodeJS.Platform): GradleTool | undefined {
  const wrapper = path.join(cwd, 'android', platform === 'win32' ? 'gradlew.bat' : 'gradlew');
  if (!fs.existsSync(wrapper)) return undefined;
  const properties = path.join(cwd, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
  const version = fs.existsSync(properties) ? parseGradleWrapperVersion(fs.readFileSync(properties, 'utf8')) : undefined;
  return { path: wrapper, source: 'gradle-wrapper', version, wrapper: true };
}

function resolveSdkTool(root: string, tool: string, platform: NodeJS.Platform): ResolvedTool | undefined {
  const executable = platform === 'win32' ? `${tool}.exe` : tool;
  const toolPath = path.join(root, 'platform-tools', executable);
  if (!fs.existsSync(toolPath)) return undefined;
  return { path: toolPath, source: 'known-location', version: commandVersion(toolPath, ['version']) };
}

function resolveSdkManager(root: string, platform: NodeJS.Platform): ResolvedTool | undefined {
  const executable = platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager';
  const candidates = [
    path.join(root, 'cmdline-tools', 'latest', 'bin', executable),
    path.join(root, 'tools', 'bin', executable)
  ];
  const cmdlineRoot = path.join(root, 'cmdline-tools');
  if (fs.existsSync(cmdlineRoot)) {
    for (const entry of safeDirectories(cmdlineRoot)) {
      candidates.push(path.join(cmdlineRoot, entry, 'bin', executable));
    }
  }
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found ? { path: found, source: 'known-location', version: commandVersion(found, ['--version']) } : undefined;
}

function resolvePathTool(command: string, env: NodeJS.ProcessEnv, platform: NodeJS.Platform): ResolvedTool | undefined {
  const found = findOnPath(command, env, platform);
  return found ? { path: found, source: 'path', version: commandVersion(found, ['--version']) } : undefined;
}

function addCandidate(candidates: Candidate[], value: string | undefined, source: ToolchainSource): void {
  if (value?.trim()) candidates.push({ value: value.trim(), source });
}

function uniqueCandidates(candidates: Candidate[]): Candidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = path.resolve(candidate.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function javaExecutable(javaHome: string, platform: NodeJS.Platform): string {
  return path.join(javaHome, 'bin', platform === 'win32' ? 'java.exe' : 'java');
}

function inferJavaHome(javaPath: string): string {
  return path.dirname(path.dirname(fs.realpathSync(javaPath)));
}

function commandVersion(command: string, args: string[]): string | undefined {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 5000 });
  const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  return text.split(/\r?\n/).find(Boolean)?.trim();
}

export function parseJavaMajor(versionOutput?: string): number | undefined {
  if (!versionOutput) return undefined;
  const match = versionOutput.match(/version\s+"([0-9]+)(?:\.([0-9]+))?/i) ?? versionOutput.match(/(?:openjdk|java)\s+([0-9]+)(?:\.([0-9]+))?/i);
  if (!match) return undefined;
  const first = Number.parseInt(match[1], 10);
  if (!Number.isFinite(first)) return undefined;
  if (first === 1 && match[2]) return Number.parseInt(match[2], 10);
  return first;
}

export function parseGradleWrapperVersion(contents: string): string | undefined {
  const match = contents.match(/gradle-([0-9][0-9A-Za-z.+-]*)-(?:all|bin)\.zip/);
  return match?.[1];
}

function readLocalPropertiesSdk(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  const line = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).find((row) => row.trim().startsWith('sdk.dir='));
  if (!line) return undefined;
  return line.slice(line.indexOf('=') + 1).trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
}

function looksLikeAndroidSdk(root: string): boolean {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return false;
  return ['platform-tools', 'platforms', 'cmdline-tools', 'build-tools', 'tools'].some((name) => fs.existsSync(path.join(root, name)));
}

function knownAndroidSdkPaths(platform: NodeJS.Platform, homeDir: string): string[] {
  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    return localAppData ? [path.join(localAppData, 'Android', 'Sdk')] : [];
  }
  if (platform === 'darwin') return [path.join(homeDir, 'Library', 'Android', 'sdk')];
  return [path.join(homeDir, 'Android', 'Sdk'), path.join(homeDir, 'Android', 'sdk')];
}

function androidStudioJavaHomes(platform: NodeJS.Platform, homeDir: string): string[] {
  if (platform === 'win32') {
    return [
      'C:\\Program Files\\Android\\Android Studio\\jbr',
      'C:\\Program Files\\Android\\Android Studio\\jre'
    ];
  }
  if (platform === 'darwin') {
    return ['/Applications/Android Studio.app/Contents/jbr/Contents/Home', '/Applications/Android Studio.app/Contents/jre/Contents/Home'];
  }
  return [
    '/opt/android-studio/jbr',
    '/opt/android-studio/jre',
    path.join(homeDir, '.local', 'share', 'JetBrains', 'Toolbox', 'apps', 'AndroidStudio')
  ];
}

function knownJavaHomes(platform: NodeJS.Platform): string[] {
  if (platform === 'win32') return [];
  if (platform === 'darwin') return [];
  return ['/usr/lib/jvm/java-21-openjdk', '/usr/lib/jvm/java-17-openjdk'];
}

function findOnPath(command: string, env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string | undefined {
  const pathValue = env.PATH ?? '';
  const extensions = platform === 'win32' ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  for (const directory of pathValue.split(path.delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = path.join(directory, platform === 'win32' ? `${command}${extension.toLowerCase()}` : command);
      if (fs.existsSync(candidate)) return candidate;
      if (platform === 'win32') {
        const upper = path.join(directory, `${command}${extension.toUpperCase()}`);
        if (fs.existsSync(upper)) return upper;
      }
    }
  }
  return undefined;
}

function safeDirectories(root: string): string[] {
  try {
    return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}
