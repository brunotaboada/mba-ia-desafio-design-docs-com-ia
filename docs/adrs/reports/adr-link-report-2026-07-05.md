# ADR Relationship Analysis Report

**Gerado em:** 2026-07-05  
**Diretório analisado:** `docs/adrs/`  
**ADRs processados:** 7

## Resumo

| Métrica | Valor |
| --- | --- |
| ADRs analisados | 7 |
| Relacionamentos detectados | 10 pares |
| ADRs com cabeçalho atualizado | 7 |
| Links validados | 20 (todos com alvo existente) |
| Supersedes / Amends | 0 (mesma data, sem evolução temporal) |

## Relacionamentos detectados

### Depends on / Used by

| Origem | Relação | Destino | Evidência |
| --- | --- | --- | --- |
| ADR-002 | Depends on | ADR-001 | Contexto: "padrão outbox adotado (ADR-001)" |
| ADR-001 | Used by | ADR-002 | Bidirecional |
| ADR-003 | Depends on | ADR-002 | Contexto: "worker (ADR-002) precisa tratar falhas" |
| ADR-002 | Used by | ADR-003 | Bidirecional |
| ADR-007 | Depends on | ADR-001 | Contexto: "Eventos na outbox (ADR-001)" |
| ADR-001 | Used by | ADR-007 | Bidirecional |

### Related to (bidirecional)

| Par | Evidência |
| --- | --- |
| ADR-003 ↔ ADR-005 | Replay e retries geram entregas duplicadas (at-least-once) |
| ADR-004 ↔ ADR-005 | Headers de assinatura e identificação complementares |
| ADR-004 ↔ ADR-007 | Limite 64KB citado em ambos |
| ADR-002 ↔ ADR-006 | Worker segue padrão de entry-point do projeto |
| ADR-001 ↔ ADR-006 | Integração transacional ancora padrões existentes |

## Cadeia de dependências

```
ADR-001 (Outbox)
  ├── ADR-002 (Worker) ── ADR-003 (Retry/DLQ) ── ADR-005 (At-least-once)
  └── ADR-007 (Snapshot) ── ADR-004 (HMAC)
ADR-006 (Padrões) ── relacionado a ADR-001, ADR-002
```

## Validação

- Links quebrados: 0
- Dependências circulares: 0
- Conflitos de tipo (Supersedes + Depends): 0
- Limite de 3 Depends on por ADR: respeitado
- Limite de 3 Related to por ADR: respeitado

## Warnings

Nenhum.
