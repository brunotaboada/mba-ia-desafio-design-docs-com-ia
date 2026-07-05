# ADR-007: Snapshot de Payload na Inserção da Outbox

**Status:** Aceito  
**Date:** 07-11-2025  
**Depends on:** [ADR-001: Padrão Outbox no MySQL](./ADR-001-outbox-no-mysql.md)  
**Related to:** [ADR-004: Autenticação HMAC-SHA256 com Secret por Endpoint](./ADR-004-hmac-sha256-secret-por-endpoint.md)

## Contexto e Declaração do Problema

Eventos na outbox (ADR-001) precisam de conteúdo para entrega HTTP aos clientes. Uma abordagem alternativa seria montar o payload no momento do envio, consultando novamente o estado atual do pedido no banco.

Porém o pedido pode sofrer alterações após a transição de status — campos auxiliares, ajustes futuros — gerando inconsistência entre o instante do evento de negócio e o conteúdo entregue ao cliente. O time também precisa evitar inserir eventos para combinações pedido-status sem assinantes configurados.

## Fatores de Decisão

- Fidelidade do payload ao instante da transição de status.
- Simplicidade do caminho crítico do worker de entrega.
- Tamanho enxuto do evento para respeitar limites de segurança (ADR-004).
- Eficiência de armazenamento na store de eventos.
- Filtragem antecipada por status subscrito por cliente.

## Opções Consideradas

1. **Snapshot JSON persistido na inserção** — payload renderizado na transação, incluindo metadados do pedido sem itens de linha; filtro de assinatura aplicado antes de inserir.
2. **Renderização lazy no envio** — worker consulta pedido atual e monta payload na hora da entrega.
3. **Inserção incondicional com filtro no worker** — todas as transições geram linha na store; worker descarta não assinados.

## Resultado da Decisão

**Opção escolhida:** Snapshot JSON persistido no momento da inserção na outbox, porque garante que o evento reflete o estado do pedido no instante da transição, independentemente de alterações posteriores.

O payload inclui identificador de evento, tipo de evento de mudança de status, timestamp ISO 8601, identificadores e número do pedido, status origem e destino, cliente e valor total — sem itens de linha, mantendo envelope enxuto. Cliente que necessitar detalhes complementares consulta API de pedidos existente. Se nenhum endpoint do cliente assina o status destino, nenhuma linha é inserida na store.

## Prós e Contras das Opções

### Snapshot na inserção

- **Prós:** Semântica clara de instante do evento; worker lê e envia sem consultas adicionais; filtro na inserção economiza armazenamento.
- **Contras:** Duplicação de payload em store ativa e dead letter; evolução de formato exige versionamento ou migração de pendentes.

### Renderização lazy no envio

- **Prós:** Payload sempre reflete estado mais recente do pedido.
- **Contras:** Estado recente pode divergir do instante da transição; consultas extras no worker; semântica ambígua para o cliente.

### Inserção incondicional com filtro no worker

- **Prós:** Lógica de filtro concentrada no consumidor.
- **Contras:** Linhas desnecessárias na store; I/O e armazenamento desperdiçados; processamento de eventos sem destinatário.

## Consequências

A store de eventos armazena conteúdo serializado além de metadados de controle. Mudanças futuras no esquema do payload demandam estratégia de compatibilidade para eventos pendentes.

A exclusão de itens de linha reduz tamanho e aproximação ao limite de sessenta e quatro kilobytes definido em ADR-004. Esta decisão complementa ADR-001 ao definir o que exatamente é persistido transacionalmente junto à mudança de status.

## Referências

- src/modules/orders/order.service.ts:158
- src/modules/orders/order.status.ts:3
- prisma/schema.prisma:74
