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

export function registerAndroidBuildCommands(program: Command): void {
  program
    .command('package')
    .description('Wrap app for Android (Capacitor/Tauri/TWA)')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
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
    });

  program
    .command('build')
    .description('Build APK/AAB')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      checkAndroidToolchain('build');
      const config = await loadConfig();
      const cwd = process.cwd();
      const syncedWebDir = join(cwd, 'android', 'app', 'src', 'main', 'assets', 'public');

      if (!existsSync(syncedWebDir) || readdirSync(syncedWebDir).length === 0) {
        console.error('❌ Web assets have not been synced into the Android project.');
        console.error('  Run `deploid package` first, then re-run `deploid build`.');
        process.exit(1);
      }

      await runPluginCommand('build-android', {
        cwd,
        config,
        debug: options.debug
      });
    });
}
