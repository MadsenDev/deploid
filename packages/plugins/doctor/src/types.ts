export type CheckStatus = 'pass' | 'warn' | 'fail';
export type CheckCategory = 'project' | 'workflows' | 'tooling' | 'plugins' | 'release';
export type WorkflowId = 'init' | 'build' | 'release' | 'deploy' | 'desktop';
export type FixStatus = 'applied' | 'skipped' | 'failed';

export interface CheckResult {
  id: string;
  category: CheckCategory;
  title: string;
  status: CheckStatus;
  message: string;
  details?: string;
  workflows: WorkflowId[];
  fixable?: boolean;
}

export interface WorkflowReadiness {
  id: WorkflowId;
  title: string;
  status: CheckStatus;
  score: number;
  totals: Record<CheckStatus, number>;
  nextAction?: string;
}

export interface FixResult {
  id: string;
  title: string;
  status: FixStatus;
  message: string;
}

export interface DoctorSummary {
  ok: boolean;
  cwd: string;
  checks: CheckResult[];
  totals: Record<CheckStatus, number>;
  workflows: WorkflowReadiness[];
  fixes: FixResult[];
}

export interface DoctorOptions {
  json?: boolean;
  markdown?: boolean;
  ci?: boolean;
  summary?: boolean;
  verbose?: boolean;
  projectOnly?: boolean;
  fix?: boolean;
}

export interface DeploidConfigShape {
  appName?: string;
  appId?: string;
  web?: { framework?: string; buildCommand?: string; webDir?: string };
  android?: {
    packaging?: string;
    signing?: {
      keystorePath?: string;
      alias?: string;
      storePasswordEnv?: string;
      keyPasswordEnv?: string;
    };
    version?: { code?: number; name?: string };
  };
  assets?: { source?: string; output?: string };
  publish?: {
    play?: { track?: string; serviceAccountJson?: string };
    github?: { repo?: string; draft?: boolean };
  };
  plugins?: string[];
}

export interface ProjectState {
  cwd: string;
  packageJsonPath: string;
  packageJson: Record<string, unknown> | null;
  configPath: string | null;
  config: DeploidConfigShape | null;
  capacitorConfigPath: string;
  capacitorConfig: Record<string, unknown> | null;
  androidDir: string;
  androidBuildGradlePath: string;
  packageDeps: Record<string, unknown>;
  packageScripts: Record<string, unknown>;
}

export function categoryFor(id: string): CheckCategory {
  if (['node', 'npm', 'npx', 'java', 'adb', 'android-sdk', 'android-local-properties', 'android-sdk-permissions', 'android-sdk-licenses', 'sdkmanager', 'gradle-wrapper'].includes(id)) return 'tooling';
  if (['capacitor-dependency', 'electron-dependency', 'plugin-state'].includes(id)) return 'plugins';
  if (['android-signing', 'versioning', 'play-service-account', 'github-release', 'package-build-meta'].includes(id)) return 'release';
  if (['build-command', 'capacitor-sync'].includes(id)) return 'workflows';
  return 'project';
}

export function result(status: CheckStatus, id: string, title: string, message: string, workflows: WorkflowId[], details?: string, fixable = false): CheckResult {
  return { id, category: categoryFor(id), title, status, message, details, workflows, fixable };
}

export const pass = (id: string, title: string, message: string, workflows: WorkflowId[], details?: string, fixable = false) => result('pass', id, title, message, workflows, details, fixable);
export const warn = (id: string, title: string, message: string, workflows: WorkflowId[], details?: string, fixable = false) => result('warn', id, title, message, workflows, details, fixable);
export const fail = (id: string, title: string, message: string, workflows: WorkflowId[], details?: string, fixable = false) => result('fail', id, title, message, workflows, details, fixable);
