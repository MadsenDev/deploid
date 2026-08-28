import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseGradleWrapperVersion, parseJavaMajor, resolveAndroidToolchain } from '@deploid/core';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function tempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploid-toolchain-'));
  tempDirs.push(dir);
  return dir;
}

function executable(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, { mode: 0o755 });
}

function fakeJava(home: string, version: string): void {
  executable(path.join(home, 'bin', 'java'), `#!/bin/sh\necho 'openjdk version "${version}"' >&2\n`);
}

function fakeAndroidSdk(root: string): void {
  executable(path.join(root, 'platform-tools', 'adb'), '#!/bin/sh\necho "Android Debug Bridge version 1.0.41"\n');
  executable(path.join(root, 'cmdline-tools', 'latest', 'bin', 'sdkmanager'), '#!/bin/sh\necho "19.0"\n');
  fs.mkdirSync(path.join(root, 'platforms'), { recursive: true });
}

describe('Android toolchain resolver', () => {
  it('parses modern and legacy Java versions', () => {
    expect(parseJavaMajor('openjdk version "21.0.6" 2025-01-21')).toBe(21);
    expect(parseJavaMajor('java version "1.8.0_401"')).toBe(8);
  });

  it('parses Gradle wrapper versions', () => {
    expect(parseGradleWrapperVersion('distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip')).toBe('8.11.1');
  });

  it('prefers explicit overrides over environment variables', () => {
    const cwd = tempProject();
    const overrideJava = path.join(cwd, 'jdk-override');
    const envJava = path.join(cwd, 'jdk-env');
    const overrideSdk = path.join(cwd, 'sdk-override');
    const envSdk = path.join(cwd, 'sdk-env');
    fakeJava(overrideJava, '21.0.6');
    fakeJava(envJava, '17.0.12');
    fakeAndroidSdk(overrideSdk);
    fakeAndroidSdk(envSdk);

    const result = resolveAndroidToolchain({
      cwd,
      overrides: { javaHome: overrideJava, androidSdk: overrideSdk },
      env: { JAVA_HOME: envJava, ANDROID_HOME: envSdk, PATH: '' },
      platform: 'linux',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.java?.home).toBe(path.resolve(overrideJava));
    expect(result.java?.source).toBe('override');
    expect(result.java?.major).toBe(21);
    expect(result.androidSdk?.root).toBe(path.resolve(overrideSdk));
    expect(result.androidSdk?.source).toBe('override');
    expect(result.adb?.path).toBe(path.join(overrideSdk, 'platform-tools', 'adb'));
    expect(result.sdkmanager?.path).toBe(path.join(overrideSdk, 'cmdline-tools', 'latest', 'bin', 'sdkmanager'));
    expect(result.issues).toEqual([]);
  });

  it('uses android/local.properties when SDK environment variables are absent', () => {
    const cwd = tempProject();
    const sdk = path.join(cwd, 'android-sdk');
    fakeAndroidSdk(sdk);
    fs.mkdirSync(path.join(cwd, 'android'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'android', 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`);

    const result = resolveAndroidToolchain({
      cwd,
      env: { PATH: '' },
      platform: 'linux',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.androidSdk?.root).toBe(path.resolve(sdk));
    expect(result.androidSdk?.source).toBe('local-properties');
  });

  it('reports an incompatible Java installation clearly', () => {
    const cwd = tempProject();
    const javaHome = path.join(cwd, 'jdk');
    const sdk = path.join(cwd, 'sdk');
    fakeJava(javaHome, '11.0.24');
    fakeAndroidSdk(sdk);

    const result = resolveAndroidToolchain({
      cwd,
      overrides: { javaHome, androidSdk: sdk },
      env: { PATH: '' },
      minimumJavaMajor: 17,
      platform: 'linux',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.java?.compatible).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'JAVA_VERSION_INCOMPATIBLE', severity: 'error' }));
  });

  it('resolves the project Gradle wrapper and its pinned version', () => {
    const cwd = tempProject();
    const javaHome = path.join(cwd, 'jdk');
    const sdk = path.join(cwd, 'sdk');
    fakeJava(javaHome, '21.0.6');
    fakeAndroidSdk(sdk);
    executable(path.join(cwd, 'android', 'gradlew'), '#!/bin/sh\nexit 0\n');
    const properties = path.join(cwd, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
    fs.mkdirSync(path.dirname(properties), { recursive: true });
    fs.writeFileSync(properties, 'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip\n');

    const result = resolveAndroidToolchain({
      cwd,
      overrides: { javaHome, androidSdk: sdk },
      env: { PATH: '' },
      platform: 'linux',
      homeDir: path.join(cwd, 'home')
    });

    expect(result.gradle).toEqual(expect.objectContaining({
      path: path.join(cwd, 'android', 'gradlew'),
      source: 'gradle-wrapper',
      wrapper: true,
      version: '8.11.1'
    }));
  });
});
