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
| RFC-META-01 | docs/RFC.md | Decisão | Revisores: Larissa, Marcos, Bruno, Diego, Sofia | TRANSCRICAO | [09:00] Larissa |
| RFC-TLDR-01 | docs/RFC.md | Decisão | Proposta: outbox MySQL + worker + HMAC + at-least-once | TRANSCRICAO | [09:48] Larissa |
| RFC-CTX-01 | docs/RFC.md | Decisão | Três clientes B2B exigem notificação de mudança de status | TRANSCRICAO | [09:00] Marcos |
| RFC-CTX-02 | docs/RFC.md | Restrição | SLA tempo real = abaixo de 10 segundos | TRANSCRICAO | [09:02] Marcos |
| RFC-CTX-03 | docs/RFC.md | Restrição | Apenas webhooks outbound (não inbound) | TRANSCRICAO | [09:02] Sofia |
| RFC-CTX-04 | docs/RFC.md | Decisão | OMS sem mecanismo de notificação externa hoje | CODIGO | src/modules/orders/order.service.ts |
| RFC-PROP-01 | docs/RFC.md | Decisão | Publicação transacional na mudança de status | TRANSCRICAO | [09:40] Bruno |
| RFC-PROP-02 | docs/RFC.md | Decisão | Worker separado com polling 2s | TRANSCRICAO | [09:09] Diego |
| RFC-PROP-03 | docs/RFC.md | Decisão | Retry 5x com backoff e DLQ | TRANSCRICAO | [09:17] Larissa |
| RFC-PROP-04 | docs/RFC.md | Decisão | HMAC-SHA256, secret por endpoint, TLS obrigatório | TRANSCRICAO | [09:22] Sofia |
| RFC-PROP-05 | docs/RFC.md | Decisão | At-least-once com X-Event-Id | TRANSCRICAO | [09:26] Larissa |
| RFC-PROP-06 | docs/RFC.md | Decisão | Módulo webhooks reutilizando padrões do OMS | TRANSCRICAO | [09:30] Larissa |
| RFC-PROP-07 | docs/RFC.md | Decisão | CRUD autenticado; replay DLQ exige ADMIN | TRANSCRICAO | [09:36] Sofia |
| RFC-OUT-01 | docs/RFC.md | Restrição | Email de alerta ao cliente fora do escopo | TRANSCRICAO | [09:37] Larissa |
| RFC-OUT-02 | docs/RFC.md | Restrição | Dashboard visual fora do escopo | TRANSCRICAO | [09:40] Larissa |
| RFC-OUT-03 | docs/RFC.md | Restrição | Arquivamento outbox 30 dias fora do escopo | TRANSCRICAO | [09:08] Diego |
| RFC-ALT-01 | docs/RFC.md | Trade-off | Disparo síncrono descartado — bloqueia transação | TRANSCRICAO | [09:04] Bruno |
| RFC-ALT-02 | docs/RFC.md | Trade-off | Redis Streams descartado — overengineering | TRANSCRICAO | [09:07] Diego |
| RFC-ALT-03 | docs/RFC.md | Trade-off | Trigger MySQL descartado — sem listener nativo | TRANSCRICAO | [09:09] Diego |
| RFC-ALT-04 | docs/RFC.md | Trade-off | Worker na API descartado — reinício interrompe entrega | TRANSCRICAO | [09:11] Diego |
| RFC-OPEN-01 | docs/RFC.md | Decisão | Rate limiting de saída — observar e decidir depois | TRANSCRICAO | [09:39] Larissa |
| RFC-OPEN-02 | docs/RFC.md | Decisão | Multi-worker e ordering global — problema futuro | TRANSCRICAO | [09:13] Diego |
| RFC-OPEN-03 | docs/RFC.md | Decisão | Endurecer roles no CRUD — fase futura | TRANSCRICAO | [09:37] Sofia |
| RFC-IMP-01 | docs/RFC.md | Decisão | changeStatus como ponto de acoplamento com outbox | TRANSCRICAO | [09:40] Bruno |
| RFC-IMP-02 | docs/RFC.md | Decisão | Novo processo worker além da API | TRANSCRICAO | [09:11] Larissa |
| RFC-RISK-01 | docs/RFC.md | Risco | Cliente sem deduplicação — prob. média, impacto alto | TRANSCRICAO | [09:25] Sofia |
| RFC-RISK-02 | docs/RFC.md | Risco | Cliente offline >15h — evento na DLQ | TRANSCRICAO | [09:17] Marcos |
| RFC-RISK-03 | docs/RFC.md | Risco | Crescimento da outbox — índices e arquivamento futuro | TRANSCRICAO | [09:08] Diego |
| RFC-RISK-04 | docs/RFC.md | Risco | Vazamento de secret — rotação e TLS | TRANSCRICAO | [09:22] Diego |
| RFC-RISK-05 | docs/RFC.md | Risco | Atraso revisão segurança — 2 dias úteis Sofia | TRANSCRICAO | [09:46] Sofia |
| RFC-ADR-01 | docs/RFC.md | Decisão | Link para ADR-001 Outbox MySQL | TRANSCRICAO | [09:08] Larissa |
| RFC-ADR-02 | docs/RFC.md | Decisão | Link para ADR-002 Worker polling | TRANSCRICAO | [09:10] Larissa |
| FDD-CTX-01 | docs/FDD.md | Decisão | Integração transacional em changeStatus | TRANSCRICAO | [09:40] Bruno |
| FDD-CTX-02 | docs/FDD.md | Restrição | customer_id no body/path, não no JWT | TRANSCRICAO | [09:32] Larissa |
| FDD-OBJ-01 | docs/FDD.md | Requisito Não Funcional | Latência de entrega abaixo de 10 segundos | TRANSCRICAO | [09:02] Marcos |
| FDD-OBJ-02 | docs/FDD.md | Decisão | Até 5 tentativas com backoff definido | TRANSCRICAO | [09:16] Larissa |
| FDD-SCP-01 | docs/FDD.md | Decisão | Módulo src/modules/webhooks e worker src/worker.ts | TRANSCRICAO | [09:27] Bruno |
| FDD-SCP-02 | docs/FDD.md | Restrição | Email de alerta excluído | TRANSCRICAO | [09:37] Larissa |
| FDD-SCP-03 | docs/FDD.md | Restrição | Dashboard visual excluído | TRANSCRICAO | [09:40] Larissa |
| FDD-FLX-01 | docs/FDD.md | Decisão | publishWebhookEvent dentro da transação | TRANSCRICAO | [09:41] Bruno |
| FDD-FLX-02 | docs/FDD.md | Decisão | Filtro de status subscrito na inserção da outbox | TRANSCRICAO | [09:34] Bruno |
| FDD-FLX-03 | docs/FDD.md | Decisão | Worker polling 2s, batch de pendentes | TRANSCRICAO | [09:09] Diego |
| FDD-FLX-04 | docs/FDD.md | Decisão | Backoff 1m/5m/30m/2h/12h antes de DLQ | TRANSCRICAO | [09:17] Diego |
| FDD-FLX-05 | docs/FDD.md | Decisão | Replay DLQ com log de operador ADMIN | TRANSCRICAO | [09:36] Sofia |
| FDD-CON-01 | docs/FDD.md | Requisito Funcional | POST /api/webhooks cadastro com secret gerada | TRANSCRICAO | [09:31] Marcos |
| FDD-CON-02 | docs/FDD.md | Requisito Funcional | GET /webhooks/:id/deliveries últimos 100 | TRANSCRICAO | [09:34] Marcos |
| FDD-CON-03 | docs/FDD.md | Requisito Funcional | PATCH e DELETE de webhook | TRANSCRICAO | [09:33] Bruno |
| FDD-CON-04 | docs/FDD.md | Requisito Funcional | POST admin dead-letter replay | TRANSCRICAO | [09:18] Diego |
| FDD-CON-05 | docs/FDD.md | Requisito Funcional | POST rotate-secret grace 24h | TRANSCRICAO | [09:21] Sofia |
| FDD-CON-06 | docs/FDD.md | Decisão | Headers X-Event-Id, X-Signature, X-Timestamp, X-Webhook-Id | TRANSCRICAO | [09:44] Diego |
| FDD-CON-07 | docs/FDD.md | Decisão | Payload order.status_changed sem items | TRANSCRICAO | [09:43] Diego |
| FDD-ERR-01 | docs/FDD.md | Decisão | Códigos de erro prefixo WEBHOOK_ | TRANSCRICAO | [09:29] Larissa |
| FDD-ERR-02 | docs/FDD.md | Decisão | WEBHOOK_INVALID_URL para URL não HTTPS | TRANSCRICAO | [09:23] Sofia |
| FDD-ERR-03 | docs/FDD.md | Decisão | Payload >64KB erro sem truncar | TRANSCRICAO | [09:24] Larissa |
| FDD-ERR-04 | docs/FDD.md | Decisão | Timeout HTTP outbound 10 segundos | TRANSCRICAO | [09:42] Diego |
| FDD-OBS-01 | docs/FDD.md | Decisão | Logs estruturados via Pino existente | TRANSCRICAO | [09:29] Bruno |
| FDD-OBS-02 | docs/FDD.md | Decisão | Redação de secrets no logger | CODIGO | src/shared/logger/index.ts |
| FDD-INT-01 | docs/FDD.md | Decisão | Extensão de changeStatus com publishWebhookEvent | CODIGO | src/modules/orders/order.service.ts |
| FDD-INT-02 | docs/FDD.md | Decisão | Transições OrderStatus definem eventos elegíveis | CODIGO | src/modules/orders/order.status.ts |
| FDD-INT-03 | docs/FDD.md | Decisão | Erros WEBHOOK_ estendem AppError | CODIGO | src/shared/errors/app-error.ts |
| FDD-INT-04 | docs/FDD.md | Decisão | requireRole ADMIN no replay DLQ | CODIGO | src/middlewares/auth.middleware.ts |
| FDD-INT-05 | docs/FDD.md | Decisão | Serialização de erros via error middleware | CODIGO | src/middlewares/error.middleware.ts |
| FDD-INT-06 | docs/FDD.md | Decisão | Registro de rotas em buildApiRouter | CODIGO | src/routes/index.ts |
| FDD-RISK-01 | docs/FDD.md | Risco | Cliente sem deduplicação X-Event-Id | TRANSCRICAO | [09:25] Sofia |
| FDD-RISK-02 | docs/FDD.md | Risco | Revisão segurança pré-deploy Sofia | TRANSCRICAO | [09:46] Sofia |
| PRD-CTX-01 | docs/PRD.md | Decisão | Três clientes B2B exigem notificação (Atlas, MaxDistribuição, Nova Cargo) | TRANSCRICAO | [09:00] Marcos |
| PRD-CTX-02 | docs/PRD.md | Decisão | Risco de churn Atlas sem feature até fim do trimestre | TRANSCRICAO | [09:00] Marcos |
| PRD-MET-01 | docs/PRD.md | Requisito Não Funcional | Latência de entrega p95 < 10 segundos | TRANSCRICAO | [09:02] Marcos |
| PRD-MET-02 | docs/PRD.md | Decisão | Meta 3 clientes piloto no go-live | TRANSCRICAO | [09:00] Marcos |
| PRD-MET-03 | docs/PRD.md | Decisão | Prazo fim de novembro, 3 sprints | TRANSCRICAO | [09:46] Larissa |
| PRD-FR-01 | docs/PRD.md | Requisito Funcional | Cadastrar webhook POST com secret gerada | TRANSCRICAO | [09:31] Marcos |
| PRD-FR-02 | docs/PRD.md | Requisito Funcional | Listar webhooks do customer GET | TRANSCRICAO | [09:33] Bruno |
| PRD-FR-03 | docs/PRD.md | Requisito Funcional | Editar webhook PATCH | TRANSCRICAO | [09:33] Bruno |
| PRD-FR-04 | docs/PRD.md | Requisito Funcional | Remover webhook DELETE | TRANSCRICAO | [09:33] Bruno |
| PRD-FR-05 | docs/PRD.md | Requisito Funcional | Notificação outbound em mudança de status | TRANSCRICAO | [09:00] Marcos |
| PRD-FR-06 | docs/PRD.md | Requisito Funcional | Filtrar eventos por status subscrito na inserção | TRANSCRICAO | [09:34] Bruno |
| PRD-FR-07 | docs/PRD.md | Requisito Funcional | Histórico últimas 100 entregas | TRANSCRICAO | [09:34] Marcos |
| PRD-FR-08 | docs/PRD.md | Requisito Funcional | Rotação de secret grace 24h | TRANSCRICAO | [09:21] Sofia |
| PRD-FR-09 | docs/PRD.md | Requisito Funcional | Replay DLQ restrito a ADMIN com auditoria | TRANSCRICAO | [09:36] Sofia |
| PRD-FR-10 | docs/PRD.md | Requisito Funcional | Payload enxuto sem items de linha | TRANSCRICAO | [09:43] Diego |
| PRD-NFR-01 | docs/PRD.md | Requisito Não Funcional | Apenas URLs HTTPS no cadastro | TRANSCRICAO | [09:23] Sofia |
| PRD-NFR-02 | docs/PRD.md | Requisito Não Funcional | HMAC-SHA256 secret por endpoint | TRANSCRICAO | [09:20] Sofia |
| PRD-NFR-03 | docs/PRD.md | Requisito Não Funcional | At-least-once com X-Event-Id | TRANSCRICAO | [09:26] Larissa |
| PRD-NFR-04 | docs/PRD.md | Requisito Não Funcional | 5 tentativas backoff antes de DLQ | TRANSCRICAO | [09:17] Diego |
| PRD-NFR-05 | docs/PRD.md | Requisito Não Funcional | Payload máximo 64KB sem truncar | TRANSCRICAO | [09:24] Larissa |
| PRD-NFR-06 | docs/PRD.md | Requisito Não Funcional | CRUD autenticado; replay só ADMIN | TRANSCRICAO | [09:36] Sofia |
| PRD-OUT-01 | docs/PRD.md | Restrição | Email de alerta fora do escopo v1 | TRANSCRICAO | [09:37] Larissa |
| PRD-OUT-02 | docs/PRD.md | Restrição | Dashboard visual fora do escopo | TRANSCRICAO | [09:40] Larissa |
| PRD-OUT-03 | docs/PRD.md | Restrição | Webhooks inbound fora do escopo | TRANSCRICAO | [09:02] Sofia |
| PRD-OUT-04 | docs/PRD.md | Restrição | Arquivamento outbox 30 dias fora do escopo | TRANSCRICAO | [09:08] Diego |
| PRD-OUT-05 | docs/PRD.md | Restrição | Rate limiting de saída adiado | TRANSCRICAO | [09:39] Larissa |
| PRD-RISK-01 | docs/PRD.md | Risco | Atraso no prazo — prob. média, impacto alto | TRANSCRICAO | [09:45] Marcos |
| PRD-RISK-02 | docs/PRD.md | Risco | Cliente sem deduplicação — prob. média, impacto alto | TRANSCRICAO | [09:25] Sofia |
| PRD-RISK-03 | docs/PRD.md | Risco | Endpoint offline prolongado — prob. média | TRANSCRICAO | [09:17] Marcos |
| PRD-RISK-04 | docs/PRD.md | Risco | Vazamento de secret — prob. média, impacto alto | TRANSCRICAO | [09:22] Diego |
| PRD-DEP-01 | docs/PRD.md | Dependência | Revisão segurança Sofia 2 dias úteis pré-deploy | TRANSCRICAO | [09:46] Sofia |
| PRD-DEP-02 | docs/PRD.md | Dependência | Integração em changeStatus do módulo pedidos | CODIGO | src/modules/orders/order.service.ts |
| PRD-ACC-01 | docs/PRD.md | Decisão | Validação E2E com cliente piloto Atlas | TRANSCRICAO | [09:45] Marcos |
| PRD-TST-01 | docs/PRD.md | Decisão | Regressão em tests/orders.test.ts | CODIGO | tests/orders.test.ts |
