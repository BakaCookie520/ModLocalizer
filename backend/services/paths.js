import fs from 'fs-extra';
import path from 'path';

const isPkg = typeof process.pkg !== 'undefined';
const runtimeRoot = isPkg ? path.dirname(process.execPath) : path.join(process.cwd());

export const DATA_DIR = path.join(runtimeRoot, 'data');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
export const TEMP_DIR = path.join(DATA_DIR, 'temp');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

export function ensureRuntimeDirsSync() {
  fs.ensureDirSync(DATA_DIR);
  fs.ensureDirSync(TEMP_DIR);
  fs.ensureDirSync(UPLOADS_DIR);
}
