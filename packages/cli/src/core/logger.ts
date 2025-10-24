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
}

export const logger = new Logger(process.env.SHIPWRIGHT_LOG_LEVEL as LogLevel || 'info');


