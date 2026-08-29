import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { ANDROID_MINIMUM_JAVA_MAJOR, resolveAndroidToolchain, type AndroidToolchain } from '#core';

interface BuildOptions {
  release?: boolean;
}

interface PipelineContext {
  logger: any;
  config: any;
  cwd: string;
  debug?: boolean;
  buildOptions?: BuildOptions;
}

interface PipelineStep {
  (context: PipelineContext): Promise<void>;
}

const runBuildAndroid: PipelineStep = async ({ logger, config, cwd, debug, buildOptions }) => {
  logger.info(`build-android: building Android artifacts for ${config.appName}`);

  if (debug) {
    logger.debugEnv();
    logger.debugStep('Initializing Android build process');
  }

  try {
    const androidPath = path.join(cwd, 'android');
    if (!fs.existsSync(androidPath)) {
      throw new Error('Android project not found. Run "deploid package" first.');
    }

    const toolchain = resolveBuildToolchain(cwd);
    logResolvedToolchain(toolchain, logger, debug);
    ensureLocalProperties(androidPath, toolchain.androidSdk!.root, logger);

    logger.info('Building debug APK...');
    await runGradle(toolchain, androidPath, ['assembleDebug'], debug ? logger : undefined);

    const apkPath = path.join(androidPath, 'app/build/outputs/apk/debug/app-debug.apk');
    if (debug) {
      logger.debugFile('Checking for generated APK', apkPath, fs.existsSync(apkPath));
    }

    if (fs.existsSync(apkPath)) {
      logger.info(`✅ Debug APK generated: ${apkPath}`);
      if (debug) {
        const stats = fs.statSync(apkPath);
        logger.debug(`APK size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      }
    } else {
      logger.warn('Debug APK not found in expected location');
      if (debug) logAlternativeOutputs(androidPath, logger);
    }

    const shouldBuildRelease = buildOptions?.release !== false;
    if (!shouldBuildRelease) {
      logger.info('Debug-only build requested; skipping release artifacts');
    } else if (config.android.signing?.keystorePath) {
      logger.info('Building release AAB...');
      await runGradle(toolchain, androidPath, ['bundleRelease'], debug ? logger : undefined);

      const aabPath = path.join(androidPath, 'app/build/outputs/bundle/release/app-release.aab');
      if (fs.existsSync(aabPath)) {
        logger.info(`✅ Release AAB generated: ${aabPath}`);
      } else {
        logger.warn('Release AAB not found in expected location');
      }
    } else {
      logger.info('No signing configured, skipping release build');
    }

    logger.info('✅ Android build complete');
  } catch (error) {
    logger.error(`Android build failed: ${error}`);
    throw error;
  }
};

const plugin = {
  name: 'build-android',
  requirements: ['java', 'android-sdk'],
  plan: () => ['Validate Android toolchain and project', 'Build debug APK', 'Build signed release AAB (optional)'],
  validate: async ({ cwd }: PipelineContext) => {
    const androidPath = path.join(cwd, 'android');
    if (!fs.existsSync(androidPath)) {
      throw new Error('Android project not found. Run "deploid package" first.');
    }
    resolveBuildToolchain(cwd);
  },
  run: runBuildAndroid
};

const buildAndroidPlugin = (): PipelineStep => runBuildAndroid;

function resolveBuildToolchain(cwd: string): AndroidToolchain {
  const toolchain = resolveAndroidToolchain({ cwd, minimumJavaMajor: ANDROID_MINIMUM_JAVA_MAJOR });
  const blocking = toolchain.issues.filter((issue) => issue.severity === 'error');

  if (blocking.length > 0) {
    const details = blocking
      .map((issue) => `  • [${issue.code}] ${issue.message}${issue.fix ? `\n    ${issue.fix}` : ''}`)
      .join('\n');
    throw new Error(`Android toolchain is not ready:\n${details}\n\nRun \`deploid doctor\` for a full environment check.`);
  }

  if (!toolchain.java || !toolchain.androidSdk || !toolchain.gradle) {
    throw new Error('Android toolchain resolution succeeded without all required build tools.');
  }

  return toolchain;
}

async function runGradle(
  toolchain: AndroidToolchain,
  androidPath: string,
  args: string[],
  debugLogger?: any
): Promise<void> {
  const gradle = toolchain.gradle!;
  if (debugLogger) debugLogger.debugCommand(gradle.path, args, androidPath);

  await execa(gradle.path, args, {
    cwd: androidPath,
    stdio: 'inherit',
    env: buildAndroidEnv(toolchain)
  });
}

function buildAndroidEnv(toolchain: AndroidToolchain): NodeJS.ProcessEnv {
  const java = toolchain.java!;
  const androidSdk = toolchain.androidSdk!;
  return {
    ...process.env,
    JAVA_HOME: java.home,
    ANDROID_HOME: androidSdk.root,
    ANDROID_SDK_ROOT: androidSdk.root
  };
}

function logResolvedToolchain(toolchain: AndroidToolchain, logger: any, debug?: boolean): void {
  const java = toolchain.java!;
  const sdk = toolchain.androidSdk!;
  const gradle = toolchain.gradle!;

  logger.info(`Using Java ${java.major ?? java.version ?? 'unknown'} from ${java.source}`);
  logger.info(`Using Android SDK from ${sdk.source}: ${sdk.root}`);
  logger.info(`Using project Gradle wrapper${gradle.version ? ` ${gradle.version}` : ''}`);

  for (const issue of toolchain.issues.filter((item) => item.severity === 'warning')) {
    logger.warn(`${issue.message}${issue.fix ? ` ${issue.fix}` : ''}`);
  }

  if (debug) {
    logger.debug(`Java Home: ${java.home}`);
    logger.debug(`Android SDK: ${sdk.root}`);
    logger.debug(`Gradle wrapper: ${gradle.path}`);
    if (toolchain.adb) logger.debug(`ADB: ${toolchain.adb.path}`);
    if (toolchain.sdkmanager) logger.debug(`sdkmanager: ${toolchain.sdkmanager.path}`);
  }
}

function ensureLocalProperties(androidPath: string, sdkPath: string, logger: any): void {
  const localPropertiesPath = path.join(androidPath, 'local.properties');
  const sdkLine = `sdk.dir=${escapePropertiesPath(sdkPath)}`;
  const existing = fs.existsSync(localPropertiesPath) ? fs.readFileSync(localPropertiesPath, 'utf8') : '';
  if (existing.includes(sdkLine)) return;

  const next = existing.match(/^sdk\.dir=/m)
    ? existing.replace(/^sdk\.dir=.*$/m, sdkLine)
    : `${existing}${existing.length > 0 && !existing.endsWith('\n') ? '\n' : ''}${sdkLine}\n`;
  fs.writeFileSync(localPropertiesPath, next);
  logger.info?.(`Updated android/local.properties with detected Android SDK: ${sdkPath}`);
}

function escapePropertiesPath(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

function logAlternativeOutputs(androidPath: string, logger: any): void {
  logger.debug('Checking alternative APK locations...');
  const altPaths = [
    path.join(androidPath, 'app/build/outputs/apk/debug'),
    path.join(androidPath, 'app/build/outputs')
  ];
  for (const altPath of altPaths) {
    if (!fs.existsSync(altPath)) continue;
    logger.debug(`Found directory: ${altPath}`);
    const files = fs.readdirSync(altPath, { recursive: true });
    logger.debug(`Contents: ${JSON.stringify(files, null, 2)}`);
  }
}

export default plugin;
export { buildAndroidPlugin, plugin };
