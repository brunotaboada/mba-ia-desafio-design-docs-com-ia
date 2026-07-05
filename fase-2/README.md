# Changeset da Fase 2 — gatilho da documentação viva

Este diretório é usado **na Parte 2** do desafio. Ele fornece uma mudança de
código pronta para você aplicar e, com ela, demonstrar que o seu mecanismo de
**documentação viva** detecta alterações no código e atualiza os documentos
afetados.

> A Parte 1 do desafio é puramente documental e não toca no código. Aplicar este
> changeset é uma exceção controlada e sancionada, exclusiva da Parte 2.

## O que o changeset muda

O arquivo `order-status-change.patch` altera a máquina de estados de pedidos em
`src/modules/orders/order.status.ts`:

1. Passa a permitir a transição `SHIPPED → CANCELLED` (hoje um pedido enviado não
   pode ser cancelado).
2. Ajusta `shouldReplenishStock` para também repor o estoque quando um pedido é
   cancelado a partir de `SHIPPED`.

É uma mudança pequena e realista, mas que **repercute na documentação da feature
de webhooks**: a lista de transições que disparam eventos muda, os fluxos do FDD
mudam, o ADR da máquina de estados é afetado e os exemplos de payload ganham um
novo par `from_status` → `to_status`. Exatamente o tipo de drift que a
documentação viva precisa capturar.

## Como aplicar

A partir da raiz do repositório, com a Parte 1 já concluída e a documentação em
HTML já gerada (com o hash atual registrado):

```bash
git apply fase-2/order-status-change.patch
git add -A
git commit -m "feat: allow cancelling shipped orders"
```

Em seguida, rode o seu mecanismo de auto-atualização e registre o resultado
(antes/depois) no README do processo, conforme os critérios de aceite da Parte 2.
