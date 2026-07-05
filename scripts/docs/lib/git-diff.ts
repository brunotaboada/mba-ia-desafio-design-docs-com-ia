import { execSync } from 'node:child_process';
import { ROOT } from './meta.js';

export function getChangedFiles(fromCommit: string, toCommit = 'HEAD'): string[] {
  const out = execSync(`git diff --name-only ${fromCommit}..${toCommit}`, {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();

  if (!out) return [];
  return out.split('\n').filter(Boolean);
}

export function getDiff(fromCommit: string, toCommit = 'HEAD'): string {
  return execSync(`git diff ${fromCommit}..${toCommit}`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
}
