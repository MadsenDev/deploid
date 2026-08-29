import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliEntry = path.resolve(__dirname, '../../dist/index.js');

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

it('packages before build preflight so a missing Android project can be created', async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'deploid-smart-build-'));
  const binDir = path.join(cwd, 'bin');
  const javaHome = path.join(cwd, 'jdk');
  const sdkDir = path.join(cwd, 'android-sdk');
  const buildLog = path.join(cwd, 'build.log');

  await fs.mkdir(binDir, { recursive: true });
  await fs.mkdir(path.join(javaHome, 'bin'), { recursive: true });
  await fs.mkdir(path.join(sdkDir, 'platforms'), { recursive: true });

  await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({ name: 'smart-build' }));
  await fs.writeFile(path.join(cwd, 'deploid.config.mjs'), `export default {
  appName: 'SmartBuild',
  appId: 'com.example.smartbuild',
  web: { framework: 'vite', buildCommand: 'true', webDir: 'dist' },
  android: { packaging: 'capacitor' }
};\n`);

  await fs.writeFile(path.join(javaHome, 'bin', 'java'), `#!/usr/bin/env bash\necho 'openjdk version "21.0.1"' >&2\n`);
  await fs.chmod(path.join(javaHome, 'bin', 'java'), 0o755);

  await fs.writeFile(path.join(binDir, 'npm'), '#!/usr/bin/env bash\necho 10.0.0\n');
  await fs.chmod(path.join(binDir, 'npm'), 0o755);

  await fs.writeFile(path.join(binDir, 'npx'), `#!/usr/bin/env bash
if [[ "$*" == *"--version"* ]]; then echo 7.0.0; exit 0; fi
if [[ "$*" == *" sync"* ]]; then
  mkdir -p "${cwd}/android/gradle/wrapper" "${cwd}/android/app/src/main/assets/public"
  cat > "${cwd}/android/gradlew" <<'EOF'
#!/usr/bin/env bash
mkdir -p app/build/outputs/apk/debug
printf apk > app/build/outputs/apk/debug/app-debug.apk
printf '%s\\n' "$*" >> "${buildLog}"
EOF
  chmod +x "${cwd}/android/gradlew"
  printf 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip\\n' > "${cwd}/android/gradle/wrapper/gradle-wrapper.properties"
  exit 0
fi
exit 0
`);
  await fs.chmod(path.join(binDir, 'npx'), 0o755);

  const result = spawnSync('/usr/bin/bash', ['-lc', `node ${shellEscape(cliEntry)} build`], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH ?? ''}`,
      DEPLOID_JAVA_HOME: javaHome,
      DEPLOID_ANDROID_SDK: sdkDir
    }
  });

  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Preparing Android project...');
  expect(await fs.readFile(buildLog, 'utf8')).toContain('assembleDebug');
});
