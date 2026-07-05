import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readMeta, getHeadCommit, ROOT } from './lib/meta.js';
import { getChangedFiles, getDiff } from './lib/git-diff.js';
import { mapChangedFilesToDocuments, parseTracker } from './lib/tracker.js';
import { updateDocument, writeDocument } from './lib/ai-update.js';
import { generateSite } from './generate-site.js';

function normalizeDocPath(path: string): string {
  return path.replace(/^\.\//, '');
}

export async function updateDocs(): Promise<void> {
  console.log('=== docs:update ===\n');

  const meta = readMeta();
  const sourceCommit = meta.source_commit;
  const head = getHeadCommit();

  console.log(`1. Âncora (source_commit): ${sourceCommit}`);
  console.log(`   HEAD atual:             ${head}`);

  if (sourceCommit === head) {
    console.log('\nNenhuma mudança desde a última geração. Regenerando HTML apenas.');
    generateSite(head);
    return;
  }

  const changedFiles = getChangedFiles(sourceCommit, head);
  const diff = getDiff(sourceCommit, head);

  console.log(`\n2. Arquivos alterados (${changedFiles.length}):`);
  for (const f of changedFiles) console.log(`   - ${f}`);

  if (changedFiles.length === 0) {
    console.log('\nDiff vazio; regenerando site e re-ancorando.');
    generateSite(head);
    return;
  }

  const trackerRows = parseTracker();
  const affected = mapChangedFilesToDocuments(changedFiles, trackerRows);

  console.log(`\n3. Documentos afetados via Tracker (Fonte=CODIGO): ${affected.size}`);
  for (const [doc, rows] of affected) {
    console.log(`   - ${doc} (${rows.map((r) => r.id).join(', ')})`);
  }

  const docsToUpdate = new Set<string>([...affected.keys()]);
  if (changedFiles.some((f) => f.includes('order.status.ts'))) {
    docsToUpdate.add('docs/FDD.md');
    docsToUpdate.add('docs/adrs/ADR-007-payload-snapshot-na-insercao.md');
    docsToUpdate.add('docs/TRACKER.md');
  }

  console.log(`\n4. Atualizando ${docsToUpdate.size} documento(s) com IA/determinístico...`);

  for (const doc of docsToUpdate) {
    const docPath = normalizeDocPath(doc);
    const full = join(ROOT, docPath);
    const content = readFileSync(full, 'utf8');
    const rows = affected.get(doc) ?? trackerRows.filter((r) => r.documento === doc);

    console.log(`\n→ ${docPath}`);
    const updated = await updateDocument({
      docPath,
      content,
      diff,
      trackerRows: rows,
      changedFiles,
    });

    if (updated !== content) {
      writeDocument(docPath, updated);
      console.log('  ✓ atualizado');
    } else {
      console.log('  · sem alterações');
    }
  }

  console.log('\n5. Regenerando HTML e re-ancorando...');
  const newCommit = generateSite(head);
  console.log(`\n✓ Concluído. Novo source_commit: ${newCommit}`);
}

updateDocs().catch((err) => {
  console.error(err);
  process.exit(1);
});
