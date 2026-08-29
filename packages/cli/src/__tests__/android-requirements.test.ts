import { describe, expect, it } from 'vitest';
import {
  ANDROID_BUILD_REQUIREMENTS,
  ANDROID_MINIMUM_JAVA_MAJOR,
  ANDROID_PREFERRED_JAVA_MAJOR,
  resolveAndroidToolchain
} from '@deploid/core';


describe('Android Java requirements', () => {
  it('keeps the supported minimum and preferred JDK explicit', () => {
    expect(ANDROID_MINIMUM_JAVA_MAJOR).toBe(17);
    expect(ANDROID_PREFERRED_JAVA_MAJOR).toBe(21);
    expect(ANDROID_BUILD_REQUIREMENTS).toEqual({
      minimumJavaMajor: 17,
      preferredJavaMajor: 21
    });
  });

  it('uses the shared minimum when no resolver override is supplied', () => {
    const result = resolveAndroidToolchain({
      cwd: process.cwd(),
      env: { PATH: '' },
      platform: 'linux',
      homeDir: '/nonexistent'
    });

    const javaIssue = result.issues.find((issue) => issue.code === 'JAVA_NOT_FOUND');
    expect(javaIssue?.message).toContain('Java 17 or newer');
  });
});
