# ADR-007: Snapshot de Payload na Inserção da Outbox

## Status

Aceito

## Contexto

Ao processar um evento da outbox, o worker poderia re-buscar o pedido no banco e montar o payload na hora do envio. Porém, o pedido pode ser alterado após a mudança de status (ex.: notas, desconto em fluxos futuros), gerando inconsistência entre o momento do evento e o payload entregue.

## Decisão

- Armazenar o **payload JSON renderizado** na coluna da `webhook_outbox` no momento da inserção (snapshot).
- O snapshot reflete o estado do pedido **no instante da transição de status**.
- Formato do payload:

```json
{
  "event_id": "<uuid>",
  "event_type": "order.status_changed",
  "timestamp": "<ISO 8601>",
  "order_id": "<uuid>",
  "order_number": "ORD-000042",
  "from_status": "PAID",
  "to_status": "PROCESSING",
  "customer_id": "<uuid>",
  "total_cents": 15000
}
```

- **Não incluir `items`** no payload para mantê-lo enxuto; cliente busca detalhes via `GET /orders/:id` se necessário.
- Filtro de status subscrito ocorre **na inserção**: se nenhum webhook do `customer_id` quer aquele `to_status`, não insere linha na outbox.

## Alternativas Consideradas

### Renderizar payload no envio (lazy)

Rejeitado. Pedido pode mudar entre inserção e entrega; evento não refletiria o instante da transição.

### Incluir items completos no payload

Rejeitado. Infla tamanho do evento sem necessidade; risco de aproximar limite de 64KB.

### Inserir na outbox e filtrar no worker

Rejeitado. Gera linhas desnecessárias na tabela; filtro na inserção economiza espaço e I/O.

## Consequências

### Positivas

- Semântica clara: payload = foto do momento do evento.
- Worker simplificado (lê payload pronto, assina e envia).
- Menos queries no caminho crítico do worker.

### Negativas

- Payload duplicado no banco (outbox + DLQ em caso de falha).
- Alterações futuras no formato exigem versionamento ou migração de eventos pendentes.
