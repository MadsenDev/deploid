export type PackagingEngine = 'capacitor' | 'tauri' | 'twa';

export interface ShipwrightConfig {
  appName: string;
  appId: string;
  web: {
    framework: 'vite' | 'next' | 'cra' | 'static';
    buildCommand: string;
    webDir: string;
    pwa?: { manifest?: string; serviceWorker?: boolean };
  };
  android: {
    packaging: PackagingEngine;
    targetSdk?: number;
    minSdk?: number;
    permissions?: string[];
    signing?: {
      keystorePath?: string;
      alias?: string;
      storePasswordEnv?: string;
      keyPasswordEnv?: string;
    };
    version?: { code: number; name: string };
  };
  assets?: { source: string; output?: string };
  publish?: {
    play?: { track?: 'internal' | 'alpha' | 'beta' | 'production'; serviceAccountJson?: string };
    github?: { repo: string; draft?: boolean };
  };
  plugins?: string[];
}


