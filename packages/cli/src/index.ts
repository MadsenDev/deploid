#!/usr/bin/env node
import { Command } from 'commander';
import { createContext, loadConfig, runPipeline, loadPlugin } from './core/index.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();
program
  .name('deploid')
  .description('Build -> package -> sign -> publish web apps to Android')
  .version(packageJson.version);

program
  .command('init')
  .description('Setup config and base folders')
  .option('-f, --framework <framework>', 'Web framework (vite|next|cra|static)', 'vite')
  .option('-p, --packaging <engine>', 'Android packaging engine (capacitor|tauri|twa)', 'capacitor')
  .option('--all-plugins', 'Install all available plugins without prompts')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { initProject } = await import('./init.js');
    await initProject(options);
  });

program
  .command('assets')
  .description('Generate icons and screenshots')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    const assetsStep = await loadPlugin('assets', config);
    await runPipeline(ctx, [assetsStep]);
  });

program
  .command('package')
  .description('Wrap app for Android (Capacitor/Tauri/TWA)')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    const packagingStep = await loadPlugin(`packaging-${config.android.packaging}`, config);
    await runPipeline(ctx, [packagingStep]);
  });

program
  .command('build')
  .description('Build APK/AAB')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
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
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    const deployStep = await loadPlugin('deploy-android', config);
    await runPipeline(ctx, [deployStep]);
  });

program
  .command('devices')
  .description('List connected Android devices')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
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
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
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
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
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
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    const iosStep = await loadPlugin('prepare-ios', config);
    await runPipeline(ctx, [iosStep]);
  });

program
  .command('ios:assets')
  .description('Generate iOS app icons and launch screens')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    // This would integrate with the assets plugin for iOS-specific generation
    console.log('📱 iOS assets generation - coming soon!');
    console.log('For now, add your app icons to: ios/App/App/Assets.xcassets/AppIcon.appiconset/');
  });

program
  .command('ios:handbook')
  .description('Generate iOS handoff documentation')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    const iosStep = await loadPlugin('prepare-ios', config);
    await runPipeline(ctx, [iosStep]);
  });

program
  .command('firebase')
  .description('Setup Firebase for push notifications')
  .option('--project-id <id>', 'Firebase project ID')
  .option('--auto-create', 'Auto-create Firebase project')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { setupFirebase } = await import('./firebase.js');
    await setupFirebase(options);
  });

program
  .command('plugin')
  .description('Manage Deploid plugins')
  .option('--list', 'List available plugins')
  .option('--install <plugin>', 'Install a specific plugin')
  .option('--remove <plugin>', 'Remove a plugin')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { managePlugins } = await import('./plugin-manager.js');
    await managePlugins(options);
  });

program
  .command('publish')
  .description('Upload to Play Store or GitHub')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const ctx = createContext(process.cwd(), config, options.debug);
    await runPipeline(ctx, [async ({ logger }) => logger.info('publish: stub')]);
  });

program.parseAsync();


