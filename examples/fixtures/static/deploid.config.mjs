export default {
  appName: 'FixtureStatic',
  appId: 'com.example.fixture.static',
  web: {
    framework: 'static',
    buildCommand: 'npm run build',
    webDir: 'public'
  },
  android: {
    packaging: 'capacitor'
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/'
  }
};
