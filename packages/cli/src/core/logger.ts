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

  // Enhanced debug methods
  debugStep(step: string, details?: any) {
    if (this.shouldLog('debug')) {
      console.log(`[debug] 🔧 ${step}`);
      if (details) {
        console.log(`[debug]    Details:`, JSON.stringify(details, null, 2));
      }
    }
  }

  debugCommand(command: string, args: string[], cwd?: string) {
    if (this.shouldLog('debug')) {
      console.log(`[debug] 🚀 Executing: ${command} ${args.join(' ')}`);
      if (cwd) console.log(`[debug]    Working directory: ${cwd}`);
    }
  }

  debugFile(operation: string, filePath: string, exists?: boolean) {
    if (this.shouldLog('debug')) {
      console.log(`[debug] 📁 ${operation}: ${filePath}`);
      if (exists !== undefined) {
        console.log(`[debug]    File exists: ${exists}`);
      }
    }
  }

  debugEnv() {
    if (this.shouldLog('debug')) {
      console.log(`[debug] 🌍 Environment Info:`);
      console.log(`[debug]    Node.js: ${process.version}`);
      console.log(`[debug]    Platform: ${process.platform}`);
      console.log(`[debug]    Architecture: ${process.arch}`);
      console.log(`[debug]    Working Directory: ${process.cwd()}`);
      console.log(`[debug]    NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    }
  }
}

export const logger = new Logger(process.env.SHIPWRIGHT_LOG_LEVEL as LogLevel || 'info');


