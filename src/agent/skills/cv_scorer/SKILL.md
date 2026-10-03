---
name: cv_scorer
description: Faz uma análise profunda do CV com uma rubrica de 6 dimensões (impacto, clareza, relevância para o cargo, estrutura, keywords/ATS, consistência) e devolve nota 0–100 com justificativas, pontos fortes, fracos e plano de melhoria priorizado.
---

## Rubrica (pesos)
| Dimensão | Peso | O que avaliar |
|---|---|---|
| Impacto | 25 | Resultados mensuráveis, escopo, responsabilidade real, progressão |
| Clareza | 15 | Frases curtas, sem jargão vazio, fácil de escanear em 6 segundos |
| Relevância | 20 | Alinhamento ao cargo-alvo (se informado) ou à trajetória evidente |
| Estrutura | 15 | Ordem das seções, hierarquia visual, tamanho |
| Keywords/ATS | 15 | Termos técnicos e de domínio que um ATS procuraria |
| Consistência | 10 | Datas, tempos verbais, formatação uniforme, sem erros |

## Faixas
- 85–100: pronto para enviar a vagas competitivas
- 70–84: bom, com ajustes pontuais
- 50–69: precisa de revisão estrutural
- < 50: reescrever com apoio do `cv_editor`

## Como apresentar
- Nota geral em destaque + 1 frase de diagnóstico.
- Tabela por dimensão com justificativa curta.
- Plano de melhoria em ordem de prioridade (máx. 5 itens), cada um com a seção afetada.
- Se o usuário tiver uma vaga-alvo, chame antes `role_matcher` e use as keywords na dimensão Relevância.
