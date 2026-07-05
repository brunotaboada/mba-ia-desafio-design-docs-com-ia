# ADR-002: Worker em Processo Separado com Polling

## Status

Aceito

## Contexto

Eventos na `webhook_outbox` precisam ser consumidos e transformados em chamadas HTTP outbound para os endpoints cadastrados pelos clientes. O requisito de negócio aceita latência abaixo de 10 segundos como "tempo real" (`[09:02] Marcos`).

A API principal já possui entry-point dedicado em `src/server.ts` com bootstrap, logger Pino e graceful shutdown. O worker deve seguir padrão similar, mas como processo Node.js independente.

## Decisão

- Implementar worker como **processo separado** da API (`src/worker.ts`), com script `npm run worker`.
- O worker **não** roda dentro da mesma instância da API — reinício da API não deve interromper entrega de webhooks.
- Usar **polling** a cada **2 segundos**: buscar eventos pendentes mais antigos, processar em batch pequeno, marcar status.
- Instância PrismaClient separada no worker (mesma `DATABASE_URL`, processo diferente).
- Lógica de processamento em `src/modules/webhooks/webhook.processor.ts` (ou `webhook.worker.ts`).
- **Single-worker** na fase inicial: ordering implícita por `created_at` dentro de um mesmo `order_id`. Escalar para múltiplos workers é problema futuro (particionamento por `order_id` ou lock pessimista).

Timeout de cada chamada HTTP outbound: **10 segundos**; acima disso, tratar como falha e acionar retry.

## Alternativas Consideradas

### Trigger MySQL para notificar worker

Rejeitado. MySQL não possui mecanismo nativo equivalente ao NOTIFY/LISTEN do PostgreSQL. Trigger só executa SQL; avisar processo externo exigiria gambiarras (arquivo, endpoint interno).

### Worker embutido na API

Rejeitado. Reinício do processo da API interromperia o consumo da outbox.

### Polling com intervalo menor que 2s

Não adotado. 2s atende o SLA de <10s com margem e reduz carga no banco.

## Consequências

### Positivas

- Latência previsível (pior caso ~2s + tempo de HTTP).
- Simplicidade operacional: um binário/processo a mais, sem broker externo.
- Resiliência a deploys da API.

### Negativas

- Latência mínima de ~2s mesmo quando a fila está vazia.
- Single-worker limita throughput e não garante ordering global entre pedidos diferentes.
- Polling contínuo gera leituras periódicas no MySQL (aceitável com índice em status pendente).
