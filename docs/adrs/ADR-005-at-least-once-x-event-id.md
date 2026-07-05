# ADR-005: Garantia At-Least-Once com Identificador de Evento

**Status:** Aceito  
**Date:** 07-11-2025  
**ADRs Relacionados:** ADR-003, ADR-004

## Contexto e Declaração do Problema

O worker pode reenviar um evento após timeout ambíguo — o cliente recebeu a requisição, mas a resposta não retornou a tempo — ou após reprocessamento manual a partir da dead letter queue (ADR-003). Garantir entrega exactly-once exigiria protocolo de confirmação bilateral e estado compartilhado entre plataforma e cada cliente, complexidade desproporcional ao caso de uso.

Clientes B2B precisam de mecanismo simples para distinguir evento novo de reentrega e evitar efeitos colaterais ao processar a mesma notificação mais de uma vez. Provedores de referência do mercado adotam semântica at-least-once com deduplicação no consumidor.

## Fatores de Decisão

- Simplicidade de implementação no lado emissor.
- Alinhamento com práticas de mercado (Stripe, GitHub citados na reunião).
- Suporte a reenvios por retry e replay manual.
- Responsabilidade clara entre plataforma e cliente integrador.
- Identificador estável por evento, independente do conteúdo do pedido.

## Opções Consideradas

1. **Semântica at-least-once com identificador único por evento em header dedicado** — cliente deduplica pelo identificador.
2. **Entrega exactly-once** — coordenação bilateral para garantir processamento único.
3. **Deduplicação implícita por combinação pedido e status destino** — sem identificador de evento dedicado.

## Resultado da Decisão

**Opção escolhida:** Semântica at-least-once com identificador UUID gerado no momento da inserção na outbox e transmitido em header dedicado em toda entrega HTTP, porque permite reenvios seguros do lado emissor enquanto o cliente mantém controle de idempotência.

O portal do desenvolvedor deve documentar explicitamente que integradores devem deduplicar pelo identificador de evento. O identificador é único por ocorrência de notificação, cobrindo replays e timeouts ambíguos que a deduplicação por pedido e status não cobriria.

## Prós e Contras das Opções

### At-least-once com identificador de evento

- **Prós:** Implementação simples no worker; reenvio é seguro; padrão de mercado; cobre replay e timeout ambíguo.
- **Contras:** Cliente deve implementar deduplicação; falha na idempotência do cliente causa processamento duplicado.

### Entrega exactly-once

- **Prós:** Semântica ideal do ponto de vista do consumidor.
- **Contras:** Protocolo bilateral complexo; estado compartilhado; custo de engenharia e operação desproporcional.

### Deduplicação por pedido e status

- **Prós:** Sem header adicional; lógica aparentemente simples.
- **Contras:** Não distingue replay de DLQ de evento novo com mesmo status; falha em cenários de reentrega legítima.

## Consequências

A plataforma aceita que entregas duplicadas são comportamento esperado e documentado. Engenharia gera e persiste identificador na inserção do evento; o worker o propaga em toda tentativa de entrega, incluindo retries.

Integradores assumem responsabilidade de idempotência — requisito a destacar em documentação e exemplos. A decisão interage com ADR-004 (header de assinatura complementar) e ADR-003 (replay manual pode gerar nova tentativa com mesmo identificador).

## Referências

- src/modules/orders/order.service.ts:126
- prisma/schema.prisma:74
- src/modules/orders/order.status.ts:1
