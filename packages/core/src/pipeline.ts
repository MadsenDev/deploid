import { Logger, logger } from './logger.js';
import { ShipwrightConfig } from './types.js';

export type PipelineContext = { cwd: string; config: ShipwrightConfig; logger: Logger };
export type PipelineStep = (ctx: PipelineContext) => Promise<void>;

export async function runPipeline(ctx: PipelineContext, steps: PipelineStep[]): Promise<void> {
  for (const step of steps) {
    await step(ctx);
  }
}

export function createContext(cwd: string, config: ShipwrightConfig): PipelineContext {
  return { cwd, config, logger };
}


