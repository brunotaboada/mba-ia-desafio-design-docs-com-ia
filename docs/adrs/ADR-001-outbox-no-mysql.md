# ADR-001: Padrão Outbox no MySQL

**Status:** Aceito  
**Date:** 07-11-2025  
**Used by:**
- [ADR-002: Worker em Processo Separado com Polling](./ADR-002-worker-polling-processo-separado.md)
- [ADR-007: Snapshot de Payload na Inserção da Outbox](./ADR-007-payload-snapshot-na-insercao.md)

## Contexto

Clientes B2B precisam ser notificados quando o status de pedidos muda na plataforma. Hoje dependem de polling periódico, o que torna integrações lentas e caras. A mudança de status no OMS ocorre dentro de uma transação de banco que persiste o pedido, o histórico de status e ajustes de estoque — operação já considerada pesada pelo time.

Disparar notificações HTTP de forma síncrona dentro dessa transação acopla a disponibilidade e a latência de sistemas externos ao fluxo crítico de pedidos. Se o endpoint do cliente estiver lento ou indisponível, mudanças de status para outros pedidos seriam bloqueadas. Além disso, falha na entrega externa não pode justificar rollback de uma mudança de status já válida no negócio.

O time precisa de um mecanismo que garanta que todo status commitado gere um registro de evento correspondente, sem adicionar infraestrutura desproporcional para um time pequeno.

## Fatores de Decisão

- Consistência transacional entre mudança de status e registro do evento de notificação.
- Isolamento do fluxo de pedidos em relação à latência e falhas de endpoints externos.
- Reuso do MySQL já em produção, sem novo broker de mensagens.
- Capacidade operacional limitada do time para manter infraestrutura adicional.
- Alinhamento com o padrão de identificadores UUID já adotado no projeto.

## Alternativas Consideradas

1. **Padrão Transactional Outbox no MySQL** — registrar evento na mesma transação da mudança de status; worker separado consome e entrega de forma assíncrona.
2. **Disparo síncrono durante a transação de pedidos** — chamar o endpoint do cliente antes do commit.
3. **Fila externa com Redis Streams** — publicar evento em broker dedicado após o commit.

## Decisão

**Opção escolhida:** Padrão Transactional Outbox no MySQL, porque garante atomicidade entre persistência do status e registro do evento usando infraestrutura existente, sem acoplar entregas HTTP ao caminho crítico de pedidos.

O evento é persistido junto à mudança de status; se o registro falhar, toda a transação é revertida. Um processo worker dedicado lê eventos pendentes e executa as entregas outbound. O conteúdo do evento é capturado como snapshot no momento da inserção (ver ADR-007).

## Prós e Contras das Opções

### Padrão Transactional Outbox no MySQL

- **Prós:** Consistência forte; sem nova infraestrutura; worker pode reiniciar sem perder eventos commitados; padrão maduro e bem documentado.
- **Contras:** Crescimento de volume na store de eventos; latência mínima de entrega depende do mecanismo de consumo (ADR-002); acoplamento leve entre domínio de pedidos e publicação de eventos.

### Disparo síncrono durante a transação de pedidos

- **Prós:** Entrega imediata em caso de sucesso; modelo mental simples.
- **Contras:** Bloqueia transações por latência externa; indisponibilidade do cliente impacta todos os pedidos; rollback por falha de webhook é inaceitável no negócio.

### Fila externa com Redis Streams

- **Prós:** Desacoplamento e throughput elevado; consumo reativo possível.
- **Contras:** Exige Redis Cluster e operação adicional; overengineering para o volume e o tamanho do time; risco de inconsistência entre commit e publicação sem outbox transacional.

## Consequências

### Positivas

- Consistência forte entre mudança de status e registro do evento na mesma transação.
- Sem nova infraestrutura além do MySQL já em produção.
- Worker pode falhar e reiniciar sem perder eventos já commitados.
- Pré-requisito claro para consumo assíncrono (ADR-002) e snapshot de payload (ADR-007).

### Negativas

- Crescimento de volume na store de eventos outbound ao longo do tempo.
- Latência mínima de entrega depende do mecanismo de consumo adotado pelo worker (ADR-002).
- Acoplamento leve entre o domínio de pedidos e a publicação de eventos.
- Arquivamento de eventos entregues após período prolongado fica fora do escopo desta fase.

## Referências

- src/modules/orders/order.service.ts:126
- src/modules/orders/order.status.ts:1
- prisma/schema.prisma:74
