# Tracker de Rastreabilidade

Mapeamento de itens documentados à origem na transcrição (`TRANSCRICAO.md`) ou no código base. Atualizado conforme novos documentos (RFC, FDD, PRD) forem produzidos.

| ID | Documento | Tipo | Conteúdo (resumo) | Fonte | Localização |
| --- | --- | --- | --- | --- | --- |
| ADR-001-DEC-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Adotar padrão Transactional Outbox no MySQL | TRANSCRICAO | [09:06] Diego |
| ADR-001-DEC-02 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Inserir evento na mesma transação da mudança de status | TRANSCRICAO | [09:06] Diego |
| ADR-001-DEC-03 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Outbox decidido formalmente pelo time | TRANSCRICAO | [09:08] Larissa |
| ADR-001-ALT-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Trade-off | Disparo síncrono rejeitado — bloqueia transação de pedidos | TRANSCRICAO | [09:04] Bruno |
| ADR-001-ALT-02 | docs/adrs/ADR-001-outbox-no-mysql.md | Trade-off | Redis Streams rejeitado — overengineering para time pequeno | TRANSCRICAO | [09:07] Diego |
| ADR-001-CON-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Restrição | Arquivamento de eventos após 30 dias fora do escopo | TRANSCRICAO | [09:08] Diego |
| ADR-001-COD-01 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Integração na transação de mudança de status de pedidos | CODIGO | src/modules/orders/order.service.ts |
| ADR-001-COD-02 | docs/adrs/ADR-001-outbox-no-mysql.md | Decisão | Identificadores UUID como padrão do projeto | CODIGO | prisma/schema.prisma |
| ADR-002-DEC-01 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Worker em polling a cada 2 segundos | TRANSCRICAO | [09:09] Diego |
| ADR-002-DEC-02 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Latência mínima de 2s aceita pelo produto | TRANSCRICAO | [09:10] Larissa |
| ADR-002-DEC-03 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Worker como processo separado da API | TRANSCRICAO | [09:11] Diego |
| ADR-002-DEC-04 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Entry-point dedicado e script npm run worker | TRANSCRICAO | [09:11] Larissa |
| ADR-002-DEC-05 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Timeout HTTP de 10 segundos no envio | TRANSCRICAO | [09:42] Diego |
| ADR-002-ALT-01 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Trade-off | Trigger MySQL rejeitado — sem listener nativo | TRANSCRICAO | [09:09] Diego |
| ADR-002-ALT-02 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Trade-off | Worker embutido na API rejeitado | TRANSCRICAO | [09:11] Diego |
| ADR-002-CON-01 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Restrição | Single-worker; ordering global não garantida | TRANSCRICAO | [09:12] Diego |
| ADR-002-CON-02 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Restrição | SLA de entrega abaixo de 10 segundos | TRANSCRICAO | [09:02] Marcos |
| ADR-002-COD-01 | docs/adrs/ADR-002-worker-polling-processo-separado.md | Decisão | Referência de bootstrap para entry-point do worker | CODIGO | src/server.ts |
| ADR-003-DEC-01 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Backoff exponencial em falhas de entrega | TRANSCRICAO | [09:15] Diego |
| ADR-003-DEC-02 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Cinco tentativas de entrega por evento | TRANSCRICAO | [09:16] Larissa |
| ADR-003-DEC-03 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Progressão 1m/5m/30m/2h/12h | TRANSCRICAO | [09:17] Diego |
| ADR-003-DEC-04 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Dead letter queue em store separada | TRANSCRICAO | [09:18] Diego |
| ADR-003-DEC-05 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Replay manual de DLQ por administrador | TRANSCRICAO | [09:18] Diego |
| ADR-003-DEC-06 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Replay exige role ADMIN com auditoria | TRANSCRICAO | [09:36] Sofia |
| ADR-003-ALT-01 | docs/adrs/ADR-003-retry-backoff-dlq.md | Trade-off | Três tentativas rejeitadas — janela curta demais | TRANSCRICAO | [09:16] Diego |
| ADR-003-ALT-02 | docs/adrs/ADR-003-retry-backoff-dlq.md | Trade-off | Retry indefinido rejeitado — eventos órfãos | TRANSCRICAO | [09:15] Diego |
| ADR-003-COD-01 | docs/adrs/ADR-003-retry-backoff-dlq.md | Decisão | Controle de acesso ADMIN via middleware existente | CODIGO | src/middlewares/auth.middleware.ts |
| ADR-004-DEC-01 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Decisão | Assinatura HMAC-SHA256 sobre corpo da requisição | TRANSCRICAO | [09:20] Sofia |
| ADR-004-DEC-02 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Decisão | Secret única por endpoint de webhook | TRANSCRICAO | [09:21] Sofia |
| ADR-004-DEC-03 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Decisão | Rotação de secret com grace period de 24h | TRANSCRICAO | [09:21] Sofia |
| ADR-004-DEC-04 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Decisão | TLS obrigatório — apenas URLs HTTPS | TRANSCRICAO | [09:23] Sofia |
| ADR-004-DEC-05 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Decisão | Limite de payload 64KB — erro sem truncar | TRANSCRICAO | [09:24] Larissa |
| ADR-004-ALT-01 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Trade-off | Secret global rejeitada — blast radius | TRANSCRICAO | [09:21] Sofia |
| ADR-004-CON-01 | docs/adrs/ADR-004-hmac-sha256-secret-por-endpoint.md | Restrição | Revisão de segurança antes do deploy | TRANSCRICAO | [09:46] Sofia |
| ADR-005-DEC-01 | docs/adrs/ADR-005-at-least-once-x-event-id.md | Decisão | Garantia at-least-once na entrega | TRANSCRICAO | [09:24] Diego |
| ADR-005-DEC-02 | docs/adrs/ADR-005-at-least-once-x-event-id.md | Decisão | Identificador único por evento para deduplicação | TRANSCRICAO | [09:25] Diego |
| ADR-005-DEC-03 | docs/adrs/ADR-005-at-least-once-x-event-id.md | Decisão | Cliente responsável por idempotência | TRANSCRICAO | [09:25] Sofia |
| ADR-005-ALT-01 | docs/adrs/ADR-005-at-least-once-x-event-id.md | Trade-off | Exactly-once rejeitado — complexidade bilateral | TRANSCRICAO | [09:25] Diego |
| ADR-006-DEC-01 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Módulo webhooks segue estrutura modular existente | TRANSCRICAO | [09:27] Bruno |
| ADR-006-DEC-02 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Prefixo WEBHOOK_ em códigos de erro | TRANSCRICAO | [09:29] Larissa |
| ADR-006-DEC-03 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Reuso de logger estruturado existente | TRANSCRICAO | [09:29] Bruno |
| ADR-006-DEC-04 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Error middleware trata erros sem alteração | TRANSCRICAO | [09:29] Bruno |
| ADR-006-DEC-05 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Reuso máximo de padrões do projeto | TRANSCRICAO | [09:30] Larissa |
| ADR-006-ALT-01 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Trade-off | Biblioteca externa de filas rejeitada | TRANSCRICAO | [09:07] Diego |
| ADR-006-COD-01 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Modelo de erros tipados reutilizado | CODIGO | src/shared/errors/app-error.ts |
| ADR-006-COD-02 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Hierarquia de erros HTTP do domínio | CODIGO | src/shared/errors/http-errors.ts |
| ADR-006-COD-03 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Tratamento centralizado de exceções | CODIGO | src/middlewares/error.middleware.ts |
| ADR-006-COD-04 | docs/adrs/ADR-006-reuso-padroes-projeto.md | Decisão | Logger com redação de dados sensíveis | CODIGO | src/shared/logger/index.ts |
| ADR-007-DEC-01 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Decisão | Payload renderizado como snapshot na inserção | TRANSCRICAO | [09:52] Larissa |
| ADR-007-DEC-02 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Decisão | Snapshot reflete instante da transição de status | TRANSCRICAO | [09:52] Diego |
| ADR-007-DEC-03 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Decisão | Filtrar status subscrito na inserção, não no envio | TRANSCRICAO | [09:34] Bruno |
| ADR-007-DEC-04 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Decisão | Payload enxuto sem itens de linha do pedido | TRANSCRICAO | [09:43] Diego |
| ADR-007-ALT-01 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Trade-off | Renderização lazy no envio rejeitada | TRANSCRICAO | [09:52] Bruno |
| ADR-007-COD-01 | docs/adrs/ADR-007-payload-snapshot-na-insercao.md | Decisão | Transições de status definem eventos elegíveis | CODIGO | src/modules/orders/order.status.ts |
