export type CheckStatus = 'pass' | 'warn' | 'fail';
export type WorkflowId = 'init' | 'build' | 'release' | 'deploy' | 'desktop';

export interface CheckResult {
  id: string;
  category: 'project' | 'workflows' | 'tooling' | 'plugins' | 'release';
  title: string;
  status: CheckStatus;
  message: string;
  details?: string;
  workflows: WorkflowId[];
  fixable?: boolean;
}

export interface SharedDoctorState {
  toolchain?: {
    java?: { home: string; path: string; source: string; version?: string; major?: number; compatible: boolean; minimumMajor: number };
    androidSdk?: { root: string; path: string; source: string; version?: string };
    adb?: { path: string; source: string; version?: string };
    sdkmanager?: { path: string; source: string; version?: string };
    gradle?: { path: string; source: string; version?: string; wrapper: boolean };
  };
  checks: Array<{
    id: string;
    status: 'pass' | 'warning' | 'error';
    message: string;
    fix?: string;
    source?: string;
    version?: string;
  }>;
  capabilities: {
    buildAndroid: boolean;
    deployAndroid: boolean;
    manageAndroidSdk: boolean;
    fixAndroidProjectSdkPath: boolean;
  };
  nextActions?: string[];
}

const TITLES: Record<string, string> = {
  java: 'Java',
  'android-sdk': 'Android SDK',
  adb: 'ADB',
  sdkmanager: 'sdkmanager',
  'gradle-wrapper': 'Gradle wrapper'
};

const WORKFLOWS: Record<string, WorkflowId[]> = {
  java: ['build', 'release'],
  'android-sdk': ['build', 'release', 'deploy'],
  adb: ['deploy'],
  sdkmanager: ['build', 'release'],
  'gradle-wrapper': ['build', 'release']
};

export function sharedToolingChecks(state?: SharedDoctorState): CheckResult[] {
  if (!state) return [];
  return state.checks.map((check) => ({
    id: check.id,
    category: 'tooling',
    title: TITLES[check.id] || check.id,
    status: check.status === 'warning' ? 'warn' : check.status === 'error' ? 'fail' : 'pass',
    message: check.message,
    details: check.fix || formatMetadata(check.source, check.version),
    workflows: WORKFLOWS[check.id] || ['build'],
    fixable: check.id === 'android-sdk' && state.capabilities.fixAndroidProjectSdkPath
  }));
}

function formatMetadata(source?: string, version?: string): string | undefined {
  const parts = [source ? `source: ${source}` : undefined, version ? `version: ${version}` : undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}
