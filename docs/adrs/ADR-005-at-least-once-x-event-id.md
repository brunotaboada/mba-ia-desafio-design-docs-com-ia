# ADR-005: Garantia At-Least-Once com X-Event-Id

## Status

Aceito

## Contexto

O worker pode reenviar um evento após timeout ambíguo (cliente recebeu mas resposta não chegou) ou após replay manual da DLQ. Garantir exactly-once exigiria coordenação bilateral complexa. Clientes B2B precisam de mecanismo simples de deduplicação.

## Decisão

- Semântica de entrega: **at-least-once** (o cliente pode receber o mesmo evento mais de uma vez).
- Gerar `event_id` como **UUID** no momento da inserção na outbox.
- Enviar `event_id` no header **`X-Event-Id`** em toda entrega HTTP.
- Documentar no portal do desenvolvedor que o cliente **deve deduplicar** pelo `event_id` no lado dele.
- O `event_id` na outbox é distinto do `id` da linha da outbox se necessário, mas na prática o UUID do evento serve como identificador único de entrega.

Responsabilidade de idempotência no consumidor é padrão de mercado (Stripe, GitHub citados na reunião).

## Alternativas Consideradas

### Exactly-once delivery

Rejeitado. Exige protocolo de confirmação bilateral e estado compartilhado; complexidade desproporcional para o caso de uso.

### Deduplicação apenas por `(order_id, to_status)`

Rejeitado. Não cobre replays da DLQ nem reenvios após timeout ambíguo com mesmo conteúdo.

### Sem identificador de evento

Rejeitado. Cliente não conseguiria distinguir retry de evento novo.

## Consequências

### Positivas

- Implementação simples no worker (reenviar é seguro do lado do emissor).
- Alinhado com práticas da indústria.
- Cliente controla sua própria idempotência.

### Negativas

- Cliente **deve** implementar deduplicação; falha nisso causa efeitos colaterais (ex.: processar status duas vezes).
- Documentação e exemplos de integração precisam destacar esse requisito.
