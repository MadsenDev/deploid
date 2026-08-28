import { resolveAndroidToolchain, type AndroidToolchain, type ResolveAndroidToolchainOptions } from './toolchain.js';

export type DoctorCheckStatus = 'pass' | 'warning' | 'error';

export interface DoctorStateCheck {
  id: string;
  status: DoctorCheckStatus;
  message: string;
  fix?: string;
  source?: string;
  version?: string;
}

export interface DoctorCapabilities {
  buildAndroid: boolean;
  deployAndroid: boolean;
  manageAndroidSdk: boolean;
  fixAndroidProjectSdkPath: boolean;
}

export interface DoctorState {
  toolchain: AndroidToolchain;
  checks: DoctorStateCheck[];
  blockers: DoctorStateCheck[];
  warnings: DoctorStateCheck[];
  capabilities: DoctorCapabilities;
  nextActions: string[];
}

export function inspectDoctorState(options: ResolveAndroidToolchainOptions = {}): DoctorState {
  return buildDoctorStateFromToolchain(resolveAndroidToolchain(options));
}

export function buildDoctorStateFromToolchain(toolchain: AndroidToolchain): DoctorState {
  const checks: DoctorStateCheck[] = [];

  if (toolchain.java) {
    checks.push({
      id: 'java',
      status: toolchain.java.compatible ? 'pass' : 'error',
      message: toolchain.java.compatible
        ? `Java ${toolchain.java.major ?? toolchain.java.version ?? 'unknown'} is compatible.`
        : `Java ${toolchain.java.major ?? toolchain.java.version ?? 'unknown'} is older than required Java ${toolchain.java.minimumMajor}.`,
      source: toolchain.java.source,
      version: toolchain.java.version,
      fix: toolchain.java.compatible ? undefined : `Use JDK ${toolchain.java.minimumMajor} or newer for this Deploid process.`
    });
  }

  if (toolchain.androidSdk) {
    checks.push({
      id: 'android-sdk',
      status: 'pass',
      message: `Android SDK resolved at ${toolchain.androidSdk.root}.`,
      source: toolchain.androidSdk.source,
      version: toolchain.androidSdk.version
    });
  }

  if (toolchain.adb) {
    checks.push({
      id: 'adb',
      status: 'pass',
      message: `ADB resolved at ${toolchain.adb.path}.`,
      source: toolchain.adb.source,
      version: toolchain.adb.version
    });
  }

  if (toolchain.sdkmanager) {
    checks.push({
      id: 'sdkmanager',
      status: 'pass',
      message: `sdkmanager resolved at ${toolchain.sdkmanager.path}.`,
      source: toolchain.sdkmanager.source,
      version: toolchain.sdkmanager.version
    });
  }

  if (toolchain.gradle) {
    checks.push({
      id: 'gradle-wrapper',
      status: 'pass',
      message: `Project Gradle wrapper resolved at ${toolchain.gradle.path}.`,
      source: toolchain.gradle.source,
      version: toolchain.gradle.version
    });
  }

  for (const issue of toolchain.issues) {
    const id = issueCodeToCheckId(issue.code);
    if (checks.some((check) => check.id === id && check.status !== 'pass')) continue;
    checks.push({
      id,
      status: issue.severity === 'error' ? 'error' : 'warning',
      message: issue.message,
      fix: issue.fix
    });
  }

  const blockers = checks.filter((check) => check.status === 'error');
  const warnings = checks.filter((check) => check.status === 'warning');
  const capabilities: DoctorCapabilities = {
    buildAndroid: Boolean(toolchain.java?.compatible && toolchain.androidSdk && toolchain.gradle),
    deployAndroid: Boolean(toolchain.adb),
    manageAndroidSdk: Boolean(toolchain.androidSdk && toolchain.sdkmanager),
    fixAndroidProjectSdkPath: Boolean(toolchain.androidSdk)
  };

  const nextActions = unique([
    ...blockers.map((check) => check.fix || check.message),
    ...warnings.map((check) => check.fix || check.message)
  ]);

  return { toolchain, checks, blockers, warnings, capabilities, nextActions };
}

function issueCodeToCheckId(code: string): string {
  switch (code) {
    case 'JAVA_NOT_FOUND':
    case 'JAVA_VERSION_INCOMPATIBLE':
      return 'java';
    case 'ANDROID_SDK_NOT_FOUND':
      return 'android-sdk';
    case 'ADB_NOT_FOUND':
      return 'adb';
    case 'SDKMANAGER_NOT_FOUND':
      return 'sdkmanager';
    case 'GRADLE_WRAPPER_NOT_FOUND':
      return 'gradle-wrapper';
    default:
      return code.toLowerCase().replace(/_/g, '-');
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
