import type { Command } from 'commander';
import { formatAndroidPreflightFailure, inspectAndroidPreflight, loadConfig, runPluginCommand } from '#core';
import { join } from 'node:path';

function resolveAdbPath(cwd: string): string {
  const result = inspectAndroidPreflight({ cwd, intent: 'deploy' });
  if (!result.ok || !result.toolchain.adb) {
    console.error('❌ ' + formatAndroidPreflightFailure(result).join('\n'));
    process.exit(1);
  }
  return result.toolchain.adb.path;
}

export function registerAndroidCommands(program: Command): void {
  program
    .command('deploy')
    .description('Deploy APK to connected Android devices')
    .option('-f, --force', 'Force install (overwrite existing app)')
    .option('-l, --launch', 'Launch app after installation')
    .option('-d, --device <id>', 'Deploy to a specific connected device/emulator')
    .option('--boot-emulator <avd>', 'Boot an Android emulator before deploying')
    .option('--logs', 'Tail app logs after launch')
    .option('--log-filter <tag>', 'Logcat filter/tag to use with --logs')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      const cwd = process.cwd();
      const config = await loadConfig();
      await runPluginCommand('deploy-android', {
        cwd,
        config,
        debug: options.debug,
        contextExtras: {
          deployOptions: {
            force: Boolean(options.force),
            launch: Boolean(options.launch),
            device: options.device,
            bootEmulator: options.bootEmulator,
            logs: Boolean(options.logs),
            logFilter: options.logFilter
          }
        }
      });
    });

  program
    .command('devices')
    .description('List connected Android devices')
    .option('--json', 'Output machine-readable JSON')
    .option('--boot <avd>', 'Boot an emulator before listing devices')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      const cwd = process.cwd();
      const { execa } = await import('execa');
      const adbPath = resolveAdbPath(cwd);
      const preflight = inspectAndroidPreflight({ cwd, intent: 'deploy' });
      try {
        if (options.boot) {
          const sdkRoot = preflight.toolchain.androidSdk?.root;
          const emulatorPath = sdkRoot
            ? join(sdkRoot, 'emulator', process.platform === 'win32' ? 'emulator.exe' : 'emulator')
            : 'emulator';
          execa(emulatorPath, ['-avd', options.boot], { detached: true, stdio: 'ignore' }).catch(() => undefined);
        }

        const { stdout } = await execa(adbPath, ['devices'], { stdio: 'pipe' });
        if (options.json) {
          const devices = stdout
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('List of devices'))
            .map((line) => {
              const [id, state] = line.split('\t');
              return { id, state };
            });
          console.log(JSON.stringify({ devices }, null, 2));
          return;
        }
        console.log(stdout);
      } catch {
        console.error(`❌ Failed to list Android devices using ${adbPath}.`);
        process.exitCode = 1;
      }
    });

  program
    .command('logs')
    .description('View app logs from connected device')
    .option('-d, --device <id>', 'Read logs from a specific device/emulator')
    .option('--app-only', 'Filter logcat output to the current app id/tag')
    .option('--filter <tag>', 'Explicit logcat tag/filter to stream')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      const cwd = process.cwd();
      const { loadConfigOptional } = await import('@deploid/core');
      const config = await loadConfigOptional(cwd);
      const { execa } = await import('execa');
      const adbPath = resolveAdbPath(cwd);
      try {
        const prefix = options.device ? ['-s', options.device] : [];
        const filter = options.filter || (options.appOnly ? config.appId : '');
        await execa(adbPath, [...prefix, 'logcat', '-c']);
        console.log(filter
          ? `Showing device logs with filter "${filter}"...`
          : 'Showing all device logs (use --filter <tag> or --app-only to narrow output)...');
        await execa(adbPath, [...prefix, 'logcat', ...(filter ? [`${filter}:V`, '*:S'] : [])], { stdio: 'inherit' });
      } catch {
        console.error(`❌ Failed to view logs using ${adbPath}. Make sure a device is connected.`);
        process.exitCode = 1;
      }
    });

  program
    .command('uninstall')
    .description('Uninstall app from connected devices')
    .option('-d, --device <id>', 'Uninstall from a specific device/emulator')
    .option('--app-id <id>', 'Override the app ID to uninstall (bypasses config lookup)')
    .option('--debug', 'Enable debug logging')
    .action(async (options) => {
      const cwd = process.cwd();
      const { loadConfigOptional } = await import('@deploid/core');
      const config = await loadConfigOptional(cwd);
      const appId = options.appId || config.appId;
      if (!appId || appId === 'dev.deploid.placeholder') {
        console.error('❌ Could not determine app ID. Run from a Deploid project directory or pass --app-id <id>.');
        process.exit(1);
      }

      const { execa } = await import('execa');
      const adbPath = resolveAdbPath(cwd);
      try {
        const prefix = options.device ? ['-s', options.device] : [];
        await execa(adbPath, [...prefix, 'uninstall', appId], { stdio: 'inherit' });
        console.log(`✅ Uninstalled ${config.appName ?? appId}${options.device ? ` from ${options.device}` : ''}`);
      } catch {
        console.error(`❌ Failed to uninstall ${appId} using ${adbPath}.`);
        process.exitCode = 1;
      }
    });
}
