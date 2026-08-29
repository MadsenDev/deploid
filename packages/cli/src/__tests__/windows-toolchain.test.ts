import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveAndroidToolchain } from '@deploid/core';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function tempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploid-win-toolchain-'));
  tempDirs.push(dir);
  return dir;
}

function executable(filePath: string, output = ''): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `#!/bin/sh\n${output}\n`, { mode: 0o755 });
}

function fakeJava(home: string): void {
  executable(path.join(home, 'bin', 'java.exe'), `echo 'openjdk version "21.0.6"' >&2`);
}

describe('Windows Android toolchain resolution', () => {
  it('uses injected LOCALAPPDATA instead of the host process environment', () => {
    const cwd = tempProject();
    const localAppData = path.join(cwd, 'LocalAppData');
    const sdk = path.join(localAppData, 'Android', 'Sdk');
    const javaHome = path.join(cwd, 'jdk');

    fakeJava(javaHome);
    fs.mkdirSync(path.join(sdk, 'platforms'), { recursive: true });
    executable(path.join(sdk, 'platform-tools', 'adb.exe'), `echo 'Android Debug Bridge version 1.0.41'`);
    executable(path.join(sdk, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat'), `echo '19.0'`);

    const result = resolveAndroidToolchain({
      cwd,
      env: {
        DEPLOID_JAVA_HOME: javaHome,
        LOCALAPPDATA: localAppData,
        PATH: ''
      },
      platform: 'win32',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.androidSdk?.root).toBe(path.resolve(sdk));
    expect(result.androidSdk?.source).toBe('known-location');
    expect(result.adb?.path).toBe(path.join(sdk, 'platform-tools', 'adb.exe'));
  });

  it('resolves the Windows Gradle wrapper and its pinned version', () => {
    const cwd = tempProject();
    const javaHome = path.join(cwd, 'jdk');
    const sdk = path.join(cwd, 'sdk');
    const wrapper = path.join(cwd, 'android', 'gradlew.bat');

    fakeJava(javaHome);
    fs.mkdirSync(path.join(sdk, 'platforms'), { recursive: true });
    fs.mkdirSync(path.join(cwd, 'android', 'gradle', 'wrapper'), { recursive: true });
    fs.writeFileSync(wrapper, '@echo off\r\n');
    fs.writeFileSync(
      path.join(cwd, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties'),
      'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip\n'
    );

    const result = resolveAndroidToolchain({
      cwd,
      env: { DEPLOID_JAVA_HOME: javaHome, DEPLOID_ANDROID_SDK: sdk, PATH: '' },
      platform: 'win32',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.gradle?.path).toBe(wrapper);
    expect(result.gradle?.wrapper).toBe(true);
    expect(result.gradle?.version).toBe('8.11.1');
  });

  it('honors PATHEXT when resolving adb from PATH', () => {
    const cwd = tempProject();
    const bin = path.join(cwd, 'bin');
    const adb = path.join(bin, 'adb.CMD');
    executable(adb, `echo 'Android Debug Bridge version 1.0.41'`);

    const result = resolveAndroidToolchain({
      cwd,
      env: { PATH: bin, PATHEXT: '.EXE;.CMD;.BAT' },
      platform: 'win32',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.adb?.path?.toLowerCase()).toBe(adb.toLowerCase());
    expect(result.adb?.source).toBe('path');
  });
});
