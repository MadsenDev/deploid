export default {
  appName: 'FixtureVite',
  appId: 'com.example.fixture.vite',
  web: {
    framework: 'vite',
    buildCommand: 'npm run build',
    webDir: 'dist'
  },
  android: {
    packaging: 'capacitor'
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/'
  }
};
