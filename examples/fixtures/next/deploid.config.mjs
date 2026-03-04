export default {
  appName: 'FixtureNext',
  appId: 'com.example.fixture.next',
  web: {
    framework: 'next',
    buildCommand: 'npm run build',
    webDir: 'out'
  },
  android: {
    packaging: 'capacitor'
  },
  assets: {
    source: 'assets/logo.svg',
    output: 'assets-gen/'
  }
};
