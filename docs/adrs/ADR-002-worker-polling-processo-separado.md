# ADR-002: Worker em Processo Separado com Polling

**Status:** Aceito  
**Date:** 07-11-2025  
**Depends on:** [ADR-001: Padrão Outbox no MySQL](./ADR-001-outbox-no-mysql.md)  
**Used by:** [ADR-003: Política de Retry com Backoff Exponencial e DLQ](./ADR-003-retry-backoff-dlq.md)  
**Related to:** [ADR-006: Reuso dos Padrões Existentes do Projeto](./ADR-006-reuso-padroes-projeto.md)

## Contexto

Com o padrão outbox adotado (ADR-001), eventos de notificação ficam persistidos no MySQL aguardando entrega HTTP aos endpoints cadastrados pelos clientes. É necessário definir como esses eventos serão consumidos e transformados em chamadas outbound.

O requisito de negócio aceita latência abaixo de dez segundos como equivalente a tempo real. A API principal já possui entry-point dedicado com bootstrap, logging estruturado e encerramento gracioso; o mecanismo de entrega deve coexistir sem comprometer disponibilidade da API durante deploys ou reinícios.

MySQL não oferece notificação nativa a processos externos comparável a mecanismos de outros bancos relacionais, o que limita abordagens reativas baseadas apenas no banco.

## Fatores de Decisão

- SLA de entrega abaixo de dez segundos para clientes B2B.
- Resiliência a reinícios da API sem interrupção das entregas.
- Simplicidade operacional para time pequeno.
- Limitações do MySQL para sinalização a processos externos.
- Throughput inicial compatível com worker único.

## Alternativas Consideradas

1. **Processo worker separado com polling periódico (intervalo de dois segundos)** — leitura de eventos pendentes em lotes pequenos, processamento e atualização de status.
2. **Trigger de banco para notificar o worker** — reação imediata a novas linhas na store de eventos.
3. **Worker embutido no mesmo processo da API** — consumo inline durante o runtime da aplicação.

## Decisão

**Opção escolhida:** Processo worker separado com polling a cada dois segundos, porque atende o SLA com margem, evita gambiarras de sinalização no MySQL e isola entregas de reinícios da API.

O worker roda como processo Node.js independente, com conexão ao mesmo banco via instância de cliente ORM separada. Na fase inicial opera em configuração single-worker, preservando ordenação implícita por pedido enquanto eventos são processados por ordem de criação. Chamadas HTTP outbound têm timeout de dez segundos; falhas acionam política de retry (ADR-003).

## Prós e Contras das Opções

### Processo worker separado com polling

- **Prós:** Latência previsível (~dois segundos no pior caso antes do processamento); simplicidade operacional; resiliência a deploys da API; sem broker externo.
- **Contras:** Latência mínima mesmo com fila vazia; leituras periódicas no banco; single-worker limita throughput e ordenação global entre pedidos distintos.

### Trigger de banco para notificar o worker

- **Prós:** Potencialmente mais reativo que polling fixo.
- **Contras:** MySQL executa apenas SQL dentro do trigger; avisar processo externo exigiria soluções frágeis; complexidade sem ganho proporcional dado o SLA.

### Worker embutido no mesmo processo da API

- **Prós:** Menos processos para operar; deploy único.
- **Contras:** Reinício da API interrompe entregas; competição por recursos com requisições HTTP; acoplamento indesejado entre API e entrega.

## Consequências

### Positivas

- Atende o SLA de entrega abaixo de dez segundos com margem previsível.
- Reinícios e deploys da API não interrompem as entregas de webhooks.
- Simplicidade operacional: um processo adicional, sem broker externo.
- Resiliência a indisponibilidade temporária da API.

### Negativas

- Operação passa a incluir processo adicional com script e monitoramento próprios.
- Latência mínima de ~dois segundos mesmo com fila vazia.
- Single-worker limita throughput e não garante ordenação global entre pedidos distintos.
- Polling contínuo gera leituras periódicas no MySQL (mitigável com índices adequados).
- Escalar para múltiplos workers permanece explicitamente adiado.

## Referências

- src/server.ts:1
- src/modules/orders/order.service.ts:126
- prisma/schema.prisma:1
