// PipelineStep type definition
interface PipelineStep {
  (context: { logger: any; config: any; cwd: string }): Promise<void>;
}
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';

const runDeployAndroid: PipelineStep = async ({ logger, config, cwd }: any) => {
  logger.info(`deploy-android: deploying ${config.appName} to connected devices`);
  
  try {
    // Check if ADB is available
    await checkAdbInstalled(logger);
    
    // Find the APK file
    const apkPath = path.join(cwd, 'android/app/build/outputs/apk/debug/app-debug.apk');
    
    if (!fs.existsSync(apkPath)) {
      logger.error('APK not found. Run "deploid build" first.');
      throw new Error('APK not found');
    }
    
    logger.info(`APK found: ${apkPath}`);
    
    // List connected devices
    const devices = await listConnectedDevices(logger);
    
    if (devices.length === 0) {
      logger.warn('No Android devices connected.');
      logger.info('To connect a device:');
      logger.info('  1. Connect via USB and enable USB debugging');
      logger.info('  2. Or enable ADB over WiFi: adb tcpip 5555 && adb connect <device-ip>');
      return;
    }
    
    // Deploy to all connected devices
    for (const device of devices) {
      await deployToDevice(device, apkPath, config, logger);
    }
    
    logger.info('✅ Android deployment complete');
  } catch (error) {
    logger.error(`Android deployment failed: ${error}`);
    throw error;
  }
};

const plugin = {
  name: 'deploy-android',
  requirements: ['adb'],
  plan: () => ['Verify adb availability', 'Find built APK', 'Install APK on connected devices'],
  validate: async ({ cwd }: any) => {
    await assertCommand('adb', ['version']);
    const apkPath = path.join(cwd, 'android/app/build/outputs/apk/debug/app-debug.apk');
    if (!fs.existsSync(apkPath)) {
      throw new Error('APK not found. Run "deploid build" first.');
    }
  },
  run: runDeployAndroid
};

const deployAndroid = (): PipelineStep => runDeployAndroid;

async function assertCommand(command: string, args: string[]): Promise<void> {
  try {
    await execa(command, args, { stdio: 'pipe' });
  } catch {
    throw new Error(`Required command not found: ${command}`);
  }
}

async function checkAdbInstalled(logger: any): Promise<void> {
  try {
    await execa('adb', ['version'], { stdio: 'pipe' });
    logger.debug('ADB found');
  } catch (error) {
    logger.error('ADB not found. Please install Android SDK Platform Tools.');
    logger.info('Install instructions:');
    logger.info('  - Arch: sudo pacman -S android-tools');
    logger.info('  - Ubuntu: sudo apt install android-tools-adb');
    logger.info('  - macOS: brew install android-platform-tools');
    throw error;
  }
}

async function listConnectedDevices(logger: any): Promise<string[]> {
  try {
    const { stdout } = await execa('adb', ['devices'], { stdio: 'pipe' });
    const lines = stdout.split('\n').filter((line: string) => line.trim() && !line.includes('List of devices'));
    const devices = lines.map((line: string) => line.split('\t')[0]).filter((id: string) => id);
    
    logger.info(`Found ${devices.length} connected device(s): ${devices.join(', ')}`);
    return devices;
  } catch (error) {
    logger.error('Failed to list devices');
    throw error;
  }
}

async function deployToDevice(deviceId: string, apkPath: string, config: any, logger: any): Promise<void> {
  try {
    logger.info(`Deploying to device: ${deviceId}`);
    
    // Install the APK
    await execa('adb', ['-s', deviceId, 'install', '-r', apkPath], { stdio: 'inherit' });
    logger.info(`✅ Successfully deployed to ${deviceId}`);
    
    // Launch the app
    try {
      await execa('adb', ['-s', deviceId, 'shell', 'am', 'start', '-n', `${config.appId}/.MainActivity`], { stdio: 'pipe' });
      logger.info(`🚀 Launched ${config.appName} on ${deviceId}`);
    } catch (error) {
      logger.warn(`Could not launch app on ${deviceId}: ${error}`);
    }
    
  } catch (error) {
    logger.error(`Failed to deploy to ${deviceId}: ${error}`);
    throw error;
  }
}

export default plugin;
export { deployAndroid, plugin };
