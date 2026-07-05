# RFC — Sistema de Webhooks de Notificação de Pedidos

## Metadados

| Campo | Valor |
| --- | --- |
| **Autor** | Larissa (Tech Lead) |
| **Status** | Em revisão |
| **Data** | 07-11-2025 |
| **Revisores** | Larissa (Tech Lead), Marcos (PM), Bruno (Engenharia — Pedidos), Diego (Engenharia — Plataforma), Sofia (Segurança) |

---

## Resumo executivo (TL;DR)

Propomos um **sistema outbound de webhooks** acoplado à máquina de estados de pedidos do OMS: eventos registrados via **Transactional Outbox no MySQL** na mesma transação da mudança de status; **worker em processo separado** consome a outbox por polling (2s) e entrega HTTP com **HMAC-SHA256**, semântica **at-least-once** e identificador **`X-Event-Id`**; falhas seguem **retry com backoff** (5 tentativas) e **dead letter queue** com replay manual por ADMIN. Novo módulo `webhooks` reutiliza padrões existentes (erros tipados, Pino, middlewares). Detalhes de implementação, contratos HTTP e matriz de erros ficam no [FDD](./FDD.md); decisões fechadas estão nos [ADRs](./adrs/).

---

## Contexto e problema

Três clientes B2B (Atlas Comercial, MaxDistribuição e Nova Cargo) exigem notificação quando o status de pedidos muda. Hoje dependem de polling em `GET /orders`, o que torna integrações lentas, caras e frágeas. Para o negócio, atraso na entrega representa risco de churn (Atlas citou migração para concorrente se não houver solução até fim do trimestre).

O OMS em produção (Node.js + TypeScript + MySQL/Prisma) possui ciclo de vida de pedidos com transação em `changeStatus` — atualização de pedido, histórico e estoque — mas **não possui** mecanismo de notificação externa, filas ou webhooks. A feature deve preencher esse vácuo sem comprometer a consistência do fluxo crítico de pedidos.

Requisito de negócio: latência percebida como "tempo real" = **abaixo de 10 segundos**. Escopo: **apenas outbound** (plataforma notifica clientes; não há webhooks inbound).

---

## Proposta técnica

### Visão geral

A solução separa **registro do evento** (síncrono, transacional, dentro do domínio de pedidos) da **entrega HTTP** (assíncrona, resiliente, em processo dedicado).

```
┌─────────────┐     transação      ┌──────────────┐    polling 2s    ┌────────────┐
│ Order       │ ─────────────────► │ Outbox       │ ───────────────► │ Worker     │
│ changeStatus│   outbox + status  │ (MySQL)      │                  │ (processo  │
└─────────────┘                    └──────────────┘                  │ separado)  │
                                                                     └─────┬──────┘
                                                                           │ HTTPS + HMAC
                                                                           ▼
                                                                     ┌────────────┐
                                                                     │ Endpoint   │
                                                                     │ do cliente │
                                                                     └────────────┘
```

### Componentes principais

1. **Publicação transacional** — Na mudança de status, inserir evento na outbox dentro da mesma transação que persiste pedido e histórico. Rollback da transação descarta o evento. Filtro por status subscrito ocorre na inserção ([ADR-007](./adrs/ADR-007-payload-snapshot-na-insercao.md)).

2. **Consumo assíncrono** — Worker Node.js independente da API, polling a cada 2s, batch de pendentes, timeout HTTP de 10s ([ADR-002](./adrs/ADR-002-worker-polling-processo-separado.md)).

3. **Resiliência de entrega** — Cinco tentativas com backoff (1m → 5m → 30m → 2h → 12h); após esgotar, evento vai para dead letter; replay manual restrito a ADMIN ([ADR-003](./adrs/ADR-003-retry-backoff-dlq.md)).

4. **Segurança** — HMAC-SHA256 no corpo, secret por endpoint, rotação com grace de 24h, TLS obrigatório ([ADR-004](./adrs/ADR-004-hmac-sha256-secret-por-endpoint.md)).

5. **Semântica de entrega** — At-least-once com `X-Event-Id`; deduplicação no cliente ([ADR-005](./adrs/ADR-005-at-least-once-x-event-id.md)).

6. **Organização do código** — Módulo `src/modules/webhooks` seguindo convenções do OMS; integração mínima em `changeStatus` ([ADR-006](./adrs/ADR-006-reuso-padroes-projeto.md)).

### API de configuração e operação

A plataforma expõe endpoints autenticados para CRUD de webhooks por `customer_id`, histórico de entregas e rotação de secret. Operações administrativas (replay de DLQ) exigem role ADMIN. Contratos, payloads e códigos de erro serão especificados no FDD — não neste documento.

### O que fica fora desta proposta

- Email de alerta ao cliente quando webhook falha repetidamente (fase futura).
- Dashboard visual / painel frontend (time separado).
- Arquivamento automático de eventos entregues após 30 dias.
- Rate limiting de saída por cliente (ver questões em aberto).

---

## Alternativas consideradas

### 1. Disparo síncrono no fluxo de mudança de status

**Descrição:** Chamar o endpoint do cliente dentro da transação ou imediatamente após `changeStatus`, antes de retornar ao chamador da API.

**Por que foi descartada:** A transação de pedidos já é pesada (pedido, histórico, estoque). Latência ou indisponibilidade do cliente bloquearia mudanças de status para outros pedidos. Falha no webhook não pode causar rollback de status válido.

**Trade-off aceito:** Maior latência de entrega (assíncrona via outbox) em troca de isolamento e consistência do domínio de pedidos.

### 2. Fila externa (Redis Streams / broker dedicado)

**Descrição:** Publicar eventos em Redis ou message broker após commit da transação de pedidos.

**Por que foi descartada:** Exige subir e operar infraestrutura adicional (Redis Cluster) para um time pequeno. Risco de inconsistência entre commit e publicação sem padrão outbox transacional.

**Trade-off aceito:** Polling no MySQL existente e latência mínima de ~2s em troca de zero nova infraestrutura e consistência transacional nativa.

### 3. Trigger MySQL para notificar o worker

**Descrição:** Usar triggers no banco para acionar consumo imediato em vez de polling periódico.

**Por que foi descartada:** MySQL não possui mecanismo nativo equivalente ao NOTIFY/LISTEN do PostgreSQL. Trigger só executa SQL; avisar processo externo exigiria soluções frágeis.

**Trade-off aceito:** Polling de 2s atende SLA de <10s com simplicidade operacional.

### 4. Worker embutido no processo da API

**Descrição:** Executar o consumo da outbox no mesmo processo Node.js da API HTTP.

**Por que foi descartada:** Reinício ou deploy da API interromperia entregas de webhook.

**Trade-off aceito:** Processo operacional adicional em troca de resiliência a deploys da API.

---

## Questões em aberto

| # | Questão | Contexto na reunião | Proposta inicial |
| --- | --- | --- | --- |
| 1 | **Rate limiting de envio por cliente** | Se 50 pedidos mudam de status em um minuto, bombardeamos o cliente? | Observar em produção e implementar se virar problema ([09:38] Diego, [09:39] Larissa). |
| 2 | **Escalar para múltiplos workers** | Single-worker garante ordenação por `created_at`; múltiplos workers perdem ordering global. | Adiar; documentar limitação; futuro: particionar por `order_id` ou lock pessimista ([09:12]–[09:13] Diego). |
| 3 | **Endurecer roles no CRUD de webhooks** | Hoje qualquer usuário autenticado pode configurar webhooks. | Manter como está na v1; revisitar em fase futura ([09:36]–[09:37] Sofia). |

---

## Impacto e riscos

### Impacto na arquitetura existente

| Área | Impacto |
| --- | --- |
| **Domínio de pedidos** | `changeStatus` ganha chamada de publicação de evento na transação ativa — único ponto de acoplamento crítico. |
| **Persistência** | Novas tabelas: configuração de webhooks, outbox, dead letter, log de entregas (detalhes no FDD). |
| **Runtime** | Novo processo worker além da API (`npm run worker`). |
| **Segurança** | Geração e rotação de secrets; revisão dedicada de Sofia antes do deploy (2 dias úteis). |
| **Clientes integradores** | Devem implementar verificação HMAC e deduplicação por `X-Event-Id`; documentação no portal. |

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Cliente não implementa deduplicação | Média | Alto — processamento duplicado de status | Documentação destacada no portal; exemplos no FDD. |
| Indisponibilidade do cliente > ~15h | Baixa | Médio — evento vai para DLQ | Replay manual por ADMIN; cliente consulta histórico de entregas. |
| Crescimento da tabela outbox | Média | Médio — performance de leitura | Índices em status e `created_at`; arquivamento em fase futura. |
| Vazamento de secret no lado do cliente | Média | Alto — falsificação de eventos | Secret por endpoint; rotação com grace 24h; TLS obrigatório. |
| Atraso na revisão de segurança | Baixa | Médio — slip de prazo (3 sprints) | Reservar 2 dias úteis de Sofia antes do deploy ([09:46]). |

---

## Decisões relacionadas

Decisões arquiteturais fechadas na reunião estão formalizadas nos ADRs abaixo. Este RFC consolida a proposta; cada ADR registra o contexto, alternativas e consequências da decisão pontual.

| ADR | Decisão | Link |
| --- | --- | --- |
| ADR-001 | Padrão Outbox no MySQL | [ADR-001-outbox-no-mysql.md](./adrs/ADR-001-outbox-no-mysql.md) |
| ADR-002 | Worker em processo separado com polling | [ADR-002-worker-polling-processo-separado.md](./adrs/ADR-002-worker-polling-processo-separado.md) |
| ADR-003 | Retry com backoff e DLQ | [ADR-003-retry-backoff-dlq.md](./adrs/ADR-003-retry-backoff-dlq.md) |
| ADR-004 | HMAC-SHA256 com secret por endpoint | [ADR-004-hmac-sha256-secret-por-endpoint.md](./adrs/ADR-004-hmac-sha256-secret-por-endpoint.md) |
| ADR-005 | At-least-once com X-Event-Id | [ADR-005-at-least-once-x-event-id.md](./adrs/ADR-005-at-least-once-x-event-id.md) |
| ADR-006 | Reuso dos padrões do projeto | [ADR-006-reuso-padroes-projeto.md](./adrs/ADR-006-reuso-padroes-projeto.md) |
| ADR-007 | Snapshot de payload na inserção | [ADR-007-payload-snapshot-na-insercao.md](./adrs/ADR-007-payload-snapshot-na-insercao.md) |

---

## Próximos passos

1. Revisão deste RFC pelos revisores listados nos metadados.
2. Produção do [FDD](./FDD.md) com contratos HTTP, fluxos detalhados e integração com código existente.
3. Consolidação do [PRD](./PRD.md) com requisitos de negócio e métricas.
4. Início da implementação após aprovação do RFC e FDD.
