# ADR-004: Autenticação HMAC-SHA256 com Secret por Endpoint

## Status

Aceito

## Contexto

Webhooks outbound expõem dados de pedidos para URLs fora da infraestrutura da plataforma. Clientes precisam validar autenticidade e integridade do payload. A engenharia de segurança definiu requisitos de assinatura e gestão de secrets.

## Decisão

- Assinar o **corpo JSON** da requisição com **HMAC-SHA256**.
- Enviar assinatura no header `X-Signature`.
- **Secret única por endpoint** de webhook (não secret global da plataforma).
- Tabela de configuração armazena: `url`, `secret`, `customer_id`, estado ativo, lista de status subscritos.
- Secret **gerada pela plataforma** na criação (`POST`); devolvida uma única vez na resposta.
- **Rotação de secret** via endpoint dedicado: secret antiga permanece válida por **24 horas** em paralelo (grace period para migração do cliente).
- **TLS obrigatório**: URLs devem ser `https`; cadastro com `http` rejeitado na validação Zod.
- Limite de payload: **64KB**; ultrapassar gera erro (não truncar).
- Headers de entrega: `X-Event-Id`, `X-Signature`, `X-Timestamp`, `X-Webhook-Id`, `Content-Type: application/json`.

## Alternativas Consideradas

### Secret global da plataforma

Rejeitado. Vazamento de uma secret comprometeria todos os clientes.

### Assinatura assimétrica (RSA/ECDSA)

Não adotado nesta fase. HMAC-SHA256 é padrão de mercado (Stripe, GitHub) e todas as bibliotecas dos clientes suportam.

### Truncar payload acima de 64KB

Rejeitado. Payload nesse tamanho indica problema; melhor falhar explicitamente.

## Consequências

### Positivas

- Cliente valida origem e integridade com bibliotecas padrão.
- Blast radius limitado por endpoint em caso de vazamento.
- Grace period de rotação evita downtime na migração.

### Negativas

- Responsabilidade de armazenar secret com segurança no lado do cliente.
- Lógica de rotação com duas secrets ativas aumenta complexidade de verificação no worker.
- Revisão de segurança obrigatória antes do deploy (2 dias úteis reservados para Sofia).
