# Da Reunião ao Documento — Processo de Produção

Entrega do desafio **Design Docs Gerados por IA** (MBA IA / Full Cycle): pacote documental para o **Sistema de Webhooks de Notificação de Pedidos** do OMS, derivado de `TRANSCRICAO.md` e do código existente.

Enunciado original preservado em [ENUNCIADO.md](./ENUNCIADO.md) e no [repositório base](https://github.com/devfullcycle/mba-ia-desafio-design-docs-com-ia).

---

## Sobre o desafio

O cenário é um OMS em produção que precisa notificar clientes B2B quando o status de um pedido muda. A decisão técnica foi tomada em reunião (~55 min), mas só restou a transcrição literal — sem PRD, RFC, ADRs ou especificação de implementação.

Minha tarefa foi atuar como **maestro**: usar IA para ler código e transcrição, extrair decisões e requisitos com rastreabilidade, e produzir um pacote coerente em alturas diferentes (produto → arquitetura → decisão → implementação), sem alterar `src/`, `prisma/` ou `tests/`. Cada afirmação nos documentos deve apontar para timestamp na transcrição ou arquivo real no repositório.

---

## Ferramentas de IA utilizadas

| Ferramenta | Papel |
| --- | --- |
| **Cursor (Cloud Agent)** | Agente principal: leitura do repositório, geração iterativa dos documentos, commits na branch de entrega. |
| **Skill `adr-generator`** | Template e estrutura inicial dos ADRs no formato MADR do curso. |
| **Skill `adr-linker`** | Links bidirecionais entre ADRs (`Depends on`, `Used by`, `Related to`) e relatório em `docs/adrs/reports/`. |
| **Prompts do curso (adaptados)** | Base para FDD e PRD; ajustados com restrições explícitas da rubrica do desafio. |

---

## Workflow adotado

Segui a ordem sugerida pelo enunciado, com o Tracker crescendo a cada documento:

1. **Contextualização** — Mapeamento da transcrição (6 decisões principais, escopo excluído, questões em aberto) + pontos de integração no código (`changeStatus`, erros `AppError`, `requireRole`, logger Pino).
2. **ADRs (7)** — Esqueleto das decisões antes dos documentos amplos; cobertura das 6 decisões principais + snapshot de payload.
3. **RFC** — Proposta concisa referenciando ADRs; alternativas descartadas e questões em aberto da reunião.
4. **FDD** — Contratos HTTP, fluxos outbox/worker/retry/DLQ, matriz `WEBHOOK_*`, integração com 10 arquivos reais.
5. **PRD** — Consolidação de negócio (10 FRs, 10 NFRs, métricas, riscos) com base nos docs técnicos.
6. **Tracker** — ~165 linhas ligando itens a `[hh:mm] Nome` ou caminho de código.
7. **README do processo** — Este arquivo, após revisão da checklist.
8. **Parte 2** — Site HTML, `npm run docs:update`, demonstração com `fase-2/`.

Interação com a IA: prompts **dirigidos** (com trechos da transcrição e paths de arquivo), revisão crítica a cada entrega, e correção explícita quando o formato ou o conteúdo não batia com a rubrica.

---

## Prompts customizados

Prompts que usei no Cursor, um artefato por vez. Cada um recebe contexto concreto: trecho da transcrição, path de arquivo ou número do ADR.

### 1. Mapa transcrição + código

```
Leia TRANSCRICAO.md e o código em src/modules/orders/, src/shared/errors/,
src/middlewares/ e prisma/schema.prisma.

Monte um mapa com:
1) As 6 decisões principais (outbox, worker, retry/DLQ, HMAC, at-least-once, reuso de padrões)
2) Decisões secundárias (payload, headers, timeouts)
3) O que ficou fora de escopo ou foi adiado — com [hh:mm] e nome de quem falou
4) Questões em aberto
5) Para cada decisão: onde isso encaixa no código (arquivo + método/classe)

Só entra no mapa o que tiver fonte na transcrição ou no repositório.
```

### 2. ADR por decisão da reunião

```
Decisão: {nome} — citada em [{hh:mm}] {falante} na TRANSCRICAO.md.
Arquivo: docs/adrs/ADR-{NNN}-{slug-kebab}.md

Seções: Status, Contexto, Decisão, Alternativas Consideradas,
Consequências (### Positivas / ### Negativas).

- Contexto: problema de negócio + restrição do time, com o timestamp
- Alternativas: no máximo 3; pelo menos 1 veio da reunião
- Decisão: um parágrafo; sem código nem contratos HTTP (isso vai no FDD)
- Consequências: trade-off explícito
- Referenciar pelo menos um arquivo do repo (ex.: changeStatus em order.service.ts,
  AppError, requireRole)
- Títulos em português (Contexto, Decisão — não Context / Decision)

Cobrir as 6 decisões principais + snapshot de payload (ADR-007).
```

### 3. Links entre ADRs (`adr-linker`)

```
Leia docs/adrs/ADR-*.md e adicione no cabeçalho de cada arquivo:

- **Depends on:** ADRs dos quais este depende (menção explícita no texto)
- **Used by:** ADRs que dependem deste (bidirecional)
- **Related to:** decisões do mesmo fluxo, sem dependência direta

Regras:
- Link só com evidência no Contexto ou na Decisão (ex.: "outbox adotado (ADR-001)")
- Máximo 3 Depends on e 3 Related to por ADR
- Caminho relativo: ./ADR-NNN-slug.md
- Salvar relatório em docs/adrs/reports/adr-link-report-{data}.md
  (pares encontrados, links quebrados, dependências circulares)

Relações que devem aparecer:
- ADR-002 Depends on ADR-001; ADR-003 Depends on ADR-002
- ADR-007 Depends on ADR-001
- ADR-003 ↔ ADR-005 (retry/DLQ e at-least-once)
- ADR-004 ↔ ADR-005 (HMAC e X-Event-Id)
- ADR-002 ↔ ADR-006 (worker e padrões do projeto)
```

### 4. FDD a partir dos ADRs

```
Com os ADRs 001–007, o RFC e o mapa de contextualização, escreva docs/FDD.md.

Obrigatório:
- Contratos HTTP: CRUD de webhooks, histórico, replay DLQ, DELETE /api/webhooks/:id
  (auth, request/response JSON, status codes)
- Fluxo: changeStatus → publishWebhookEvent(tx) na mesma $transaction → worker → POST com HMAC
- Matriz WEBHOOK_* alinhada a AppError / http-errors
- Resiliência: backoff, DLQ, replay ADMIN, rotação de secret (grace 24h)
- Integração: paths reais em src/ e prisma/;
  src/modules/webhooks/, webhook.errors.ts e src/worker.ts → "(a criar na implementação)"
- Observabilidade: latência p95, taxa de sucesso, backlog outbox/DLQ, logs Pino, tracing

Nível de implementação, não de arquitetura. Cada afirmação com ADR, transcrição ou arquivo.
```

### 5. Linhas no Tracker

```
Para cada item novo em {PRD | RFC | FDD | ADR-NNN}, adicione uma linha em docs/TRACKER.md:

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |

- IDs: PRD-FR-01, RFC-ALT-02, FDD-CON-03, ADR-003-DEC-01, FDD-ERR-05
- TRANSCRICAO → [hh:mm] Nome (conferir em TRANSCRICAO.md)
- CODIGO → caminho completo (ex.: src/modules/orders/order.service.ts)
- Uma linha por requisito, decisão, endpoint, erro WEBHOOK_* e ponto de integração
- Sem linha se não houver fonte verificável
```

### 6. Atualização por diff (Parte 2)

Prompt base em `scripts/docs/prompts/update-doc.txt`, usado pelo `npm run docs:update`.
O script anexa o diff, linhas do Tracker com `Fonte=CODIGO` e o markdown atual do arquivo.

```
Arquivo: {docPath}
Diff e Tracker anexados abaixo.

Atualize somente o que o diff exige. Preserve títulos, estrutura e tom.

Se order.status.ts ganhar SHIPPED → CANCELLED:
- FDD: fluxos, integração e payloads com essa transição
- ADRs que citam order.status.ts: pares origem/destino corretos
- Nada pode dizer que SHIPPED só vai para DELIVERED

Saída: markdown completo do arquivo.
```

---

## Iterações e ajustes

Foram **5 ciclos principais** de geração → revisão → correção:

1. **ADRs — formato MADR vs rubrica** — A skill `adr-generator` gerou seções no padrão MADR do curso (`## Context`, `## Decision`). A rubrica exige títulos literais (`Contexto`, `Decisão`, `Alternativas Consideradas`, `Consequências` com `### Positivas` / `### Negativas`). Reformatados em commit dedicado.

2. **ADRs — links cruzados** — Primeira versão sem dependências entre ADRs. Apliquei `adr-linker` para `Depends on` / `Used by` / `Related to` e registrei no Tracker.

3. **FDD — seção meta indevida** — Primeira versão incluía "Discrepâncias: prompt do curso vs rubrica". Removida: documento de entrega não deve conter notas ao avaliador.

4. **FDD — rubrica literal** — Ajuste de títulos e inclusão explícita de Matriz de erros, Estratégias de resiliência e Integração com 10 arquivos do código base.

5. **Tracker — cobertura** — Expandido de ~60 para **165 linhas** ao produzir RFC, FDD e PRD; validação de que itens sem `[hh:mm]` ou path real foram corrigidos ou removidos dos docs.

---

## Como navegar a entrega

### Ordem sugerida de leitura

| Ordem | Arquivo | Por quê |
| --- | --- | --- |
| 1 | [`TRANSCRICAO.md`](./TRANSCRICAO.md) | Fonte primária (não alterada) |
| 2 | [`docs/adrs/`](./docs/adrs/) | Decisões fechadas — comece por ADR-001 a ADR-007 |
| 3 | [`docs/RFC.md`](./docs/RFC.md) | Visão arquitetural e questões em aberto |
| 4 | [`docs/FDD.md`](./docs/FDD.md) | Como implementar (contratos, fluxos, erros) |
| 5 | [`docs/PRD.md`](./docs/PRD.md) | Por quê, escopo, métricas e critérios de aceite |
| 6 | [`docs/TRACKER.md`](./docs/TRACKER.md) | Rastreabilidade item a item |

### Estrutura de arquivos

```
.
├── README.md                 ← este arquivo (processo)
├── ENUNCIADO.md              ← enunciado original do desafio
├── TRANSCRICAO.md            ← transcrição da reunião (intocada)
├── fase-2/                   ← patch da demonstração Parte 2
├── docs/
│   ├── PRD.md
│   ├── RFC.md
│   ├── FDD.md
│   ├── TRACKER.md
│   ├── adrs/
│   │   ├── ADR-001-outbox-no-mysql.md
│   │   ├── ADR-002-worker-polling-processo-separado.md
│   │   ├── ADR-003-retry-backoff-dlq.md
│   │   ├── ADR-004-hmac-sha256-secret-por-endpoint.md
│   │   ├── ADR-005-at-least-once-x-event-id.md
│   │   ├── ADR-006-reuso-padroes-projeto.md
│   │   └── ADR-007-payload-snapshot-na-insercao.md
│   └── site/                 ← HTML + docs-meta.json (Parte 2)
├── scripts/docs/             ← gerador e auto-atualização
├── src/                      ← código de referência (patch fase-2 em order.status.ts)
├── prisma/
└── tests/
```

### Checklist Parte 1 (revisão final)

| Critério | Status |
| --- | --- |
| PRD — 12 seções, 10 FRs, métricas quantitativas, ≥2 fora de escopo, ≥2 riscos | ✅ |
| RFC — alternativas, questões em aberto, links para ADRs | ✅ |
| FDD — ≥4 endpoints, `WEBHOOK_*`, integração ≥4 arquivos, observabilidade | ✅ |
| ADRs — 7 arquivos, 6/6 decisões principais, referências ao código | ✅ |
| Tracker — 165 linhas; 88% TRANSCRICAO; 20 linhas CODIGO | ✅ |
| README — processo documentado | ✅ |
| Consistência — paths citados existem no repo | ✅ |

---

## Demonstração da Parte 2

Documentação viva: site HTML + `npm run docs:update` (diff + Tracker + IA/determinístico).

### 1. Estado inicial

`source_commit` gravado em `docs/site/docs-meta.json` **antes** da mudança de código:

```
6ea0a8e2719f5df6b51bab35a082f9f8ea744a47
```

(commit do tooling Parte 2, imediatamente antes do site HTML inicial)

### 2. A mudança

```bash
git apply fase-2/order-status-change.patch
git add -A
git commit -m "feat: allow cancelling shipped orders"
```

Commit resultante:

```
af89c168ca473aa3e204f3f14f2717f98963508d
```

`git show --stat`:

```
 src/modules/orders/order.status.ts | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)
```

### 3. A execução

```bash
npm run docs:update
```

Saída (resumo):

```
1. Âncora (source_commit): 6ea0a8e...
2. Arquivos alterados: ... src/modules/orders/order.status.ts
3. Documentos afetados via Tracker (Fonte=CODIGO):
   - docs/adrs/ADR-007-payload-snapshot-na-insercao.md
   - docs/FDD.md
4. Atualizando 3 documento(s)...
   ✓ docs/FDD.md
   ✓ docs/adrs/ADR-007-payload-snapshot-na-insercao.md
   ✓ docs/TRACKER.md
5. Regenerando HTML e re-ancorando...
```

### 4. O resultado

**Novo `source_commit`:** `af89c168ca473aa3e204f3f14f2717f98963508d` (commit do patch)

**Trechos atualizados (antes → depois):**

FDD — integração com `order.status.ts`:

```diff
-| ... definem transições válidas; `subscribedStatuses` filtra ...
+| ... definem transições válidas (inclui **`SHIPPED → CANCELLED`** além de `SHIPPED → DELIVERED`); ... `shouldReplenishStock` repõe estoque ao cancelar de `SHIPPED`.
```

ADR-007 — contexto da máquina de estados:

```diff
+ A máquina de estados em `order.status.ts` governa ... **`SHIPPED → DELIVERED`** e **`SHIPPED → CANCELLED`** ...
```

FDD — novo exemplo de payload `SHIPPED → CANCELLED` na seção de contratos.

Tracker — nova linha `FDD-COD-01` com `Fonte = CODIGO` → `src/modules/orders/order.status.ts`.

**Validação:** nenhum documento afirma que `SHIPPED` só transiciona para `DELIVERED`; FDD e ADR-007 mencionam explicitamente `SHIPPED → CANCELLED`.

### Comandos da Parte 2

| Comando | Função |
| --- | --- |
| `npm run docs:generate` | Gera `docs/site/` a partir dos Markdown |
| `npm run docs:update` | Diff desde `source_commit`, Tracker → docs afetados → regenera HTML |

Código do mecanismo: `scripts/docs/` (versionado no repositório).

### Checklist Parte 2

| Critério | Status |
| --- | --- |
| `docs/site/` HTML navegável (PRD, RFC, FDD, ADRs, Tracker) | ✅ |
| Hash do commit visível no HTML | ✅ |
| `docs/site/docs-meta.json` com `source_commit`, `generated_at`, `documents` | ✅ |
| Mecanismo versionado (`npm run docs:update`) | ✅ |
| Usa `git diff` + Tracker (não regeneração cega) | ✅ |
| Demonstração com patch `fase-2/` documentada acima | ✅ |
| Docs refletem `SHIPPED → CANCELLED` | ✅ |

---

*Entrega na branch `main`.*
