#!/usr/bin/env node
import { Command } from 'commander';
import { createContext, loadConfig, runPipeline, loadPlugin } from './core/index.js';

const program = new Command();
program
  .name('deploid')
  .description('Build -> package -> sign -> publish web apps to Android')
  .version('0.1.0');

program
  .command('init')
  .description('Setup config and base folders')
  .option('-f, --framework <framework>', 'Web framework (vite|next|cra|static)', 'vite')
  .option('-p, --packaging <engine>', 'Android packaging engine (capacitor|tauri|twa)', 'capacitor')
  .action(async (options) => {
    const { initProject } = await import('./init.js');
    await initProject(options);
  });

program
  .command('assets')
  .description('Generate icons and screenshots')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const assetsStep = await loadPlugin('assets', config);
    await runPipeline(ctx, [assetsStep]);
  });

program
  .command('package')
  .description('Wrap app for Android (Capacitor/Tauri/TWA)')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const packagingStep = await loadPlugin(`packaging-${config.android.packaging}`, config);
    await runPipeline(ctx, [packagingStep]);
  });

program
  .command('build')
  .description('Build APK/AAB')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const buildStep = await loadPlugin('build-android', config);
    await runPipeline(ctx, [buildStep]);
  });

program
  .command('debug')
  .description('Add network debugging tools to your project')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const debugStep = await loadPlugin('debug-network', config);
    await runPipeline(ctx, [debugStep]);
  });

program
  .command('deploy')
  .description('Deploy APK to connected Android devices')
  .option('-f, --force', 'Force install (overwrite existing app)')
  .option('-l, --launch', 'Launch app after installation')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const deployStep = await loadPlugin('deploy-android', config);
    await runPipeline(ctx, [deployStep]);
  });

program
  .command('devices')
  .description('List connected Android devices')
  .action(async () => {
    const { execa } = await import('execa');
    try {
      const { stdout } = await execa('adb', ['devices'], { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ ADB not found. Please install Android SDK Platform Tools.');
      console.log('Install: sudo pacman -S android-tools');
    }
  });

program
  .command('logs')
  .description('View app logs from connected device')
  .action(async () => {
    const config = await loadConfig();
    const { execa } = await import('execa');
    try {
      await execa('adb', ['logcat', '-c']); // Clear logs
      await execa('adb', ['logcat', '|', 'grep', '-i', config.appName], { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to view logs:', error);
    }
  });

program
  .command('uninstall')
  .description('Uninstall app from connected devices')
  .action(async () => {
    const config = await loadConfig();
    const { execa } = await import('execa');
    try {
      await execa('adb', ['uninstall', config.appId], { stdio: 'inherit' });
      console.log(`✅ Uninstalled ${config.appName} from device`);
    } catch (error) {
      console.error('❌ Failed to uninstall:', error);
    }
  });

program
  .command('ios')
  .description('Prepare iOS project for Mac handoff')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const iosStep = await loadPlugin('prepare-ios', config);
    await runPipeline(ctx, [iosStep]);
  });

program
  .command('ios:assets')
  .description('Generate iOS app icons and launch screens')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    // This would integrate with the assets plugin for iOS-specific generation
    console.log('📱 iOS assets generation - coming soon!');
    console.log('For now, add your app icons to: ios/App/App/Assets.xcassets/AppIcon.appiconset/');
  });

program
  .command('ios:handbook')
  .description('Generate iOS handoff documentation')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    const iosStep = await loadPlugin('prepare-ios', config);
    await runPipeline(ctx, [iosStep]);
  });

program
  .command('firebase')
  .description('Setup Firebase for push notifications')
  .option('--project-id <id>', 'Firebase project ID')
  .option('--auto-create', 'Auto-create Firebase project')
  .action(async (options) => {
    const { setupFirebase } = await import('./firebase.js');
    await setupFirebase(options);
  });

program
  .command('publish')
  .description('Upload to Play Store or GitHub')
  .action(async () => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config);
    await runPipeline(ctx, [async ({ logger }) => logger.info('publish: stub')]);
  });

program.parseAsync();


