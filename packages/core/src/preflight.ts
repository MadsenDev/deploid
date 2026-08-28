import { buildDoctorStateFromToolchain, type DoctorCheck, type DoctorState } from './doctor-state.js';
import { resolveAndroidToolchain, type AndroidToolchain } from './toolchain.js';

export type AndroidPreflightIntent = 'package' | 'build' | 'deploy' | 'release';

export interface AndroidPreflightResult {
  intent: AndroidPreflightIntent;
  toolchain: AndroidToolchain;
  state: DoctorState;
  blockers: DoctorCheck[];
  warnings: DoctorCheck[];
  ok: boolean;
}

export interface InspectAndroidPreflightOptions {
  cwd?: string;
  intent?: AndroidPreflightIntent;
}

const REQUIRED_CHECKS: Record<AndroidPreflightIntent, Set<string>> = {
  package: new Set(['java', 'android-sdk']),
  build: new Set(['java', 'android-sdk', 'gradle-wrapper']),
  deploy: new Set(['adb']),
  release: new Set(['java', 'android-sdk', 'gradle-wrapper'])
};

export function inspectAndroidPreflight(options: InspectAndroidPreflightOptions = {}): AndroidPreflightResult {
  const cwd = options.cwd ?? process.cwd();
  const intent = options.intent ?? 'build';
  const toolchain = resolveAndroidToolchain({ cwd, minimumJavaMajor: 17 });
  const state = buildDoctorStateFromToolchain(toolchain);
  const required = REQUIRED_CHECKS[intent];
  const blockers = state.blockers.filter((check) => required.has(check.id));
  const warnings = state.warnings.filter((check) => required.has(check.id));

  return {
    intent,
    toolchain,
    state,
    blockers,
    warnings,
    ok: blockers.length === 0
  };
}

export function formatAndroidPreflightFailure(result: AndroidPreflightResult): string[] {
  if (result.ok) return [];

  const lines = ['Missing Android toolchain requirements:'];
  for (const blocker of result.blockers) {
    lines.push(`  • ${blocker.message}`);
    if (blocker.fix) lines.push(`    ${blocker.fix}`);
  }
  lines.push('Run `deploid doctor` for the full environment report.');
  return lines;
}
