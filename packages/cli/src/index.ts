#!/usr/bin/env node
import { Command } from 'commander';
import { createContext, loadConfig, runPipeline, loadPlugin, runPluginCommand, runDoctorCommand } from '#core';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAndroidCommands } from './android-commands.js';
import { registerAndroidBuildCommands } from './android-build-commands.js';

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
  .option('-f, --framework <framework>', 'Web framework — auto-detected if omitted (vite|next|cra|static)')
  .option('-p, --packaging <engine>', 'Android packaging engine (capacitor|tauri|twa)', 'capacitor')
  .option('--app-name <name>', 'App display name')
  .option('--app-id <id>', 'App ID / package ID (reverse-domain)')
  .option('--description <text>', 'Project description')
  .option('--author-name <name>', 'Author name')
  .option('--author-email <email>', 'Author email')
  .option('--assets-source <path>', 'Asset source path to store in config')
  .option('--firebase', 'Set up Firebase push notifications during init')
  .option('-y, --yes', 'Accept all defaults without prompting (CI-friendly)')
  .option('--force', 'Overwrite existing deploid.config.ts')
  .option('--all-plugins', 'Install all optional app integrations without prompts')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { initProject } = await import('./init.js');
    await initProject(options);
  });

program
  .command('doctor')
  .description('Audit project, workflow, release, and tooling readiness')
  .option('--json', 'Output machine-readable JSON')
  .option('--markdown', 'Output a markdown report')
  .option('--ci', 'Output concise CI-friendly key=value lines')
  .option('--summary', 'Show only workflow summary and non-passing checks')
  .option('--verbose', 'Include passing checks and extra details')
  .option('--project-only', 'Skip environment/toolchain checks and inspect project files only')
  .option('--fix', 'Apply safe automatic fixes before re-running checks')
  .option('--java-home <path>', 'Use this JDK for this command only')
  .option('--android-sdk <path>', 'Use this Android SDK for this command only')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    await runDoctorCommand({
      cwd: process.cwd(),
      debug: options.debug,
      toolchainOverrides: {
        javaHome: options.javaHome,
        androidSdk: options.androidSdk
      },
      doctorOptions: {
      json: Boolean(options.json),
      markdown: Boolean(options.markdown),
      ci: Boolean(options.ci),
      summary: Boolean(options.summary),
      verbose: Boolean(options.verbose),
      projectOnly: Boolean(options.projectOnly),
      fix: Boolean(options.fix)
      }
    });
  });

program
  .command('daemon')
  .description('Run a local Deploid HTTP daemon for external apps')
  .option('--host <host>', 'Host interface to bind', '127.0.0.1')
  .option('--port <number>', 'Port to bind', (value) => Number.parseInt(value, 10), 4949)
  .option('--token <token>', 'Optional bearer token required for requests')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const { startDaemon } = await import('./daemon.js');
    await startDaemon({
      host: options.host,
      port: options.port,
      token: options.token,
      debug: options.debug
    });
  });

program
  .command('assets')
  .description('Generate icons and screenshots')
  .option('--source <path>', 'Override assets source for this run (e.g., public/logo.png)')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    const effectiveConfig = options.source
      ? { ...config, assets: { ...(config.assets ?? {}), source: options.source } }
      : config;

    if (options.source) {
      console.log(`Using assets source override: ${options.source}`);
    }

    await runPluginCommand('assets', {
      cwd: process.cwd(),
      config: effectiveConfig,
      debug: options.debug
    });
  });

const artifacts = program
  .command('artifacts')
  .description('Inspect and clean generated artifacts')
  .argument('[action]', 'Artifact action (list|inspect|clean)')
  .option('--list', 'List generated artifacts')
  .option('--inspect', 'Show detailed artifact metadata')
  .option('--clean', 'Remove generated artifacts')
  .option('--kind <kind>', 'Artifact kind (all|android-debug-apk|android-release-apk|android-release-aab|assets|desktop)', 'all')
  .option('--json', 'Emit machine-readable JSON')
  .option('--dry-run', 'Preview artifact cleanup without deleting files')
  .option('--debug', 'Enable debug logging')
  .action(async (action, options) => {
    const actions = [
      typeof action === 'string' && ['list', 'inspect', 'clean'].includes(action) ? action as 'list' | 'inspect' | 'clean' : null,
      options.list ? 'list' : null,
      options.inspect ? 'inspect' : null,
      options.clean ? 'clean' : null
    ].filter(Boolean) as Array<'list' | 'inspect' | 'clean'>;

    if (actions.length === 0) {
      artifacts.outputHelp();
      return;
    }

    if (actions.length > 1) {
      throw new Error('Choose only one of --list, --inspect, or --clean.');
    }

    await runArtifactsCommand(actions[0], options);
  });

registerAndroidBuildCommands(program);

program
  .command('electron')
  .description('Setup Electron desktop packaging for Windows, macOS, and Linux')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    const config = await loadConfig();
    await runPluginCommand('packaging-electron', {
      cwd: process.cwd(),
      config,
      debug: options.debug
    });
  });

program
  .command('version')
  .description('Sync semver, Android version metadata, and release notes scaffolding')
  .argument('[version]', 'Explicit semver version, e.g. 1.2.3')
  .option('--major', 'Bump major version')
  .option('--minor', 'Bump minor version')
  .option('--patch', 'Bump patch version')
  .option('--code <number>', 'Explicit Android versionCode', (value) => Number.parseInt(value, 10))
  .option('--no-sync-package', 'Do not update package.json version')
  .option('--notes-file <path>', 'Release notes scaffold file', 'RELEASE_NOTES.md')
  .option('--dry-run', 'Print the resolved version plan without writing files')
  .option('--json', 'Emit the dry-run plan as JSON')
  .option('--debug', 'Enable debug logging')
  .action(async (version, options) => {
    const config = await loadConfig();
    await runPluginCommand('version', {
      cwd: process.cwd(),
      config,
      debug: options.debug,
      contextExtras: {
        versionOptions: {
          version,
          major: Boolean(options.major),
          minor: Boolean(options.minor),
          patch: Boolean(options.patch),
          code: options.code,
          syncPackage: options.syncPackage,
          notesFile: options.notesFile,
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json)
        }
      }
    });
  });

program
  .command('changelog')
  .description('Create or update CHANGELOG.md entries from release notes and git history')
  .argument('[version]', 'Explicit version to write into the changelog')
  .option('--notes-file <path>', 'Release notes source file', 'RELEASE_NOTES.md')
  .option('--changelog-file <path>', 'Changelog target file', 'CHANGELOG.md')
  .option('--from-git', 'Include commit subjects since the latest git tag')
  .option('--dry-run', 'Print the resolved changelog plan without writing files')
  .option('--json', 'Emit the dry-run plan as JSON')
  .option('--debug', 'Enable debug logging')
  .action(async (version, options) => {
    const config = await loadConfig();
    await runPluginCommand('changelog', {
      cwd: process.cwd(),
      config,
      debug: options.debug,
      contextExtras: {
        changelogOptions: {
          version,
          notesFile: options.notesFile,
          changelogFile: options.changelogFile,
          fromGit: Boolean(options.fromGit),
          dryRun: Boolean(options.dryRun),
          json: Boolean(options.json)
        }
      }
    });
  });

program
  .command('ship')
  .description('Run the end-to-end Android release workflow')
  .argument('[version]', 'Optional version to pass through to `deploid version`')
  .option('--major', 'Bump major version before building')
  .option('--minor', 'Bump minor version before building')
  .option('--patch', 'Bump patch version before building')
  .option('--code <number>', 'Explicit Android versionCode for the version step', (value) => Number.parseInt(value, 10))
  .option('--notes-file <path>', 'Release notes file used by version/changelog/publish', 'RELEASE_NOTES.md')
  .option('--changelog-file <path>', 'Changelog target file', 'CHANGELOG.md')
  .option('--from-git', 'Include commit subjects when generating changelog')
  .option('--target <target>', 'Publish target (github|play|all)', 'all')
  .option('--artifact <path>', 'Artifact path override for publish')
  .option('--release-name <name>', 'GitHub release title override')
  .option('--tag <tag>', 'Git tag to publish or create on GitHub')
  .option('--draft', 'Create or keep the GitHub release as draft')
  .option('--latest', 'Mark the GitHub release as latest')
  .option('--no-doctor', 'Skip readiness checks before shipping')
  .option('--no-assets', 'Skip asset generation')
  .option('--no-package', 'Skip Android packaging')
  .option('--no-build', 'Skip Android build')
  .option('--no-changelog', 'Skip changelog generation')
  .option('--no-publish', 'Skip artifact publishing')
  .option('--debug', 'Enable debug logging')
  .action(async (version, options) => {
    const config = await loadConfig();
    const cwd = process.cwd();
    const ctx = createContext(cwd, config, options.debug);
    const steps = [];

    if (options.doctor) steps.push(await loadPlugin('doctor', config));
    if (options.assets) steps.push(await loadPlugin('assets', config));
    if (options.package) steps.push(await loadPlugin(`packaging-${config.android.packaging}`, config));
    if (options.build) steps.push(await loadPlugin('build-android', config));
    if (options.changelog) steps.push(await loadPlugin('changelog', config));
    if (options.publish) steps.push(await loadPlugin('publish', config));

    Object.assign(ctx as Record<string, unknown>, {
      versionOptions: {
        version,
        major: Boolean(options.major),
        minor: Boolean(options.minor),
        patch: Boolean(options.patch),
        code: options.code,
        notesFile: options.notesFile
      },
      changelogOptions: {
        version,
        notesFile: options.notesFile,
        changelogFile: options.changelogFile,
        fromGit: Boolean(options.fromGit)
      },
      publishOptions: {
        target: options.target,
        artifact: options.artifact,
        releaseName: options.releaseName,
        tag: options.tag,
        draft: Boolean(options.draft),
        latest: Boolean(options.latest)
      }
    });

    await runPipeline(ctx, steps);
  });

registerAndroidCommands(program);

async function runArtifactsCommand(action: 'list' | 'inspect' | 'clean', options: Record<string, unknown>): Promise<void> {
  const config = await loadConfig();
  await runPluginCommand('artifacts', {
    cwd: process.cwd(),
    config,
    debug: Boolean(options.debug),
    contextExtras: {
      artifactsOptions: {
        action,
        kind: options.kind,
        json: Boolean(options.json),
        dryRun: Boolean(options.dryRun)
      }
    }
  });
}

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
