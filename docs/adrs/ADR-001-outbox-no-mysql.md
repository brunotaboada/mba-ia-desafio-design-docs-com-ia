# ADR-001: Padrão Outbox no MySQL

## Status

Aceito

## Contexto

Clientes B2B precisam ser notificados quando o status de pedidos muda. A mudança de status ocorre em `OrderService.changeStatus`, dentro de uma transação Prisma que atualiza `orders`, insere em `order_status_history` e ajusta estoque (`src/modules/orders/order.service.ts`).

Disparar HTTP de webhook de forma síncrona dentro dessa transação foi descartado: qualquer endpoint lento ou indisponível do cliente bloquearia mudanças de status para outros pedidos, e falha no HTTP não pode causar rollback da mudança de status já commitada logicamente.

## Decisão

Adotar o **padrão Transactional Outbox** usando o MySQL existente:

- Criar tabela `webhook_outbox` no mesmo banco gerenciado pelo Prisma.
- Inserir o evento na outbox **dentro da mesma transação** que persiste a mudança de status em `changeStatus`.
- Se a inserção na outbox falhar, a transação inteira faz rollback — não pode existir status alterado sem evento registrado.
- Um worker separado lê a outbox e dispara as chamadas HTTP de forma assíncrona.
- IDs da outbox em UUID, seguindo o padrão do projeto (`prisma/schema.prisma`).
- Índices em `status` (pendente, processando, falhou, entregue) e `created_at` para leitura eficiente pelo worker.
- Payload renderizado como snapshot no momento da inserção (ver ADR-007).

Integração prevista via função `publishWebhookEvent(tx, order, fromStatus, toStatus)` chamada de dentro de `changeStatus`, recebendo o `TransactionClient` da transação ativa.

## Alternativas Consideradas

### Disparo síncrono no `OrderService`

Rejeitado. Acopla latência e disponibilidade do cliente externo à transação crítica de pedidos. Rollback por falha de webhook é inaceitável.

### Redis Streams / fila externa

Rejeitado. Exigiria subir e operar infraestrutura adicional (Redis Cluster) para um time pequeno. O MySQL já está em produção e suporta o padrão outbox com garantia transacional nativa.

## Consequências

### Positivas

- Consistência forte entre mudança de status e registro do evento.
- Sem nova infraestrutura além do MySQL existente.
- Worker pode falhar e reiniciar sem perder eventos já commitados.

### Negativas

- Crescimento da tabela `webhook_outbox`; arquivamento após 30 dias fica fora do escopo desta fase.
- Latência mínima de entrega depende do intervalo de polling do worker (2s — ver ADR-002).
- Acoplamento do módulo de pedidos à função de publicação de eventos (mitigado pela função `publishWebhookEvent` com `tx`).
