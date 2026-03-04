export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private level: LogLevel = 'info') {}

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return order.indexOf(level) >= order.indexOf(this.level);
  }

  debug(message: string) { if (this.shouldLog('debug')) console.log(`[debug] ${message}`); }
  info(message: string) { if (this.shouldLog('info')) console.log(`[info] ${message}`); }
  warn(message: string) { if (this.shouldLog('warn')) console.warn(`[warn] ${message}`); }
  error(message: string) { if (this.shouldLog('error')) console.error(`[error] ${message}`); }

  debugStep(step: string, details?: unknown) {
    if (this.shouldLog('debug')) {
      console.log(`[debug] STEP ${step}`);
      if (details !== undefined) {
        console.log(`[debug] details=${JSON.stringify(details, null, 2)}`);
      }
    }
  }

  debugCommand(command: string, args: string[], cwd?: string) {
    if (this.shouldLog('debug')) {
      const location = cwd ? ` (cwd=${cwd})` : '';
      console.log(`[debug] CMD ${command} ${args.join(' ')}${location}`);
    }
  }

  debugEnv() {
    if (this.shouldLog('debug')) {
      console.log(`[debug] env node=${process.version} platform=${process.platform} arch=${process.arch}`);
      console.log(`[debug] env cwd=${process.cwd()}`);
    }
  }
}

export const logger = new Logger((process.env.DEPLOID_LOG_LEVEL as LogLevel) || 'info');

