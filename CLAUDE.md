@AGENTS.md

# CV Agent — guia para sessões do Claude Code

Agente de IA que analisa currículos usando skills. Trabalho da disciplina de Inteligência Artificial.
**Leia `spec/README.md` primeiro**; ele indexa a base de conhecimento (visão, arquitetura, skills, UI, versões, roadmap).

## Comandos
- `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm exec tsc --noEmit`
- Precisa de `.env.local` com `GROQ_API_KEY` (veja `.env.example`).

## Regras do repo
- Next.js 16 + AI SDK 7: as APIs mudaram em relação ao treinamento. Consulte `node_modules/next/dist/docs/` e os `.d.ts` de `ai` antes de usar uma API que você "lembra".
- `src/components/ai-elements/**` e `src/components/ui/**` são gerados por CLI (`ai-elements` / `shadcn`). Não edite à mão; re-adicione com `-o`. O ESLint ignora `ai-elements/`.
- shadcn está em modo **radix** (`components.json` → `radix-nova`, pacote `radix-ui`). Não troque para base-ui: quebra o AI Elements.
- Uma skill = `src/agent/skills/<nome>/SKILL.md` + `index.ts` + card em `components/workspace/tool-cards/` + `case` em `agent-sidebar.tsx`. Passo a passo em `spec/02-agent-and-skills.md`.
- Skills são carregadas sob demanda via `load_skill` (`prepareStep` → `activeTools`); todo `execute` começa com `requireLoaded(ctx, "<nome>")`. Teste sem navegador: `pnpm smoke <cenário>` / `pnpm skill <nome> '<json>'`.
- O CV vai no `body` de cada request (`cv`), nunca no histórico de mensagens.
- Idioma da UI, prompts e docs: português do Brasil. Código e identificadores: inglês.
- Commits: conventional commits (`feat:`, `fix:`, `docs:`…).

## Ao mudar uma decisão de arquitetura
Atualize o arquivo correspondente em `spec/` com data absoluta, e o `spec/05-roadmap.md`.
