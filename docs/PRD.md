# PRD — Sistema de Webhooks de Notificação de Pedidos

Versão: 1.0  
Data: 07-11-2025  
Responsável: Marcos (Product Manager)

Referências técnicas: [RFC](./RFC.md) · [FDD](./FDD.md) · [ADRs](./adrs/)

---

## Resumo e contexto da feature

O OMS atende clientes B2B que precisam reagir rapidamente a mudanças no status de pedidos. Hoje a integração depende de polling frequente em `GET /orders`, o que é lento, caro e frágil. Três clientes (Atlas Comercial, MaxDistribuição e Nova Cargo) formalizaram a necessidade; a Atlas condiciona permanência na plataforma à entrega da feature até o fim do trimestre.

Esta feature introduz **webhooks outbound**: a plataforma notifica automaticamente o sistema do cliente sempre que o status de um pedido muda, eliminando a necessidade de consultas periódicas.

---

## Problema e motivação

| Problema | Impacto |
| --- | --- |
| Polling manual de pedidos | Integração lenta e cara para o cliente |
| Ausência de notificação push | Atraso na reação operacional do cliente B2B |
| Risco comercial | Atlas sinalizou migração para concorrente sem a feature |

A motivação é reduzir atrito na integração B2B, reter clientes estratégicos e habilitar automação em tempo quasi-real no ecossistema do OMS.

---

## Público-alvo e cenários de uso

**Público-alvo**

- **Clientes B2B integradores** (Atlas, MaxDistribuição, Nova Cargo e futuros): recebem eventos e atualizam ERP/WMS.
- **Usuários operadores do OMS**: configuram webhooks via API autenticada em nome de um `customer_id`.
- **Operadores ADMIN**: reprocessam eventos em dead letter quando necessário.
- **Time de engenharia**: implementa e opera o sistema (detalhes no [FDD](./FDD.md)).

**Cenários de uso**

1. **Integrador cadastra webhook** — informa URL HTTPS e status desejados (ex.: `SHIPPED`, `DELIVERED`); recebe secret para validar assinaturas.
2. **Pedido muda de status** — cliente recebe POST automático com payload JSON; atualiza sistema sem polling.
3. **Falha temporária no endpoint do cliente** — plataforma retenta com backoff; cliente recupera sem perder evento (até limite de tentativas).
4. **Suporte consulta entregas** — integrador verifica últimas 100 tentativas (sucesso/falha, tempo de resposta).
5. **Rotação de secret comprometida** — cliente rotaciona secret com 24h de convivência entre antiga e nova.
6. **Evento em dead letter** — ADMIN da plataforma faz replay manual após cliente corrigir endpoint.

---

## Objetivos e métricas de sucesso

| Objetivo | Métrica | Meta |
| --- | --- | --- |
| Reduzir dependência de polling | % de clientes B2B ativos usando webhooks | 3 clientes piloto no go-live (Atlas, MaxDistribuição, Nova Cargo) |
| Entrega em tempo quasi-real | Latência entre mudança de status e tentativa de entrega | **< 10 segundos** no p95 (definição de "tempo real" acordada com clientes) |
| Confiabilidade de entrega | Taxa de eventos entregues com sucesso (após retries) | ≥ 99% em janela de 30 dias (excluindo endpoints permanentemente offline) |
| Adoção da API de configuração | Webhooks cadastrados e ativos por cliente piloto | ≥ 1 endpoint ativo por cliente no go-live |
| Prazo de entrega | Feature em produção | Fim de novembro (3 sprints estimados) |

---

## Escopo

### Incluído

- Notificação **outbound** em toda mudança de status de pedido elegível.
- API autenticada para CRUD de configuração de webhooks por `customer_id`.
- Filtro de eventos por lista de status subscritos por endpoint.
- Histórico das últimas 100 entregas por webhook.
- Retry automático com backoff e dead letter queue.
- Replay manual de dead letter (role ADMIN).
- Assinatura HMAC-SHA256, secret por endpoint, rotação com grace de 24h.
- Semântica at-least-once com `X-Event-Id` para deduplicação no cliente.
- Documentação de integração no portal do desenvolvedor.

### Fora de escopo

| Item | Motivo | Fonte na reunião |
| --- | --- | --- |
| **Email de alerta** ao cliente quando webhook falha repetidamente | Adiado para fase futura; medir impacto antes | Larissa descartou na v1 |
| **Dashboard visual / painel frontend** para o cliente | Projeto separado do time de frontend; v1 é só API | Larissa: "Só endpoints" |
| **Webhooks inbound** (cliente notifica a plataforma) | Escopo é apenas saída da plataforma para o cliente | Sofia confirmou outbound only |
| **Arquivamento automático** de eventos entregues após 30 dias | Explicitamente fora desta feature | Diego |
| **Rate limiting de saída** por cliente | Não decidido; observar em produção | Diego/Larissa: ponto em aberto |

---

## Requisitos funcionais

| ID | Requisito | Prioridade |
| --- | --- | --- |
| **FR-01** | O sistema deve permitir **cadastrar webhook** (`POST`) com URL HTTPS, lista de status subscritos e `customer_id`; a **secret é gerada pela plataforma** e devolvida na criação. | Must |
| **FR-02** | O sistema deve permitir **listar webhooks** de um customer (`GET`). | Must |
| **FR-03** | O sistema deve permitir **editar webhook** (`PATCH`): URL, status subscritos e estado ativo. | Must |
| **FR-04** | O sistema deve permitir **remover webhook** (`DELETE`). | Must |
| **FR-05** | O sistema deve **disparar notificação outbound** automaticamente quando o status de um pedido muda, para todos os webhooks ativos do customer que assinam o novo status. | Must |
| **FR-06** | O sistema deve **filtrar na inserção do evento**: se nenhum webhook do customer assina o status destino, nenhum evento é registrado. | Must |
| **FR-07** | O sistema deve expor **histórico de entregas** (`GET /webhooks/:id/deliveries`) com os últimos **100** registros (sucesso/falha, payload, response, tempo). | Must |
| **FR-08** | O sistema deve permitir **rotação de secret** com a secret anterior válida por **24 horas** em paralelo. | Must |
| **FR-09** | O sistema deve permitir **replay manual** de evento em dead letter (`POST /admin/webhooks/dead-letter/:id/replay`), restrito a usuários com role **ADMIN**, com registro de auditoria. | Must |
| **FR-10** | O payload de notificação deve incluir identificador de evento, tipo `order.status_changed`, status origem/destino, dados básicos do pedido, **sem itens de linha** (cliente consulta pedido completo se necessário). | Must |

Detalhes de contratos HTTP no [FDD](./FDD.md).

---

## Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| **NFR-01** | Latência de entrega percebida como tempo real: **abaixo de 10 segundos** entre commit do status e tentativa de entrega. |
| **NFR-02** | Apenas URLs **HTTPS** aceitas no cadastro de webhook. |
| **NFR-03** | Assinatura **HMAC-SHA256** em todas as entregas; secret única por endpoint. |
| **NFR-04** | Semântica **at-least-once**; cliente deduplica por `X-Event-Id`. |
| **NFR-05** | Payload de evento limitado a **64KB**; rejeitar sem truncar se exceder. |
| **NFR-06** | Até **5 tentativas** de entrega com backoff (1m, 5m, 30m, 2h, 12h) antes de dead letter. |
| **NFR-07** | Timeout de **10 segundos** por chamada HTTP ao endpoint do cliente. |
| **NFR-08** | Consistência: mudança de status e registro de evento na **mesma transação** de banco. |
| **NFR-09** | CRUD de webhooks acessível a qualquer usuário autenticado; replay DLQ apenas ADMIN. |
| **NFR-10** | Códigos de erro da feature com prefixo `WEBHOOK_` (padrão do projeto). |

---

## Decisões e trade-offs principais

| Decisão | Trade-off aceito | Referência |
| --- | --- | --- |
| Outbox transacional no MySQL | Latência mínima ~2s vs. disparo síncrono | [ADR-001](./adrs/ADR-001-outbox-no-mysql.md) |
| Worker separado com polling | Processo operacional extra vs. resiliência a deploys | [ADR-002](./adrs/ADR-002-worker-polling-processo-separado.md) |
| At-least-once (não exactly-once) | Cliente deve deduplicar vs. complexidade bilateral | [ADR-005](./adrs/ADR-005-at-least-once-x-event-id.md) |
| Retry limitado (5x) + DLQ | Cliente offline >15h perde entrega automática vs. retry eterno | [ADR-003](./adrs/ADR-003-retry-backoff-dlq.md) |
| Secret por endpoint + HMAC | Gestão de secrets no cliente vs. secret global | [ADR-004](./adrs/ADR-004-hmac-sha256-secret-por-endpoint.md) |
| Sem email/dashboard na v1 | Menor escopo vs. visibilidade proativa para o cliente | Transcrição [09:37], [09:40] |

---

## Dependências

| Dependência | Tipo | Descrição |
| --- | --- | --- |
| Módulo de pedidos (`changeStatus`) | Técnica | Ponto de publicação de eventos na outbox |
| MySQL / Prisma | Infraestrutura | Persistência de outbox, configuração e DLQ |
| Autenticação JWT existente | Técnica | API de configuração e controle ADMIN |
| Revisão de segurança (Sofia) | Processo | 2 dias úteis antes do deploy; bloqueante para go-live |
| Portal do desenvolvedor | Produto | Documentação de integração para clientes B2B (Marcos) |
| Prazo comercial Atlas | Negócio | Entrega até fim de novembro |

---

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| **Atraso no prazo** (3 sprints + revisão segurança) | Média | Alto — perda do cliente Atlas | Estimativa em 3 sprints com buffer; revisão Sofia reservada com antecedência |
| **Cliente não implementa deduplicação** (`X-Event-Id`) | Média | Alto — processamento duplicado no ERP | Documentação destacada no portal; exemplos de integração |
| **Endpoint do cliente offline prolongado** | Média | Médio — evento vai para DLQ | Retry cobre ~15h; replay ADMIN; histórico de entregas para diagnóstico |
| **Vazamento de secret no lado do cliente** | Média | Alto — falsificação de eventos | Secret por endpoint; rotação com grace 24h; TLS obrigatório |
| **Volume alto de eventos sem rate limit** | Baixa | Médio — sobrecarga no cliente | Monitorar em produção; rate limiting adiado conforme [RFC](./RFC.md) |

---

## Critérios de aceitação

### Negócio

- [ ] Atlas, MaxDistribuição e Nova Cargo conseguem cadastrar webhook e receber evento em ambiente de homologação.
- [ ] Latência de entrega abaixo de 10 segundos validada em teste com endpoint mock.
- [ ] Portal documenta integração: cadastro, validação HMAC, deduplicação por `X-Event-Id`.

### Produto

- [ ] CRUD completo de webhooks funcional via API autenticada.
- [ ] Histórico de 100 entregas consultável por webhook.
- [ ] Rotação de secret com grace de 24h operacional.
- [ ] Replay DLQ restrito a ADMIN com trilha de auditoria.

### Fora de escopo confirmado

- [ ] Nenhum envio de email de alerta implementado.
- [ ] Nenhum painel visual de webhooks implementado.

Critérios técnicos detalhados no [FDD](./FDD.md), seção "Critérios de aceite técnicos".

---

## Estratégia de testes e validação

| Fase | O que validar | Responsável |
| --- | --- | --- |
| **Unitário** | Schemas Zod (HTTPS, status), geração HMAC, backoff schedule | Engenharia |
| **Integração** | `changeStatus` → outbox na mesma transação; rollback se falhar | Engenharia (Pedidos) |
| **Integração worker** | Polling, entrega mock, retry, transição para DLQ | Engenharia (Plataforma) |
| **Segurança** | HMAC, rotação de secret, TLS, redaction de logs | Sofia (pré-deploy) |
| **E2E com cliente piloto** | Fluxo real Atlas em homologação: cadastro → evento → validação HMAC | PM + cliente |
| **Aceite de negócio** | Meta p95 < 10s; 3 clientes piloto ativos | Marcos |

Validação de regressão no módulo de pedidos existente (`tests/orders.test.ts`) para garantir que `changeStatus` não quebrou comportamento anterior.
