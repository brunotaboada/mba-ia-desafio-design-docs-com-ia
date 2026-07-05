import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SITE_DIR = join(ROOT, 'docs/site');
export const META_PATH = join(SITE_DIR, 'docs-meta.json');

export const DOCUMENT_PATHS = [
  'docs/PRD.md',
  'docs/RFC.md',
  'docs/FDD.md',
  'docs/adrs/',
  'docs/TRACKER.md',
] as const;

export interface DocsMeta {
  source_commit: string;
  generated_at: string;
  documents: string[];
}

export function getHeadCommit(): string {
  return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
}

export function readMeta(): DocsMeta {
  const raw = readFileSync(META_PATH, 'utf8');
  return JSON.parse(raw) as DocsMeta;
}

export function writeMeta(meta: DocsMeta): void {
  mkdirSync(dirname(META_PATH), { recursive: true });
  writeFileSync(META_PATH, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export { ROOT };
