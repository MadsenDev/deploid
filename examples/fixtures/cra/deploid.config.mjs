export default {
  appName: 'FixtureCra',
  appId: 'com.example.fixture.cra',
  web: {
    framework: 'cra',
    buildCommand: 'npm run build',
    webDir: 'build'
  },
  android: {
    packaging: 'capacitor'
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/'
  }
};
