import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const src = join(root, 'renderer');
const dest = join(root, 'dist', 'renderer');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
