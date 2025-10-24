// Simple config without import for testing
export default {
  appName: 'ViteReactApp',
  appId: 'com.example.vitereactapp',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist',
    pwa: { manifest: 'public/manifest.json', serviceWorker: true },
  },
  android: {
    packaging: 'capacitor',
    targetSdk: 34,
    minSdk: 24,
    permissions: ['INTERNET', 'CAMERA'],
    version: { code: 1, name: '1.0.0' },
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/',
  },
  publish: {
    github: { repo: 'your-username/your-repo', draft: true },
  },
};
