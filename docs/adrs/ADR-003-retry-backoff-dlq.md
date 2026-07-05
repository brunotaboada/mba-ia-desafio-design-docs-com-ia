# ADR-003: Política de Retry com Backoff Exponencial e DLQ

**Status:** Aceito  
**Date:** 07-11-2025  
**Depends on:** [ADR-002: Worker em Processo Separado com Polling](./ADR-002-worker-polling-processo-separado.md)  
**Related to:** [ADR-005: Garantia At-Least-Once com Identificador de Evento](./ADR-005-at-least-once-x-event-id.md)

## Contexto e Declaração do Problema

Endpoints de webhook dos clientes podem ficar temporariamente indisponíveis — manutenções planejadas de até duas horas já ocorreram com clientes reais. O worker (ADR-002) precisa tratar falhas de entrega sem bloquear indefinidamente a store de eventos ativa nem descartar evidência de eventos não entregues.

Sem política clara, o time enfrentaria escolha entre retry infinito (poluição e custo) ou abandono prematuro (perda de notificações recuperáveis). Operações também precisam de caminho para reprocessamento manual de eventos que esgotaram tentativas automáticas.

## Fatores de Decisão

- Cobrir indisponibilidades de curto e médio prazo sem retry eterno.
- Manter store de eventos ativa legível para o worker.
- Preservar evidência para debug e reprocessamento.
- Controle operacional com intervenção humana para casos extremos.
- Auditoria de ações administrativas sensíveis.

## Alternativas Consideradas

1. **Cinco tentativas com backoff exponencial e dead letter queue separada** — progressão 1 min, 5 min, 30 min, 2 h, 12 h; após esgotar, mover para store de falhas permanentes com replay manual por administrador.
2. **Três tentativas com backoff curto** — janela total de aproximadamente trinta minutos.
3. **Retry indefinido com backoff crescente** — tentativas contínuas enquanto endpoint permanecer indisponível.

## Decisão

**Opção escolhida:** Cinco tentativas com backoff exponencial (1 min → 5 min → 30 min → 2 h → 12 h) e dead letter queue em store separada, porque cobre janela de quase quinze horas entre primeira falha e última tentativa — adequada a manutenções planejadas — sem manter eventos órfãos indefinidamente.

Falhas de timeout HTTP (dez segundos) ou respostas não bem-sucedidas contam como tentativa. Após esgotar tentativas, o evento migra para store de dead letter com payload, motivo e timestamp. Reprocessamento manual recoloca o evento na outbox como pendente, restrito a usuários com papel administrativo, com registro de auditoria de quem executou a ação.

## Prós e Contras das Opções

### Cinco tentativas com backoff e DLQ separada

- **Prós:** Cobre indisponibilidades realistas; store ativa permanece limpa; evidência preservada para operações; replay manual controlado.
- **Contras:** Cliente offline por mais de ~15h perde entrega automática; duas stores para operar; intervenção humana no replay.

### Três tentativas com backoff curto

- **Prós:** Falha rápida; menor volume de retries.
- **Contras:** Insuficiente para manutenções de duas horas já observadas; eventos válidos iriam prematuramente para falha permanente.

### Retry indefinido com backoff

- **Prós:** Maximiza chance de entrega eventual.
- **Contras:** Eventos de clientes descontinuados poluem a store indefinidamente; custo operacional e de armazenamento crescente.

## Consequências

### Positivas

- Cobre indisponibilidades de curto e médio prazo (~15 horas entre primeira falha e última tentativa).
- Store ativa permanece legível para o worker; eventos falhos vão para dead letter separada.
- Operações ganha evidência para debug e ferramenta de replay com trilha de auditoria.
- Replay restrito a papel administrativo reduz risco de abuso.

### Negativas

- Cliente offline por mais de ~15 horas perde entrega automática (evento vai para dead letter).
- Complexidade de duas stores e lógica de transição entre elas.
- Replay manual exige intervenção humana em casos extremos.
- Replays podem gerar entregas duplicadas, complementando a semântica at-least-once (ADR-005).

## Referências

- src/middlewares/auth.middleware.ts:49
- src/middlewares/error.middleware.ts:14
- src/modules/orders/order.service.ts:126
