import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let activeProcess: ChildProcessWithoutNullStreams | null = null;

const ALLOWED_COMMANDS = new Set([
  'init',
  'assets',
  'package',
  'build',
  'deploy',
  'devices',
  'logs',
  'uninstall',
  'debug',
  'ios',
  'ios:handbook',
  'firebase',
  'plugin'
]);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'));
}

function sendLog(kind: 'stdout' | 'stderr' | 'system', message: string): void {
  if (!mainWindow) return;
  mainWindow.webContents.send('studio:log', { kind, message });
}

function resolveCliEntrypoint(): string {
  return require.resolve('@deploid/cli/dist/index.js');
}

function parseCommand(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

ipcMain.handle('studio:choose-project', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('studio:run-command', async (_event, payload: { cwd: string; command: string }) => {
  if (activeProcess) {
    throw new Error('A command is already running');
  }
  if (!payload.cwd) {
    throw new Error('Project folder is required');
  }

  const args = parseCommand(payload.command);
  if (args.length === 0) {
    throw new Error('Command is required');
  }
  if (!ALLOWED_COMMANDS.has(args[0])) {
    throw new Error(`Unsupported command: ${args[0]}`);
  }

  const cliEntrypoint = resolveCliEntrypoint();
  sendLog('system', `$ deploid ${args.join(' ')}\n`);

  activeProcess = spawn(process.execPath, [cliEntrypoint, ...args], {
    cwd: payload.cwd,
    env: process.env
  });

  mainWindow?.webContents.send('studio:state', { running: true });

  activeProcess.stdout.on('data', (chunk) => {
    sendLog('stdout', String(chunk));
  });
  activeProcess.stderr.on('data', (chunk) => {
    sendLog('stderr', String(chunk));
  });

  return await new Promise<{ code: number | null }>((resolve) => {
    activeProcess?.on('close', (code) => {
      sendLog('system', `\nProcess exited with code ${String(code)}\n`);
      activeProcess = null;
      mainWindow?.webContents.send('studio:state', { running: false });
      resolve({ code });
    });
  });
});

ipcMain.handle('studio:stop-command', async () => {
  if (!activeProcess) {
    return { stopped: false };
  }
  activeProcess.kill('SIGINT');
  return { stopped: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
