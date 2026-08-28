import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { inspectAndroidPreflight } from '#core';

interface DeployOptions {
  force?: boolean;
  launch?: boolean;
  device?: string;
  bootEmulator?: string;
  logs?: boolean;
  logFilter?: string;
}

interface PipelineContext {
  logger: any;
  config: any;
  cwd: string;
  deployOptions?: DeployOptions;
}

type PipelineStep = (context: PipelineContext) => Promise<void>;

const runDeployAndroid: PipelineStep = async ({ logger, config, cwd, deployOptions }) => {
  logger.info(`deploy-android: deploying ${config.appName} to Android target(s)`);

  const preflight = inspectAndroidPreflight({ cwd, intent: 'deploy' });
  const adbPath = preflight.toolchain.adb?.path;
  if (!preflight.ok || !adbPath) {
    const blocker = preflight.blockers[0];
    throw new Error(blocker?.fix ? `${blocker.message} ${blocker.fix}` : blocker?.message || 'ADB could not be resolved.');
  }

  const apkPath = path.join(cwd, 'android/app/build/outputs/apk/debug/app-debug.apk');
  if (!fs.existsSync(apkPath)) {
    throw new Error('APK not found. Run "deploid build" first.');
  }

  logger.debug(`Using ADB: ${adbPath}`);
  logger.info(`APK found: ${apkPath}`);

  if (deployOptions?.bootEmulator) {
    await bootEmulator(deployOptions.bootEmulator, adbPath, logger);
  }

  const devices = await listConnectedDevices(adbPath, logger);
  if (devices.length === 0) {
    logger.warn('No Android devices connected.');
    logger.info('Connect a USB-debugging device or boot an emulator, then retry.');
    return;
  }

  const targets = resolveTargetDevices(devices, deployOptions?.device);
  for (const device of targets) {
    await deployToDevice(adbPath, device, apkPath, config, logger, deployOptions);
  }

  logger.info('✅ Android deployment complete');
};

const plugin = {
  name: 'deploy-android',
  requirements: ['adb'],
  plan: () => [
    'Resolve adb through the shared Android toolchain',
    'Optionally boot emulator and wait for device',
    'Find built APK',
    'Install APK on selected Android device(s)'
  ],
  validate: async ({ cwd }: PipelineContext) => {
    const preflight = inspectAndroidPreflight({ cwd, intent: 'deploy' });
    if (!preflight.ok || !preflight.toolchain.adb?.path) {
      throw new Error(preflight.blockers[0]?.message || 'ADB could not be resolved.');
    }
    const apkPath = path.join(cwd, 'android/app/build/outputs/apk/debug/app-debug.apk');
    if (!fs.existsSync(apkPath)) throw new Error('APK not found. Run "deploid build" first.');
  },
  run: runDeployAndroid
};

const deployAndroid = (): PipelineStep => runDeployAndroid;

async function listConnectedDevices(adbPath: string, logger?: any): Promise<string[]> {
  const { stdout } = await execa(adbPath, ['devices'], { stdio: 'pipe' });
  const devices = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices'))
    .map((line) => {
      const [id, state] = line.split('\t');
      return state === 'device' ? id : '';
    })
    .filter(Boolean);
  logger?.info(`Found ${devices.length} connected device(s): ${devices.join(', ')}`);
  return devices;
}

function resolveTargetDevices(devices: string[], requestedDevice?: string): string[] {
  if (!requestedDevice) return devices;
  if (!devices.includes(requestedDevice)) {
    throw new Error(`Requested device "${requestedDevice}" is not connected. Available devices: ${devices.join(', ')}`);
  }
  return [requestedDevice];
}

async function bootEmulator(avdName: string, adbPath: string, logger: any): Promise<void> {
  logger.info(`Booting emulator: ${avdName}`);
  const emulatorPath = resolveSiblingTool(adbPath, 'emulator');
  const subprocess = execa(emulatorPath, ['-avd', avdName], { detached: true, stdio: 'ignore' });
  subprocess.unref?.();

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const devices = await listConnectedDevices(adbPath).catch(() => []);
    const emulatorId = devices.find((device) => device.startsWith('emulator-'));
    if (emulatorId) {
      logger.info(`Emulator ready: ${emulatorId}`);
      return;
    }
    await delay(2000);
  }
  throw new Error(`Timed out waiting for emulator "${avdName}" to boot.`);
}

function resolveSiblingTool(adbPath: string, command: string): string {
  const sdkRoot = path.dirname(path.dirname(adbPath));
  const executable = process.platform === 'win32' ? `${command}.exe` : command;
  const candidate = path.join(sdkRoot, 'emulator', executable);
  return fs.existsSync(candidate) ? candidate : command;
}

async function deployToDevice(
  adbPath: string,
  deviceId: string,
  apkPath: string,
  config: any,
  logger: any,
  options?: DeployOptions
): Promise<void> {
  try {
    logger.info(`Deploying to device: ${deviceId}`);
    await execa(adbPath, ['-s', deviceId, 'install', '-r', apkPath], { stdio: 'pipe' });
    logger.info(`✅ Successfully deployed to ${deviceId}`);
    if (options?.launch) await launchApp(adbPath, deviceId, config, logger, options);
  } catch (error: unknown) {
    const text = getErrorText(error);
    if (text.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE') && options?.force) {
      logger.warn(`Signature mismatch on ${deviceId}; uninstalling because --force was provided.`);
      await execa(adbPath, ['-s', deviceId, 'uninstall', config.appId], { stdio: 'pipe' });
      await execa(adbPath, ['-s', deviceId, 'install', apkPath], { stdio: 'pipe' });
      if (options.launch) await launchApp(adbPath, deviceId, config, logger, options);
      return;
    }
    throw error;
  }
}

async function launchApp(adbPath: string, deviceId: string, config: any, logger: any, options: DeployOptions): Promise<void> {
  await execa(adbPath, ['-s', deviceId, 'shell', 'am', 'start', '-n', `${config.appId}/.MainActivity`], { stdio: 'pipe' });
  logger.info(`🚀 Launched ${config.appName} on ${deviceId}`);
  if (options.logs) await tailLogs(adbPath, deviceId, config, options.logFilter);
}

async function tailLogs(adbPath: string, deviceId: string, config: any, filter?: string): Promise<void> {
  const effectiveFilter = filter || config.appId || config.appName;
  await execa(adbPath, ['-s', deviceId, 'logcat', '-c'], { stdio: 'pipe' });
  await execa(adbPath, ['-s', deviceId, 'logcat', `${effectiveFilter}:V`, '*:S'], { stdio: 'inherit' });
}

function getErrorText(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const value = error as { shortMessage?: string; stderr?: string; stdout?: string; message?: string };
  return [value.shortMessage, value.stderr, value.stdout, value.message].filter(Boolean).join('\n');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default plugin;
export { deployAndroid, plugin };
