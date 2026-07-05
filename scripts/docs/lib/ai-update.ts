import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './meta.js';
import type { TrackerRow } from './tracker.js';

const PROMPT_PATH = join(ROOT, 'scripts/docs/prompts/update-doc.txt');

interface UpdateContext {
  docPath: string;
  content: string;
  diff: string;
  trackerRows: TrackerRow[];
  changedFiles: string[];
}

function loadPrompt(): string {
  return readFileSync(PROMPT_PATH, 'utf8');
}

async function updateWithOpenAI(ctx: UpdateContext): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `${loadPrompt()}

## Arquivo
${ctx.docPath}

## Trechos do Tracker (Fonte = CODIGO) relacionados
${ctx.trackerRows.map((r) => `- ${r.id}: ${r.conteudo} (${r.localizacao})`).join('\n')}

## Git diff
\`\`\`diff
${ctx.diff}
\`\`\`

## Documento atual
\`\`\`markdown
${ctx.content}
\`\`\`

Responda APENAS com o markdown completo atualizado, sem explicações.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.DOCS_UPDATE_MODEL ?? 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'Você atualiza design docs quando o código muda. Mantenha formato e seções. Não invente requisitos.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    console.warn(`OpenAI indisponível (${response.status}); usando atualizador determinístico.`);
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

function applyDeterministicUpdates(ctx: UpdateContext): string {
  const { docPath, content, diff, changedFiles } = ctx;
  let updated = content;

  if (!changedFiles.some((f) => f.includes('order.status.ts'))) {
    return updated;
  }

  if (!diff.includes('SHIPPED') || !diff.includes('CANCELLED')) {
    return updated;
  }

  if (docPath.endsWith('docs/FDD.md')) {
    if (!updated.includes('SHIPPED → CANCELLED')) {
      const integrationNeedle =
        '| `src/modules/orders/order.status.ts` | `OrderStatus` e `canTransition` definem transições válidas; `subscribedStatuses` filtra quais `toStatus` geram evento. |';
      const integrationReplacement =
        '| `src/modules/orders/order.status.ts` | `OrderStatus` e `canTransition` definem transições válidas (inclui **`SHIPPED → CANCELLED`** além de `SHIPPED → DELIVERED`); `subscribedStatuses` filtra quais `toStatus` geram evento; `shouldReplenishStock` repõe estoque ao cancelar de `SHIPPED`. |';
      updated = updated.replace(integrationNeedle, integrationReplacement);

      const fluxoAnchor = '3. Valida transição (`order.status.ts`), estoque, atualiza pedido e histórico.';
      const fluxoInsert = `${fluxoAnchor}\n   - Transições elegíveis incluem cancelamento pós-envio (**`SHIPPED → CANCELLED`**), com reposição de estoque via `shouldReplenishStock`.`;
      if (!updated.includes('cancelamento pós-envio')) {
        updated = updated.replace(fluxoAnchor, fluxoInsert);
      }

      const payloadAnchor = 'Sem `items` no payload. Cliente consulta `GET /orders/:id` para detalhes complementares.';
      const payloadInsert = `Exemplo adicional — cancelamento após envio:\n\n\`\`\`json\n{\n  "event_type": "order.status_changed",\n  "from_status": "SHIPPED",\n  "to_status": "CANCELLED",\n  "order_id": "550e8400-e29b-41d4-a716-446655440000"\n}\n\`\`\`\n\n${payloadAnchor}`;
      if (!updated.includes('"from_status": "SHIPPED"')) {
        updated = updated.replace(payloadAnchor, payloadInsert);
      }
    }
  }

  if (docPath.endsWith('ADR-007-payload-snapshot-na-insercao.md')) {
    if (!updated.includes('SHIPPED → CANCELLED')) {
      const decisionNeedle =
        'O payload inclui identificador de evento, tipo de evento de mudança de status, timestamp ISO 8601, identificadores e número do pedido, status origem e destino, cliente e valor total — sem itens de linha, mantendo envelope enxuto.';
      const decisionInsert = `${decisionNeedle} Transições definidas em \`order.status.ts\` incluem **`SHIPPED → CANCELLED`**; se o webhook assina \`CANCELLED\`, o snapshot registra origem \`SHIPPED\` e destino \`CANCELLED\`.`;
      updated = updated.replace(decisionNeedle, decisionInsert);

      const ctxNeedle = 'Porém o pedido pode sofrer alterações após a transição de status';
      const ctxInsert = `A máquina de estados em \`order.status.ts\` governa quais pares origem/destino geram evento (ex.: **\`SHIPPED → DELIVERED\`** e **\`SHIPPED → CANCELLED\`**). Porém o pedido pode sofrer alterações após a transição de status`;
      if (!updated.includes('SHIPPED → DELIVERED')) {
        updated = updated.replace(ctxNeedle, ctxInsert);
      }
    }
  }

  if (docPath.endsWith('docs/TRACKER.md')) {
    const row =
      '| FDD-COD-01 | docs/FDD.md | Decisão | Transição SHIPPED → CANCELLED gera evento webhook | CODIGO | src/modules/orders/order.status.ts |';
    if (!updated.includes('FDD-COD-01')) {
      updated = `${updated.trim()}\n${row}\n`;
    }
  }

  return updated;
}

export async function updateDocument(ctx: UpdateContext): Promise<string> {
  const aiResult = await updateWithOpenAI(ctx);
  if (aiResult && aiResult.length > 100) {
    return aiResult.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
  }

  const deterministic = applyDeterministicUpdates(ctx);
  if (deterministic !== ctx.content) {
    console.log(`  ↳ atualização determinística aplicada em ${ctx.docPath}`);
  }
  return deterministic;
}

export function writeDocument(docPath: string, content: string): void {
  const full = join(ROOT, docPath);
  writeFileSync(full, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}
