---
name: format_checker
description: Verifica se o CV segue os padrões reconhecidos pelo mercado (modelo Harvard/reverse-chronological, compatibilidade com ATS, 1–2 páginas, bullets com verbo de ação + resultado quantificado) e devolve um checklist pass/warn/fail.
---

## Padrões de referência
- **Harvard / Reverse-chronological:** nome + contato no topo; resumo opcional de 2–3 linhas; experiência do mais recente para o mais antigo; educação; habilidades. Sem foto, sem idade/estado civil (padrão internacional).
- **ATS-friendly:** uma coluna, títulos de seção convencionais (Experiência, Educação, Habilidades), sem tabelas/ícones, keywords literais da vaga, datas no formato `Mês AAAA – Mês AAAA`.
- **Tamanho:** 1 página até ~5 anos de experiência; 2 páginas no máximo. ~400–700 palavras.
- **Bullets:** começam com verbo de ação, 1–2 linhas, com resultado mensurável (%, R$, tempo, volume). Fórmula: *Verbo + o quê + como + resultado*.
- **Consistência:** mesmo formato de datas, pontuação e tempo verbal (passado para empregos anteriores).
- **Contato:** e-mail profissional, telefone, LinkedIn; cidade/estado basta.
- **Sem primeira pessoa:** evitar "eu", "meu", "I", "my".

## Como funciona
1. Checagens determinísticas (código): seções presentes, contato, contagem de palavras/páginas, datas, verbos de ação, quantificação, primeira pessoa.
2. Avaliação qualitativa (LLM): clareza dos títulos, ordem das seções, consistência de formato, redundâncias.

## Como apresentar
- Mostre primeiro os itens `fail`, depois `warn`. Explique *por que* cada padrão importa em uma frase.
- Termine com as 3 correções de maior impacto e ofereça aplicar via `cv_editor`.
