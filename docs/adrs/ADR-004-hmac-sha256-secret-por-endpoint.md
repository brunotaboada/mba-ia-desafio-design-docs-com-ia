# ADR-004: Autenticação HMAC-SHA256 com Secret por Endpoint

**Status:** Aceito  
**Date:** 07-11-2025  
**Related to:**
- [ADR-005: Garantia At-Least-Once com Identificador de Evento](./ADR-005-at-least-once-x-event-id.md)
- [ADR-007: Snapshot de Payload na Inserção da Outbox](./ADR-007-payload-snapshot-na-insercao.md)

## Contexto e Declaração do Problema

Webhooks outbound expõem dados de pedidos para URLs fora da infraestrutura da plataforma. Clientes B2B precisam validar que cada requisição originou-se genuinamente da plataforma e que o conteúdo não foi adulterado em trânsito.

A engenharia de segurança exige mecanismo de assinatura reconhecido pelo mercado, gestão de credenciais com blast radius limitado e capacidade de rotação sem downtime para o cliente integrador. URLs inseguras e payloads excessivamente grandes representam vetores de risco adicionais.

## Fatores de Decisão

- Autenticidade e integridade verificáveis pelo cliente com bibliotecas padrão.
- Isolamento de credenciais por endpoint cadastrado.
- Capacidade de rotação de secret com período de convivência.
- Transporte criptografado obrigatório.
- Limite de tamanho de payload para detectar anomalias.

## Opções Consideradas

1. **HMAC-SHA256 sobre o corpo da requisição, secret única por endpoint, rotação com grace period de 24 horas** — assinatura enviada em header dedicado; TLS obrigatório.
2. **Secret global compartilhada por toda a plataforma** — uma credencial para todos os clientes.
3. **Assinatura assimétrica com par de chaves pública/privada** — cliente valida com chave pública da plataforma.

## Resultado da Decisão

**Opção escolhida:** HMAC-SHA256 com secret única por endpoint e rotação com grace period de vinte e quatro horas, porque equilibra segurança, simplicidade de integração e práticas de mercado adotadas por provedores de referência.

A plataforma gera a secret na criação do endpoint e a entrega uma única vez. Na rotação, a secret anterior permanece válida por vinte e quatro horas em paralelo, permitindo migração gradual no lado do cliente. Apenas URLs HTTPS são aceitas no cadastro. Payloads acima de sessenta e quatro kilobytes são rejeitados sem truncamento.

Headers de entrega incluem identificadores de evento, assinatura, timestamp e endpoint, além do tipo de conteúdo JSON.

## Prós e Contras das Opções

### HMAC-SHA256 com secret por endpoint

- **Prós:** Amplamente suportado; blast radius limitado por vazamento; rotação com grace period reduz downtime; validação simples no cliente.
- **Contras:** Cliente deve armazenar secret com segurança; lógica de duas secrets ativas durante rotação; revisão de segurança obrigatória antes do deploy.

### Secret global da plataforma

- **Prós:** Gestão centralizada única; integração inicialmente mais simples.
- **Contras:** Vazamento compromete todos os clientes; inaceitável para dados de pedidos B2B.

### Assinatura assimétrica

- **Prós:** Secret não compartilhada com cliente; modelo robusto para alguns cenários.
- **Contras:** Complexidade de gestão de chaves; bibliotecas e documentação menos uniformes entre clientes B2B; desproporcional para o escopo atual.

## Consequências

O módulo de webhooks incorpora geração segura de secrets, validação de URL e assinatura no worker de entrega. Clientes assumem responsabilidade de verificação HMAC e armazenamento seguro de credenciais.

Truncar payloads grandes foi explicitamente descartado — tamanho anômalo indica erro de sistema. A decisão complementa ADR-005 quanto aos headers de identificação de evento na entrega.

## Referências

- src/middlewares/auth.middleware.ts:1
- src/shared/logger/index.ts:1
- src/modules/orders/order.service.ts:50
