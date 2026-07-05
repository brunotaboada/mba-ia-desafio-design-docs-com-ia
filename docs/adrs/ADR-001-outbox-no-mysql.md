# ADR-001: Padrão Outbox no MySQL

**Status:** Aceito  
**Date:** 07-11-2025  
**Used by:**
- [ADR-002: Worker em Processo Separado com Polling](./ADR-002-worker-polling-processo-separado.md)
- [ADR-007: Snapshot de Payload na Inserção da Outbox](./ADR-007-payload-snapshot-na-insercao.md)

## Contexto e Declaração do Problema

Clientes B2B precisam ser notificados quando o status de pedidos muda na plataforma. Hoje dependem de polling periódico, o que torna integrações lentas e caras. A mudança de status no OMS ocorre dentro de uma transação de banco que persiste o pedido, o histórico de status e ajustes de estoque — operação já considerada pesada pelo time.

Disparar notificações HTTP de forma síncrona dentro dessa transação acopla a disponibilidade e a latência de sistemas externos ao fluxo crítico de pedidos. Se o endpoint do cliente estiver lento ou indisponível, mudanças de status para outros pedidos seriam bloqueadas. Além disso, falha na entrega externa não pode justificar rollback de uma mudança de status já válida no negócio.

O time precisa de um mecanismo que garanta que todo status commitado gere um registro de evento correspondente, sem adicionar infraestrutura desproporcional para um time pequeno.

## Fatores de Decisão

- Consistência transacional entre mudança de status e registro do evento de notificação.
- Isolamento do fluxo de pedidos em relação à latência e falhas de endpoints externos.
- Reuso do MySQL já em produção, sem novo broker de mensagens.
- Capacidade operacional limitada do time para manter infraestrutura adicional.
- Alinhamento com o padrão de identificadores UUID já adotado no projeto.

## Opções Consideradas

1. **Padrão Transactional Outbox no MySQL** — registrar evento na mesma transação da mudança de status; worker separado consome e entrega de forma assíncrona.
2. **Disparo síncrono durante a transação de pedidos** — chamar o endpoint do cliente antes do commit.
3. **Fila externa com Redis Streams** — publicar evento em broker dedicado após o commit.

## Resultado da Decisão

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

A plataforma passa a ter uma store de eventos outbound acoplada transacionalmente ao ciclo de vida de pedidos. Engenharia deve modelar estados do evento (pendente, processando, entregue, falhou) com índices adequados para leitura pelo worker.

Operacionalmente, o arquivamento de eventos entregues após período prolongado fica fora do escopo desta fase. A entrega assíncrona introduz latência adicional em relação ao disparo síncrono, compensada pela resiliência e pelo isolamento do domínio de pedidos.

Esta decisão é pré-requisito para ADR-002 (consumo por worker) e ADR-007 (formato do snapshot persistido).

## Referências

- src/modules/orders/order.service.ts:126
- src/modules/orders/order.status.ts:1
- prisma/schema.prisma:74
