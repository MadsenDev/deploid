import { Logger, logger } from './logger.js';
import { DeploidConfig } from './types.js';

export type PipelineContext = { cwd: string; config: DeploidConfig; logger: Logger; debug?: boolean };
export type PipelineStep = (ctx: PipelineContext) => Promise<void>;

export async function runPipeline(ctx: PipelineContext, steps: PipelineStep[]): Promise<void> {
  if (ctx.debug) {
    ctx.logger.debugEnv();
    ctx.logger.debug(`starting pipeline (${steps.length} steps)`);
  }

  for (let i = 0; i < steps.length; i++) {
    if (ctx.debug) {
      ctx.logger.debugStep(`${i + 1}/${steps.length}`);
    }
    await steps[i](ctx);
  }
}

export function createContext(cwd: string, config: DeploidConfig, debug = false): PipelineContext {
  const contextLogger = debug ? new Logger('debug') : logger;
  return { cwd, config, logger: contextLogger, debug };
}

