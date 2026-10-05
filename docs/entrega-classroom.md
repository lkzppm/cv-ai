# EEL874 — Inteligência Artificial · Criação de Agente

**Aluno:** Lucas Pacheco
**Trabalho:** Criação de Agente — "Construa passo a passo a implementação de um agente que analise currículos e que use skills para esta tarefa. Mostre o código e os softwares a serem instalados e usados."

- **Aplicação no ar:** https://cvagent-ufrj.vercel.app
- **Código-fonte:** https://github.com/lkzppm/cv-ai
- **Passo a passo completo (README):** https://github.com/lkzppm/cv-ai#readme

## O que foi construído

O **CV Agent** é uma aplicação web em que um agente de IA (`ToolLoopAgent` do Vercel AI SDK, rodando modelos `gpt-oss` na Groq) analisa currículos usando quatro *skills*. Cada skill é um par **`SKILL.md`** (conhecimento em linguagem natural: regras, rubrica, como apresentar) + **`index.ts`** (tool executável com schema `zod`). O agente decide sozinho qual skill usar, carrega o `SKILL.md` sob demanda (`load_skill`) e só então executa a tool — os dois momentos aparecem no chat.

| Skill | O que faz |
|---|---|
| `role_matcher` | lê links de vagas ou um cargo-alvo, faz rodadas de web search e mede a aderência do CV |
| `format_checker` | confere padrões de mercado e compatibilidade com ATS (checklist pass/warn/fail) |
| `cv_scorer` | nota 0–100 com rubrica de 6 dimensões ponderadas e plano de melhoria |
| `cv_editor` | propõe o CV reescrito; o usuário revisa em diff e aceita bloco a bloco |

Diferenciais: as tools apontam no documento os trechos que citam (retângulos tracejados), a proposta de edição vira um diff com aceitar/recusar por bloco, e há histórico de versões navegável com diff e restauração. Importação de PDF, exportação em Markdown e impressão.

## Passo a passo (resumo do README)

1. **Instalar:** Node.js 22+, pnpm, Git; criar uma chave gratuita em https://console.groq.com/keys.
2. **Criar o projeto:** `pnpm create next-app` (App Router, TypeScript, Tailwind 4) e adicionar `ai`, `@ai-sdk/groq`, `@ai-sdk/react`, `zod`; componentes de UI via `shadcn` e `ai-elements`.
3. **O agente** (`src/agent/index.ts`): `ToolLoopAgent` com o modelo da Groq, o system prompt que lista as skills (nome, descrição e quando usar) e as tools; limite de passos e streaming para o `useChat`.
4. **Uma skill** (`src/agent/skills/<nome>/`): `SKILL.md` com o conhecimento + `index.ts` com `tool({ inputSchema: z.object(...), execute })`; registro em `src/agent/skills/index.ts`.
5. **Carregamento progressivo:** a tool `load_skill` devolve o `SKILL.md` completo; o agente o lê antes de executar a skill.
6. **A interface:** painel do CV (Markdown editável, importação de PDF), chat com cards por skill (`src/components/workspace/`), sessões persistidas no navegador.
7. **Rodar:** `pnpm install`, copiar `.env.example` para `.env.local` com a `GROQ_API_KEY`, `pnpm dev`. Testes sem navegador: `pnpm smoke <cenário>` e `pnpm skill <nome> '<json>'`.

## Softwares e bibliotecas

- **Ferramentas:** Node.js 22+, pnpm, Git, VS Code, conta na Groq (chave de API gratuita), Vercel (deploy).
- **Agente:** Vercel AI SDK 7 (`ai`, `@ai-sdk/groq`, `@ai-sdk/react`), `zod`, modelos `openai/gpt-oss-20b` (agente) e `openai/gpt-oss-120b` (skills e web search).
- **Aplicação:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui + AI Elements, `react-markdown`, `unpdf` (PDF), `zustand` (sessões), `motion` (animações), `vgpu` (fundo em WebGPU).
- **Qualidade:** ESLint, TypeScript, GitHub Actions (lint, tipos e build em cada PR).

## Como testar em 2 minutos

Abra https://cvagent-ufrj.vercel.app, clique em **Testar com um exemplo** e envie no chat:

1. "Analise meu CV" → `format_checker` (+ destaques no documento)
2. "Dê uma nota ao meu currículo" → `cv_scorer`
3. "Compare com esta vaga: <link>" → `role_matcher`
4. "Reescreva meu resumo profissional" → `cv_editor` (diff com aceitar/recusar)
