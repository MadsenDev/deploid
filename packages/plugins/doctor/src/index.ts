import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { applyFixes } from './fixes.js';
import { collectProjectChecks, collectRuntimeChecks, loadProjectState } from './project.js';
import { printSummary, renderCi, renderMarkdown } from './render.js';
import { sharedToolingChecks, type SharedDoctorState } from './tooling.js';
import type { CheckResult, CheckStatus, DoctorOptions, DoctorSummary, WorkflowId, WorkflowReadiness } from './types.js';
import { pass, warn } from './types.js';

interface PipelineContext {
  cwd: string;
  doctorOptions?: DoctorOptions;
  doctorState?: SharedDoctorState;
}

const WORKFLOW_TITLES: Record<WorkflowId, string> = {
  init: 'Project setup',
  build: 'Android build',
  release: 'Release readiness',
  deploy: 'Device deploy'
};

const plugin = {
  name: 'doctor',
  plan: () => [
    'Inspect project consistency',
    'Consume shared Android toolchain state',
    'Assess workflow readiness and safe fixes'
  ],
  run: runDoctor
};

async function runDoctor(ctx: PipelineContext): Promise<void> {
  const options = ctx.doctorOptions ?? {};
  const summary = await inspectProject(ctx.cwd, options, ctx.doctorState);
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else if (options.markdown) console.log(renderMarkdown(summary, options));
  else if (options.ci) console.log(renderCi(summary));
  else printSummary(summary, options);
  if (!summary.ok) process.exitCode = 1;
}

async function inspectProject(cwd: string, options: DoctorOptions = {}, doctorState?: SharedDoctorState): Promise<DoctorSummary> {
  const state = await loadProjectState(cwd);
  const checks: CheckResult[] = collectProjectChecks(state);
  const fixes = [];

  if (!options.projectOnly) {
    checks.push(...collectRuntimeChecks());
    checks.push(...sharedToolingChecks(doctorState));
    checks.push(...inspectResolvedAndroidEnvironment(state.androidDir, doctorState));
  }

  if (options.fix) {
    fixes.push(...applyFixes(state, checks, doctorState));
    if (fixes.some((fix) => fix.status === 'applied')) {
      const refreshed = await inspectProject(cwd, { ...options, fix: false }, doctorState);
      return { ...refreshed, fixes };
    }
  }

  const totals = countStatuses(checks);
  return {
    ok: totals.fail === 0,
    cwd,
    checks,
    totals,
    workflows: buildWorkflowReadiness(checks),
    fixes
  };
}

function inspectResolvedAndroidEnvironment(androidDir: string, state?: SharedDoctorState): CheckResult[] {
  const checks: CheckResult[] = [];
  const sdkPath = state?.toolchain?.androidSdk?.root;
  const adbPath = state?.toolchain?.adb?.path;

  if (sdkPath) {
    const localProperties = path.join(androidDir, 'local.properties');
    const configured = readSdkDirProperty(localProperties);
    if (!fs.existsSync(androidDir)) {
      checks.push(warn('android-local-properties', 'Android SDK path', 'Skipped because android/ has not been generated yet.', ['build', 'release']));
    } else if (configured === sdkPath) {
      checks.push(pass('android-local-properties', 'Android SDK path', 'android/local.properties points at the resolved SDK.', ['build', 'release']));
    } else {
      checks.push(warn('android-local-properties', 'Android SDK path', 'android/local.properties does not pin the resolved SDK.', ['build', 'release'], `Run \`deploid doctor --fix\` to set sdk.dir=${sdkPath}.`, true));
    }

    try {
      fs.accessSync(sdkPath, fs.constants.W_OK);
      checks.push(pass('android-sdk-permissions', 'SDK permissions', `SDK directory is writable: ${sdkPath}.`, ['build', 'release']));
    } catch {
      checks.push(warn('android-sdk-permissions', 'SDK permissions', `SDK directory is not writable: ${sdkPath}.`, ['build', 'release'], 'Use a user-writable Android SDK or fix its ownership/permissions.'));
    }

    const licensePath = path.join(sdkPath, 'licenses', 'android-sdk-license');
    checks.push(fs.existsSync(licensePath)
      ? pass('android-sdk-licenses', 'SDK licenses', 'Android SDK license file is present.', ['build', 'release'])
      : warn('android-sdk-licenses', 'SDK licenses', 'Android SDK license file was not found.', ['build', 'release'], 'Run `sdkmanager --licenses` and accept the Android SDK licenses.'));

    if (!fs.existsSync(path.join(sdkPath, 'build-tools'))) {
      checks.push(warn('android-build-tools', 'Android build tools', 'Android SDK build-tools directory is missing.', ['build', 'release'], 'Install Android SDK Build Tools.'));
    }
  }

  if (adbPath) checks.push(checkConnectedDevices(adbPath));
  return checks;
}

function checkConnectedDevices(adbPath: string): CheckResult {
  const run = spawnSync(adbPath, ['devices'], { encoding: 'utf8', timeout: 5000 });
  if (run.error) return warn('adb-devices', 'Android devices', 'ADB is resolved but device enumeration could not complete.', ['deploy'], run.error.message);
  if (run.status !== 0) return warn('adb-devices', 'Android devices', 'ADB is resolved but device enumeration failed.', ['deploy'], run.stderr?.trim());
  const devices = `${run.stdout || ''}`.split(/\r?\n/).filter((line) => /\t/.test(line));
  const unavailable = devices.filter((line) => /\t(unauthorized|offline)$/.test(line));
  if (unavailable.length > 0) return warn('adb-devices', 'Android devices', `${unavailable.length} device(s) need authorization or are offline.`, ['deploy'], unavailable.join(', '));
  if (devices.length === 0) return warn('adb-devices', 'Android devices', 'ADB is available but no Android devices are connected.', ['deploy']);
  return pass('adb-devices', 'Android devices', `${devices.length} Android device(s) connected.`, ['deploy']);
}

function readSdkDirProperty(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  const line = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).find((entry) => entry.trim().startsWith('sdk.dir='));
  return line?.slice('sdk.dir='.length).trim().replace(/\\:/g, ':').replace(/\\\\/g, '\\');
}

function countStatuses(checks: CheckResult[]): Record<CheckStatus, number> {
  return {
    pass: checks.filter((check) => check.status === 'pass').length,
    warn: checks.filter((check) => check.status === 'warn').length,
    fail: checks.filter((check) => check.status === 'fail').length
  };
}

function buildWorkflowReadiness(checks: CheckResult[]): WorkflowReadiness[] {
  return (Object.keys(WORKFLOW_TITLES) as WorkflowId[]).map((workflow) => {
    const relevant = checks.filter((check) => check.workflows.includes(workflow));
    const totals = countStatuses(relevant);
    const total = relevant.length || 1;
    const score = Math.max(0, Math.round(((totals.pass + totals.warn * 0.5) / total) * 100));
    const status: CheckStatus = totals.fail > 0 ? 'fail' : totals.warn > 0 ? 'warn' : 'pass';
    const first = relevant.find((check) => check.status !== 'pass');
    return { id: workflow, title: WORKFLOW_TITLES[workflow], status, score, totals, nextAction: first?.details || first?.message };
  });
}

export default plugin;
export { inspectProject, plugin };
