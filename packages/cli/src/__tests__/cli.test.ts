import { describe, it, expect } from 'vitest';
import { execa } from 'execa';
import path from 'node:path';

describe('Deploid CLI', () => {
  it('should show help when run without arguments', async () => {
    const { stdout } = await execa('node', ['dist/index.js', '--help']);
    expect(stdout).toContain('Build -> package -> sign -> publish web apps to Android');
  });

  it('should show version', async () => {
    const { stdout } = await execa('node', ['dist/index.js', '--version']);
    expect(stdout).toContain('0.1.0');
  });

  it('should list available commands', async () => {
    const { stdout } = await execa('node', ['dist/index.js', '--help']);
    expect(stdout).toContain('init');
    expect(stdout).toContain('assets');
    expect(stdout).toContain('package');
    expect(stdout).toContain('build');
    expect(stdout).toContain('deploy');
    expect(stdout).toContain('firebase');
  });
});
