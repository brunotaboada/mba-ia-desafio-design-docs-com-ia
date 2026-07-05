import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './meta.js';

export interface TrackerRow {
  id: string;
  documento: string;
  tipo: string;
  conteudo: string;
  fonte: 'TRANSCRICAO' | 'CODIGO';
  localizacao: string;
}

export function parseTracker(path = join(ROOT, 'docs/TRACKER.md')): TrackerRow[] {
  const lines = readFileSync(path, 'utf8').split('\n');
  const rows: TrackerRow[] = [];

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('ID |')) continue;
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length < 6) continue;

    const [id, documento, tipo, conteudo, fonte, localizacao] = cols;
    if (fonte !== 'TRANSCRICAO' && fonte !== 'CODIGO') continue;

    rows.push({
      id,
      documento,
      tipo,
      conteudo,
      fonte,
      localizacao,
    });
  }

  return rows;
}

export function mapChangedFilesToDocuments(
  changedFiles: string[],
  rows: TrackerRow[],
): Map<string, TrackerRow[]> {
  const result = new Map<string, TrackerRow[]>();

  for (const file of changedFiles) {
    const normalized = file.replace(/^\.\//, '');
    const matches = rows.filter(
      (row) =>
        row.fonte === 'CODIGO' &&
        (row.localizacao === normalized ||
          row.localizacao.startsWith(`${normalized}:`) ||
          normalized.startsWith(row.localizacao.replace(/:\d+$/, ''))),
    );

    for (const row of matches) {
      const doc = row.documento;
      const existing = result.get(doc) ?? [];
      if (!existing.some((r) => r.id === row.id)) {
        existing.push(row);
        result.set(doc, existing);
      }
    }
  }

  return result;
}
