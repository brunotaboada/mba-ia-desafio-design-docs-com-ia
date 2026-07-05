import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { marked } from 'marked';
import {
  DOCUMENT_PATHS,
  SITE_DIR,
  META_PATH,
  getHeadCommit,
  writeMeta,
  ROOT,
} from './lib/meta.js';

interface NavItem {
  title: string;
  href: string;
  group?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function collectMarkdownFiles(): Array<{ abs: string; rel: string }> {
  const files: Array<{ abs: string; rel: string }> = [];

  for (const entry of DOCUMENT_PATHS) {
    const abs = join(ROOT, entry);
    if (entry.endsWith('/')) {
      for (const name of readdirSync(abs).filter((f) => f.endsWith('.md') && f.startsWith('ADR-'))) {
        files.push({ abs: join(abs, name), rel: join(entry, name) });
      }
    } else if (statSync(abs).isFile()) {
      files.push({ abs, rel: entry });
    }
  }

  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

function buildNav(files: Array<{ rel: string }>): NavItem[] {
  const nav: NavItem[] = [{ title: 'Início', href: 'index.html' }];

  for (const file of files) {
    const name = basename(file.rel, '.md');
    const href =
      file.rel.startsWith('docs/adrs/')
        ? `adrs/${slugify(name)}.html`
        : `${slugify(name)}.html`;
    const title =
      file.rel === 'docs/PRD.md'
        ? 'PRD'
        : file.rel === 'docs/RFC.md'
          ? 'RFC'
          : file.rel === 'docs/FDD.md'
            ? 'FDD'
            : file.rel === 'docs/TRACKER.md'
              ? 'Tracker'
              : name.toUpperCase();
    nav.push({ title, href, group: file.rel.includes('/adrs/') ? 'ADRs' : 'Documentos' });
  }

  return nav;
}

function renderPage(
  title: string,
  bodyHtml: string,
  nav: NavItem[],
  sourceCommit: string,
  generatedAt: string,
  depth = 0,
): string {
  const assetPrefix = depth === 0 ? '' : `${'../'.repeat(depth)}`;
  const navHtml = nav
    .map((item) => {
      const group = item.group ? ` data-group="${item.group}"` : '';
      return `<li${group}><a href="${item.href}">${item.title}</a></li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Webhooks OMS</title>
  <link rel="stylesheet" href="${assetPrefix}assets/style.css" />
</head>
<body>
  <header class="site-header">
    <div class="commit-banner">
      <strong>source_commit:</strong>
      <code id="source-commit">${sourceCommit}</code>
      <span class="generated-at">gerado em ${generatedAt}</span>
    </div>
    <h1>Sistema de Webhooks — Design Docs</h1>
  </header>
  <div class="layout">
    <nav class="sidebar">
      <ul>${navHtml}</ul>
    </nav>
    <main class="content prose">
      ${bodyHtml}
    </main>
  </div>
</body>
</html>`;
}

export function generateSite(sourceCommit?: string): string {
  const commit = sourceCommit ?? getHeadCommit();
  const generatedAt = new Date().toISOString();
  const files = collectMarkdownFiles();
  const nav = buildNav(files);

  mkdirSync(join(SITE_DIR, 'assets'), { recursive: true });
  mkdirSync(join(SITE_DIR, 'adrs'), { recursive: true });

  const css = readFileSync(join(ROOT, 'scripts/docs/assets/style.css'), 'utf8');
  writeFileSync(join(SITE_DIR, 'assets/style.css'), css, 'utf8');

  for (const file of files) {
    const md = readFileSync(file.abs, 'utf8');
    const body = marked.parse(md) as string;
    const title = basename(file.rel, '.md');
    const inAdr = file.rel.startsWith('docs/adrs/');
    const outDir = inAdr ? join(SITE_DIR, 'adrs') : SITE_DIR;
    const outName = `${slugify(title)}.html`;
    const page = renderPage(title, body, nav, commit, generatedAt, inAdr ? 1 : 0);
    writeFileSync(join(outDir, outName), page, 'utf8');
  }

  const indexBody = `
    <h2>Pacote de design docs</h2>
    <p>Documentação gerada a partir dos Markdown da Parte 1. Navegue pelos links à esquerda.</p>
    <p>O hash <code>${commit}</code> é a âncora de sincronização com o código (<code>docs/site/docs-meta.json</code>).</p>
    <ul>
      ${nav
        .filter((n) => n.href !== 'index.html')
        .map((n) => `<li><a href="${n.href}">${n.title}</a></li>`)
        .join('')}
    </ul>`;

  writeFileSync(
    join(SITE_DIR, 'index.html'),
    renderPage('Início', indexBody, nav, commit, generatedAt, 0),
    'utf8',
  );

  writeMeta({
    source_commit: commit,
    generated_at: generatedAt,
    documents: [...DOCUMENT_PATHS],
  });

  console.log(`Site gerado em ${relative(ROOT, SITE_DIR)} (source_commit=${commit})`);
  return commit;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSite();
}
