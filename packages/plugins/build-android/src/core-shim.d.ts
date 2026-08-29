declare module '#core' {
  export const ANDROID_MINIMUM_JAVA_MAJOR: number;

  export interface AndroidToolchain {
    java?: {
      home: string;
      path: string;
      source: string;
      version?: string;
      major?: number;
      compatible: boolean;
      minimumMajor: number;
    };
    androidSdk?: {
      root: string;
      path: string;
      source: string;
      version?: string;
    };
    adb?: { path: string; source: string; version?: string };
    sdkmanager?: { path: string; source: string; version?: string };
    gradle?: { path: string; source: string; version?: string; wrapper: boolean };
    issues: Array<{
      code: string;
      severity: 'warning' | 'error';
      message: string;
      fix?: string;
    }>;
  }

  export function resolveAndroidToolchain(options?: {
    cwd?: string;
    minimumJavaMajor?: number;
  }): AndroidToolchain;
}
