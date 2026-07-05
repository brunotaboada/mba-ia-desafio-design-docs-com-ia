# ADR-006: Reuso dos Padrões Existentes do Projeto

## Status

Aceito

## Contexto

A codebase OMS segue estrutura modular consistente. O módulo de webhooks deve integrar-se sem introduzir novos frameworks ou convenções paralelas, facilitando manutenção pelo time atual.

## Decisão

Reutilizar integralmente os padrões já estabelecidos:

| Padrão | Local no código | Uso no módulo webhooks |
| --- | --- | --- |
| Estrutura modular | `src/modules/orders/`, `src/modules/customers/` | `src/modules/webhooks/` com `controller`, `service`, `repository`, `routes`, `schemas` |
| Erros tipados | `src/shared/errors/app-error.ts`, `http-errors.ts` | Classes `AppError` com códigos `WEBHOOK_*` (ex.: `WEBHOOK_NOT_FOUND`, `WEBHOOK_INVALID_URL`) |
| Error middleware | `src/middlewares/error.middleware.ts` | Trata erros do módulo sem alteração |
| Logger | `src/shared/logger/index.ts` | Pino com redaction de secrets/tokens |
| Autenticação | `src/middlewares/auth.middleware.ts` | `authenticate` no CRUD; `requireRole('ADMIN')` no replay DLQ |
| Validação | Schemas Zod nos módulos existentes | `webhook.schemas.ts` com regra HTTPS, limites de payload |
| Entry-point worker | `src/server.ts` (referência) | `src/worker.ts` com bootstrap e shutdown similares |
| Integração pedidos | `src/modules/orders/order.service.ts` | `changeStatus` chama `publishWebhookEvent(tx, ...)` na mesma transação |
| Máquina de estados | `src/modules/orders/order.status.ts` | Filtro de eventos por status subscrito usa `OrderStatus` do Prisma |

Prefixo **`WEBHOOK_`** para todos os códigos de erro do domínio.

## Alternativas Consideradas

### Biblioteca de filas/worker externa (BullMQ, etc.)

Rejeitado. Introduz Redis e padrão diferente do restante do projeto; outbox no MySQL já foi escolhido.

### Módulo monolítico sem separação controller/service/repository

Rejeitado. Quebra consistência com `orders`, `products`, `customers`.

## Consequências

### Positivas

- Curva de aprendizado zero para engenheiros do time.
- Error handling, logging e auth funcionam out-of-the-box.
- Code review e testes seguem mesmos padrões de `tests/orders.test.ts`.

### Negativas

- `OrderService` ganha dependência (leve) da função de publicação de webhook.
- Códigos `WEBHOOK_*` precisam ser registrados e documentados no FDD para não colidir semanticamente com `INSUFFICIENT_STOCK`, `INVALID_STATUS_TRANSITION`, etc.
