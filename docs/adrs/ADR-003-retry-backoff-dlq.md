# ADR-003: Política de Retry com Backoff Exponencial e DLQ

## Status

Aceito

## Contexto

Endpoints de webhook dos clientes podem estar temporariamente indisponíveis (manutenção planejada de até 2 horas foi citada como caso real). O worker precisa de estratégia clara para falhas de entrega sem bloquear a outbox indefinidamente nem perder evidência de eventos não entregues.

## Decisão

### Retry

- **5 tentativas** de entrega por evento (incluindo a primeira).
- Backoff exponencial entre tentativas: **1 min → 5 min → 30 min → 2 h → 12 h** (~15h entre primeira falha e última tentativa).
- Falha de timeout HTTP (10s) ou status não-2xx conta como tentativa falha.

### Dead Letter Queue (DLQ)

- Tabela separada `webhook_dead_letter` com payload, motivo da falha e timestamp.
- Após esgotar tentativas, mover evento da outbox para DLQ (outbox principal permanece limpa para leitura).
- **Replay manual** via `POST /admin/webhooks/dead-letter/:id/replay` — recoloca evento na outbox como pendente.
- Endpoint de replay exige role `ADMIN` via `requireRole` (`src/middlewares/auth.middleware.ts`) e deve logar quem executou o replay para auditoria.

## Alternativas Consideradas

### 3 tentativas

Rejeitado. Janela de ~30 minutos é insuficiente para manutenções planejadas de clientes.

### Retry indefinido com backoff

Rejeitado. Eventos de clientes que desapareceram ficariam pendentes para sempre, poluindo a outbox.

### Marcar como "failed" na própria outbox (sem tabela DLQ)

Rejeitado. Polui leitura da outbox ativa e dificulta evidência para debug e reprocessamento.

## Consequências

### Positivas

- Cobre indisponibilidades de curto e médio prazo (~15h).
- DLQ separada facilita operação e auditoria.
- Replay manual dá controle ao time interno sem automatismo arriscado.

### Negativas

- Cliente offline por mais de ~15h perde entrega automática (evento vai para DLQ).
- Complexidade adicional de duas tabelas e lógica de transição outbox → DLQ.
- Replay manual exige intervenção humana com role ADMIN.
