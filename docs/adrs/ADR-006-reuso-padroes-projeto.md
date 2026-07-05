# ADR-006: Reuso dos Padrões Existentes do Projeto

**Status:** Aceito  
**Date:** 07-11-2025  
**Related to:**
- [ADR-001: Padrão Outbox no MySQL](./ADR-001-outbox-no-mysql.md)
- [ADR-002: Worker em Processo Separado com Polling](./ADR-002-worker-polling-processo-separado.md)

## Contexto e Declaração do Problema

O OMS segue estrutura modular consistente: cada domínio de negócio organiza camadas de apresentação, regras, persistência, rotas e validação em diretório próprio sob módulos. Erros tipados, logging estruturado, middleware centralizado de exceções e controle de acesso por papel já estão estabelecidos e em uso.

O módulo de webhooks de notificação de pedidos deve integrar-se sem introduzir frameworks paralelos ou convenções divergentes, facilitando manutenção pelo time atual e revisão de código alinhada ao restante da codebase.

## Fatores de Decisão

- Consistência arquitetural com módulos existentes de pedidos, clientes e produtos.
- Curva de aprendizado zero para engenheiros do time.
- Reaproveitamento de infraestrutura transversal já validada em produção.
- Evitar dependências externas de fila que contradizem ADR-001.
- Prefixo de códigos de erro identificável por domínio.

## Alternativas Consideradas

1. **Novo módulo seguindo convenções existentes** — mesma organização em camadas, erros tipados com prefixo de domínio, logger e middlewares sem alteração.
2. **Biblioteca externa de filas e workers** — abstração dedicada para processamento assíncrono.
3. **Módulo monolítico sem separação de camadas** — implementação concentrada em poucos arquivos.

## Decisão

**Opção escolhida:** Novo módulo sob a mesma estrutura modular dos demais domínios, reutilizando erros tipados, logger estruturado, middleware de exceções, autenticação com controle de papel e validação declarativa, porque preserva homogeneidade da codebase e reduz superfície de mudanças em componentes transversais.

Códigos de erro do domínio usam prefixo dedicado para distinguir falhas de webhook de erros de pedidos ou estoque. O worker segue padrão de entry-point similar ao da API principal. A integração com mudança de status de pedidos ocorre na mesma transação de banco (ADR-001), invocando publicação de evento sem acoplar repositórios inteiros entre domínios.

## Prós e Contras das Opções

### Módulo com convenções existentes

- **Prós:** Familiaridade imediata; error handling e logging funcionam sem mudanças; testes seguem mesmos padrões; revisão de código uniforme.
- **Contras:** Domínio de pedidos ganha dependência leve da publicação de eventos; novos códigos de erro precisam documentação no FDD.

### Biblioteca externa de filas

- **Prós:** Abstrações prontas para retry e scheduling.
- **Contras:** Introduz Redis e stack diferente; contradiz outbox no MySQL; aumenta superfície operacional.

### Módulo monolítico

- **Prós:** Menos arquivos inicialmente.
- **Contras:** Quebra consistência com orders e customers; dificulta manutenção e testes isolados.

## Consequências

### Positivas

- Curva de aprendizado zero para engenheiros já familiarizados com o OMS.
- Error handling, logging e autenticação funcionam sem alteração nos middlewares transversais.
- Code review e testes seguem os mesmos padrões dos módulos existentes.
- Ancora worker (ADR-002) e integração transacional (ADR-001) em convenções já validadas.

### Negativas

- Domínio de pedidos ganha dependência leve da publicação de eventos de webhook.
- Códigos de erro com prefixo `WEBHOOK_` precisam ser catalogados no FDD para evitar colisão semântica.
- Módulo novo ainda exige modelagem de persistência e worker, apesar do reuso de padrões.

## Referências

- src/modules/orders/order.service.ts:1
- src/shared/errors/app-error.ts:1
- src/shared/errors/http-errors.ts:1
- src/middlewares/error.middleware.ts:14
- src/shared/logger/index.ts:1
