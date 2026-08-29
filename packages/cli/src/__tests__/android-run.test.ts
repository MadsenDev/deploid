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

describe('Android run command', () => {
  it('builds, installs, and launches on the selected device', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'deploid-run-'));
    const binDir = path.join(cwd, 'bin');
    const javaHome = path.join(cwd, 'jdk');
    const sdkDir = path.join(cwd, 'android-sdk');
    const adbPath = path.join(sdkDir, 'platform-tools', 'adb');
    const adbLog = path.join(cwd, 'adb.log');

    await fs.mkdir(binDir, { recursive: true });
    await fs.mkdir(path.join(javaHome, 'bin'), { recursive: true });
    await fs.mkdir(path.dirname(adbPath), { recursive: true });
    await fs.mkdir(path.join(sdkDir, 'platforms'), { recursive: true });

    await fs.writeFile(path.join(cwd, 'package.json'), JSON.stringify({ name: 'run-app' }));
    await fs.writeFile(path.join(cwd, 'deploid.config.mjs'), `export default {
  appName: 'RunApp',
  appId: 'com.example.runapp',
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
EOF
  chmod +x "${cwd}/android/gradlew"
  printf 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip\\n' > "${cwd}/android/gradle/wrapper/gradle-wrapper.properties"
  exit 0
fi
exit 0
`);
    await fs.chmod(path.join(binDir, 'npx'), 0o755);

    await fs.writeFile(adbPath, `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "${adbLog}"
if [ "$1" = "version" ]; then echo 'Android Debug Bridge version 1.0.41'; exit 0; fi
if [ "$1" = "devices" ]; then printf 'List of devices attached\\npixel-usb\\tdevice\\n'; exit 0; fi
exit 0
`);
    await fs.chmod(adbPath, 0o755);

    const result = spawnSync('/usr/bin/bash', ['-lc', `node ${shellEscape(cliEntry)} run --device pixel-usb`], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH ?? ''}`,
        DEPLOID_JAVA_HOME: javaHome,
        DEPLOID_ANDROID_SDK: sdkDir
      }
    });

    const adbInvocations = await fs.readFile(adbLog, 'utf8');
    expect(result.status).toBe(0);
    expect(adbInvocations).toContain('devices');
    expect(adbInvocations).toContain('-s pixel-usb install -r');
    expect(adbInvocations).toContain('-s pixel-usb shell am start -n com.example.runapp/.MainActivity');
  });
});
