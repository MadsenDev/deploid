declare module '#core' {
  export interface AndroidPreflightResult {
    ok: boolean;
    toolchain: {
      adb?: { path: string };
    };
    blockers: Array<{ message: string; fix?: string }>;
  }

  export function inspectAndroidPreflight(options?: {
    cwd?: string;
    intent?: 'package' | 'build' | 'deploy' | 'release';
  }): AndroidPreflightResult;
}
