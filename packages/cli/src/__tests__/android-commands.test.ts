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

function runCli(args: string[], cwd: string, env: Record<string, string>) {
  return spawnSync('/usr/bin/bash', ['-lc', `node ${shellEscape(cliEntry)} ${args.map(shellEscape).join(' ')}`], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
}

describe('Android CLI commands', () => {
  it('uses resolved adb for uninstall', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deploid-uninstall-'));
    const sdkDir = path.join(tmpDir, 'android-sdk');
    const adbPath = path.join(sdkDir, 'platform-tools', 'adb');
    const logPath = path.join(tmpDir, 'adb-invocations.log');
    await fs.mkdir(path.dirname(adbPath), { recursive: true });
    await fs.mkdir(path.join(sdkDir, 'platforms'), { recursive: true });
    await fs.writeFile(
      adbPath,
      `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "${logPath}"\nif [ "$1" = "version" ]; then printf 'Android Debug Bridge version 1.0.41\\n'; fi\nexit 0\n`
    );
    await fs.chmod(adbPath, 0o755);

    const result = runCli(
      ['uninstall', '--app-id', 'com.example.app', '--device', 'pixel-usb'],
      tmpDir,
      { DEPLOID_ANDROID_SDK: sdkDir }
    );

    const invocations = await fs.readFile(logPath, 'utf8');
    expect(result.status).toBe(0);
    expect(invocations).toContain('-s pixel-usb uninstall com.example.app');
  });
});
