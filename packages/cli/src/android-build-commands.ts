import type { Command } from 'commander';
import { formatAndroidPreflightFailure, inspectAndroidPreflight, loadConfig, runPluginCommand } from '#core';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function checkAndroidToolchain(intent: 'package' | 'build'): void {
  const result = inspectAndroidPreflight({ cwd: process.cwd(), intent });
  if (result.ok) return;

  console.error('❌ ' + formatAndroidPreflightFailure(result).join('\n'));
  process.exit(1);
}

async function packageAndroid(options: { debug?: boolean }): Promise<void> {
  checkAndroidToolchain('package');
  const config = await loadConfig();
  if (config.android.packaging !== 'capacitor') {
    throw new Error(`Packaging engine "${config.android.packaging}" is not supported in Deploid 2.0. Use "capacitor".`);
  }

  const cwd = process.cwd();
  const assetsGenDir = join(cwd, config.assets?.output ?? 'assets-gen');
  const assetsAreMissing = !existsSync(assetsGenDir) || readdirSync(assetsGenDir).length === 0;
  if (assetsAreMissing) {
    const logoPath = join(cwd, config.assets?.source ?? 'assets/logo.svg');
    if (existsSync(logoPath)) {
      console.log('  Assets not generated yet — running `deploid assets` first...');
      await runPluginCommand('assets', { cwd, config, debug: options.debug });
    } else {
      console.log(`⚠️  No assets found and no logo at ${config.assets?.source ?? 'assets/logo.svg'}. Skipping asset generation.`);
      console.log('    Add a logo then run: deploid assets');
    }
  }

  await runPluginCommand(`packaging-${config.android.packaging}`, {
    cwd,
    config,
    debug: options.debug
  });
}

async function buildAndroid(options: { debug?: boolean }): Promise<void> {
  console.log('Preparing Android project...');
  await packageAndroid(options);

  checkAndroidToolchain('build');
  const config = await loadConfig();
  const cwd = process.cwd();

  await runPluginCommand('build-android', {
    cwd,
    config,
    debug: options.debug
  });
}

interface RunOptions {
  device?: string;
  bootEmulator?: string;
  force?: boolean;
  logs?: boolean;
  logFilter?: string;
  debug?: boolean;
}

async function runAndroid(options: RunOptions): Promise<void> {
  await buildAndroid(options);

  const config = await loadConfig();
  await runPluginCommand('deploy-android', {
    cwd: process.cwd(),
    config,
    debug: options.debug,
    contextExtras: {
      deployOptions: {
        force: Boolean(options.force),
        launch: true,
        device: options.device,
        bootEmulator: options.bootEmulator,
        logs: Boolean(options.logs),
        logFilter: options.logFilter
      }
    }
  });
}

export function registerAndroidBuildCommands(program: Command): void {
  program
    .command('package')
    .description('Wrap app for Android (Capacitor/Tauri/TWA)')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      await packageAndroid(options);
    });

  program
    .command('build')
    .description('Build web app, sync Android project, then build APK/AAB')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      await buildAndroid(options);
    });

  program
    .command('run')
    .description('Build, install, and launch the app on Android')
    .option('-d, --device <id>', 'Run on a specific connected device/emulator')
    .option('--boot-emulator <avd>', 'Boot an Android emulator before deploying')
    .option('-f, --force', 'Uninstall and reinstall if signatures are incompatible')
    .option('--logs', 'Tail app logs after launch')
    .option('--log-filter <tag>', 'Logcat filter/tag to use with --logs')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      await runAndroid(options);
    });
}
