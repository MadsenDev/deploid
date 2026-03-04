import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

describe('Deploid CLI', () => {
  const cliEntry = path.resolve('dist/index.js');

  it('should show help when run without arguments', async () => {
    const { stdout } = await execa('node', [cliEntry, '--help']);
    expect(stdout).toContain('Build -> package -> sign -> publish web apps to Android');
  });

  it('should show version', async () => {
    const { stdout } = await execa('node', [cliEntry, '--version']);
    expect(stdout).toContain('2.0.0');
  });

  it('should list available commands', async () => {
    const { stdout } = await execa('node', [cliEntry, '--help']);
    expect(stdout).toContain('init');
    expect(stdout).toContain('assets');
    expect(stdout).toContain('package');
    expect(stdout).toContain('build');
    expect(stdout).toContain('deploy');
    expect(stdout).toContain('firebase');
  });

  it('should fail fast for publish in 2.0', async () => {
    const { stderr, exitCode } = await execa('node', [cliEntry, 'publish'], {
      reject: false
    });
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('not implemented');
  });

  it('should reject non-capacitor packaging in 2.0', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deploid-test-'));
    await fs.writeFile(
      path.join(tmpDir, 'deploid.config.mjs'),
      `export default {
  appName: 'TestApp',
  appId: 'com.example.testapp',
  web: { framework: 'vite', buildCommand: 'npm run build', webDir: 'dist' },
  android: { packaging: 'tauri' }
};\n`
    );

    const { stderr, exitCode } = await execa('node', [cliEntry, 'package'], {
      cwd: tmpDir,
      reject: false
    });

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('not supported in Deploid 2.0');
  });
});
