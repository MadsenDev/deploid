declare module '#core' {
  export interface DoctorState {
    checks: Array<{
      id: string;
      status: 'pass' | 'warning' | 'error';
      message: string;
      fix?: string;
      source?: string;
      version?: string;
    }>;
    blockers: unknown[];
    warnings: unknown[];
    capabilities: {
      buildAndroid: boolean;
      deployAndroid: boolean;
      manageAndroidSdk: boolean;
      fixAndroidProjectSdkPath: boolean;
    };
    nextActions: string[];
  }
}
