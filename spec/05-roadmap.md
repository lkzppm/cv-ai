# 05 — Roadmap e status

## Status em 2026-10-03

- [x] Scaffold Next.js 16 + Tailwind 4 + shadcn (radix) + AI Elements
- [x] Agente `ToolLoopAgent` com Groq, streaming para `useChat`
- [x] Skills: `role_matcher` (browser_search em rodadas), `format_checker`, `cv_scorer`, `cv_editor`
- [x] UI 3 colunas, sessões persistidas, CV editável, upload PDF (unpdf + conversão para Markdown), export .md / print
- [x] Fundo WebGPU "papers" (folhas de CV esboçadas em SDF, vgpu + `@vgpu/wgsl-std`) com fallback CSS; tema escuro padrão + claro
- [x] Redesign v2 → v3 (2026-10-03): painéis glass, toolbar em pílula, animações motion, skills sem botões; paleta final "Azure" (azul); fundo evoluiu fluido → aurora → papers (v4)
- [x] `pnpm build` passando
- [x] **Testado com chave Groq real** (2026-10-03): 4 skills + 7 cenários via `pnpm smoke`. Bugs corrigidos: `null` em inputs opcionais (`.nullish()`), schema do `cv_scorer` rejeitado pelo structured output estrito (`.nullable()`), modelo inventava nota quando a skill falhava (regra no prompt), `###` contado como seção no parser, resposta do `cv_editor` mandava "copiar" em vez de clicar em Aplicar. Latência dominada pelo rate limit de 8k tokens/min: prompt do agente enxugado (8,6k → 6,1k chars) e `toModelOutput` nas 4 tools (13k → 8k chars no passo final; cenário "nota" 125 s → 57 s).
- [x] Lint e `tsc` sem erros (AI Elements gerados são ignorados pelo ESLint)

## Status em 2026-10-04

- [x] Branches `main` ← `dev` ← `feat/*`; CI no GitHub Actions (lint, `next typegen` + tsc, build) em push/PR para `main` e `dev`. Deploy futuro: Vercel.
- [x] **Tools interativas com o CV** (`feat/cv-highlights`): cada tool devolve `CvRef[]` e o painel desenha retângulos tracejados nas partes citadas (várias ao mesmo tempo); hover/clique no card foca um item; fixação automática ao terminar a tool. `format_checker` passou a avaliar verbo de ação/quantificação só nos bullets de experiência/projetos.
- [x] **Upload de PDF do Canva** (`fix/pdf-extraction`): extração ordenada por layout e conversão no 120b com reasoning baixo; antes o CV ficava vazio.
- [x] **Homepage sem sessão** (`fix/home-empty-state`): três formas de começar (enviar, colar, exemplo); corrige o `TypeError` de `session.cv` ao excluir a última sessão.
- [x] **Revisão do `cv_editor` em diff** (`feat/edit-review`): antes/depois por bloco dentro do painel, aceitar/recusar por bloco e no total; clicar numa marcação do CV leva ao item no chat.

## Próximos passos sugeridos

1. **Drawer da sidebar em telas < lg** (hoje fica oculta).
2. **Diff por palavra** dentro de um bloco do `cv_editor` (hoje o diff é por linha; um bullet reescrito aparece inteiro riscado + inteiro novo).
3. **Exportar PDF com layout** (ex.: `@react-pdf/renderer` ou print CSS mais refinado).
4. **Persistência real** (Postgres + Drizzle) e login — permitiria compartilhar sessões.
5. **Avaliação das skills**: conjunto de CVs de teste + notas esperadas; medir estabilidade do `cv_scorer` (repetir 5x e ver variância).
6. **Skill `cover_letter`** e **skill `interview_prep`** (gera perguntas prováveis a partir da vaga).
7. **Rate limiting** no `/api/chat` antes de publicar.
8. **Reforçar o protocolo no 20b**: sem o gate de `activeTools`, o gpt-oss-20b às vezes chamava a tool sem carregar e, ao receber o erro, respondia em texto em vez de corrigir. O gate resolve; vale manter o teste `pnpm smoke edit` como regressão.
9. **Destaques**: a resposta em texto do agente não gera refs (só as tools). Uma tool leve `point_to({ quotes })` deixaria o modelo apontar trechos ao conversar.
10. **Latência no free tier**: cache do resultado do `format_checker` por hash do CV (evita recomputar quando o usuário só pede a nota em seguida) e/ou Dev Tier da Groq.

## Riscos conhecidos

- LinkedIn bloqueia fetch direto; a skill depende do `browser_search` conseguir achar a vaga pelo título/URL. Links do Gupy/Greenhouse costumam abrir.
- `generateObject` com schemas grandes falha em modelos menores (20b gerou string onde o schema pede inteiro); por isso as skills ficam no `openai/gpt-oss-120b` e só o agente roda no 20b.
- Groq free tier tem limites de tokens/min; `role_matcher` faz 2 buscas + 1 síntese por vaga.
