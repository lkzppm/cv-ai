# 05 — Roadmap e status

## Status em 2026-10-03

- [x] Scaffold Next.js 16 + Tailwind 4 + shadcn (radix) + AI Elements
- [x] Agente `ToolLoopAgent` com Groq, streaming para `useChat`
- [x] Skills: `role_matcher` (browser_search em rodadas), `format_checker`, `cv_scorer`, `cv_editor`
- [x] UI 3 colunas, sessões persistidas, CV editável, upload PDF (unpdf + conversão para Markdown), export .md / print
- [x] Fundo WebGPU: fluido interativo do vgpu (`.wgsl` tipados) com fallback CSS; tema escuro padrão + claro
- [x] Redesign v2 (2026-10-03): paleta Obsidian, painéis glass, toolbar em pílula, animações motion, skills sem botões
- [x] `pnpm build` passando
- [ ] **Testar com uma chave Groq real** (fluxo end-to-end das 4 skills) — próximo passo obrigatório
- [x] Lint e `tsc` sem erros (AI Elements gerados são ignorados pelo ESLint)

## Próximos passos sugeridos

1. **Drawer da sidebar em telas < lg** (hoje fica oculta).
2. **Diff visual** no card do `cv_editor` (antes/depois por linha).
3. **Exportar PDF com layout** (ex.: `@react-pdf/renderer` ou print CSS mais refinado).
4. **Persistência real** (Postgres + Drizzle) e login — permitiria compartilhar sessões.
5. **Avaliação das skills**: conjunto de CVs de teste + notas esperadas; medir estabilidade do `cv_scorer` (repetir 5x e ver variância).
6. **Skill `cover_letter`** e **skill `interview_prep`** (gera perguntas prováveis a partir da vaga).
7. **Rate limiting** no `/api/chat` antes de publicar.

## Riscos conhecidos

- LinkedIn bloqueia fetch direto; a skill depende do `browser_search` conseguir achar a vaga pelo título/URL. Links do Gupy/Greenhouse costumam abrir.
- `generateObject` com schemas grandes pode falhar em modelos menores; o `openai/gpt-oss-120b` tem se mostrado estável.
- Groq free tier tem limites de tokens/min; `role_matcher` faz 2 buscas + 1 síntese por vaga.
