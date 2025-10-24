import { Logger, logger } from './logger.js';
import { ShipwrightConfig } from './types.js';

export type PipelineContext = { cwd: string; config: ShipwrightConfig; logger: Logger; debug?: boolean };
export type PipelineStep = (ctx: PipelineContext) => Promise<void>;

export async function runPipeline(ctx: PipelineContext, steps: PipelineStep[]): Promise<void> {
  if (ctx.debug) {
    ctx.logger.debugEnv();
    ctx.logger.debug(`Starting pipeline with ${steps.length} steps`);
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (ctx.debug) {
      ctx.logger.debugStep(`Executing step ${i + 1}/${steps.length}`);
    }
    
    try {
      await step(ctx);
      if (ctx.debug) {
        ctx.logger.debug(`✅ Step ${i + 1} completed successfully`);
      }
    } catch (error) {
      if (ctx.debug) {
        ctx.logger.debug(`❌ Step ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        ctx.logger.debug(`   Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      }
      throw error;
    }
  }

  if (ctx.debug) {
    ctx.logger.debug('🎉 Pipeline completed successfully');
  }
}

export function createContext(cwd: string, config: ShipwrightConfig, debug = false): PipelineContext {
  const contextLogger = debug ? new Logger('debug') : logger;
  return { cwd, config, logger: contextLogger, debug };
}


