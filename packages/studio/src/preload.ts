import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('deploidStudio', {
  chooseProject: () => ipcRenderer.invoke('studio:choose-project') as Promise<string | null>,
  runCommand: (cwd: string, command: string) =>
    ipcRenderer.invoke('studio:run-command', { cwd, command }) as Promise<{ code: number | null }>,
  stopCommand: () => ipcRenderer.invoke('studio:stop-command') as Promise<{ stopped: boolean }>,
  onLog: (cb: (entry: { kind: 'stdout' | 'stderr' | 'system'; message: string }) => void) =>
    ipcRenderer.on('studio:log', (_event, payload) => cb(payload)),
  onState: (cb: (state: { running: boolean }) => void) =>
    ipcRenderer.on('studio:state', (_event, payload) => cb(payload))
});
