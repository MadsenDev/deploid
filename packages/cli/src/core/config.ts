import { ShipwrightConfig } from './types.js';
import fs from 'node:fs';
import path from 'node:path';

export async function loadConfig(cwd: string = process.cwd()): Promise<ShipwrightConfig> {
  const candidates = [
    'deploid.config.ts',
    'deploid.config.js',
    'deploid.config.mjs',
    'deploid.config.cjs'
  ];
  for (const filename of candidates) {
    const full = path.join(cwd, filename);
    if (fs.existsSync(full)) {
      const mod = await import(pathToFileURL(full).href);
      const cfg = (mod.default || mod) as ShipwrightConfig;
      return cfg;
    }
  }
  throw new Error('No deploid config found');
}

function pathToFileURL(p: string): URL {
  const resolved = path.resolve(p);
  const url = new URL('file://');
  url.pathname = resolved;
  return url;
}


