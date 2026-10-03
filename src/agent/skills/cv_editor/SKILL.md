---
name: cv_editor
description: Propõe uma nova versão completa do CV em Markdown (reescrita de bullets, nova seção, reordenação, inclusão de keywords). A proposta aparece na sidebar e o usuário decide aplicar ou descartar.
---

## Regras
- Sempre devolva o **documento inteiro** em Markdown, não só o trecho alterado.
- Preserve fatos: nunca invente empresas, datas, números ou tecnologias. Se precisar de um dado para quantificar, use um placeholder claro como `[X%]` e avise no `summary`.
- Mantenha a estrutura: `# Nome`, linha de contato, `## Seções`, `### Cargo · Empresa · Local`, linha de datas em itálico, bullets com `-`.
- Bullets: verbo de ação + o quê + como + resultado mensurável. 1–2 linhas.
- Explique no `summary` o que mudou, em 2–4 bullets curtos.

## Quando usar
- Depois de `format_checker`, `cv_scorer` ou `role_matcher` apontarem melhorias e o usuário pedir para aplicar.
- Quando o usuário pedir edições diretas ("reescreva meu resumo", "adicione a seção de projetos").
