import path from 'node:path';
import { resolveAndroidToolchain, type AndroidToolchain } from './toolchain.js';

const TOOLCHAIN_ENV_KEYS = ['JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SDK_ROOT', 'PATH'] as const;
type ToolchainEnvKey = (typeof TOOLCHAIN_ENV_KEYS)[number];

export interface ResolvedToolchainEnvironment {
  toolchain: AndroidToolchain;
  env: NodeJS.ProcessEnv;
}

export function buildAndroidToolchainEnvironment(
  toolchain: AndroidToolchain,
  baseEnv: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...baseEnv };
  const pathEntries: string[] = [];

  if (toolchain.java) {
    env.JAVA_HOME = toolchain.java.home;
    pathEntries.push(path.dirname(toolchain.java.path));
  }

  if (toolchain.androidSdk) {
    env.ANDROID_HOME = toolchain.androidSdk.root;
    env.ANDROID_SDK_ROOT = toolchain.androidSdk.root;
  }

  if (toolchain.adb) pathEntries.push(path.dirname(toolchain.adb.path));
  if (toolchain.sdkmanager) pathEntries.push(path.dirname(toolchain.sdkmanager.path));

  const existingPath = baseEnv.PATH ?? '';
  const existingEntries = existingPath.split(path.delimiter).filter(Boolean);
  env.PATH = [...new Set([...pathEntries, ...existingEntries])].join(path.delimiter);
  return env;
}

export function resolveAndroidToolchainEnvironment(
  cwd: string,
  baseEnv: NodeJS.ProcessEnv = process.env
): ResolvedToolchainEnvironment {
  const toolchain = resolveAndroidToolchain({ cwd, env: baseEnv, minimumJavaMajor: 17 });
  return { toolchain, env: buildAndroidToolchainEnvironment(toolchain, baseEnv) };
}

export async function withResolvedAndroidToolchainEnvironment<T>(
  cwd: string,
  run: (toolchain: AndroidToolchain) => Promise<T>
): Promise<T> {
  const { toolchain, env } = resolveAndroidToolchainEnvironment(cwd, process.env);
  const previous = new Map<ToolchainEnvKey, string | undefined>(
    TOOLCHAIN_ENV_KEYS.map((key) => [key, process.env[key]])
  );

  try {
    for (const key of TOOLCHAIN_ENV_KEYS) {
      const value = env[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return await run(toolchain);
  } finally {
    for (const key of TOOLCHAIN_ENV_KEYS) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
