# 01 — Arquitetura

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, React 19.2) | Última versão estável em 2026-10; route handlers para a API do agente |
| LLM | Groq API via `@ai-sdk/groq` | Exigência do trabalho; inferência muito rápida; `openai/gpt-oss-120b` tem tool calling + reasoning + `browser_search` nativo |
| Agente | Vercel AI SDK 7 (`ai`, `@ai-sdk/react`) | `ToolLoopAgent`, streaming de UI messages, tipagem das tools de ponta a ponta |
| UI | Tailwind v4 + shadcn/ui (radix) + **AI Elements** | Componentes prontos de chat (Conversation, Message, PromptInput, Tool, Reasoning) |
| Efeito visual | **vgpu** (WebGPU, vercel-labs) + **motion** | Fundo "aurora" com ruído fBm da stdlib WGSL; fallback CSS. Transições de UI com motion |
| Estado | zustand + persist (localStorage) | Sessões/CV/mensagens sem backend |
| PDF | unpdf | Extrai texto de PDF em Node/serverless |

## Fluxo de uma mensagem

```
[PromptInput] ──sendMessage({text})──▶ POST /api/chat  { messages, cv }
                                            │
                                   createCvAgent({ cv })
                                   ToolLoopAgent(model=Groq, tools=skills(cv), instructions=buildInstructions(cv))
                                            │  agent.stream()  (até 8 passos)
                                            ▼
                     ┌────── tool call: cv_scorer / format_checker / role_matcher / cv_editor ──────┐
                     │  (execute roda no servidor; pode chamar Groq de novo p/ generateObject / search) │
                     └──────────────────────────────────────────────────────────────────────────────┘
                                            │
                        toUIMessageStream → createUIMessageStreamResponse (SSE)
                                            ▼
[useChat] recebe parts: text | reasoning | tool-<skill> (input-streaming → input-available → output-available)
[AgentSidebar] renderiza cada part; tool-cv_editor mostra card "Aplicar" → store.setCv(newCv)
```

O CV **nunca** vai no histórico de mensagens: ele é enviado no `body` de cada request (lido da store na hora do envio) e injetado no system prompt + fechado nas tools. Assim, edições feitas no painel valem imediatamente.

## Árvore de pastas

```
src/
  agent/
    index.ts            createCvAgent(ctx) + tipo CvAgentUIMessage
    models.ts           provider Groq, ids de modelo (env)
    prompts.ts          buildInstructions(cv) — system prompt com os SKILL.md
    skills/
      registry.ts       loadSkillDoc(name) lê SKILL.md (frontmatter + corpo)
      index.ts          createSkills(ctx) → { role_matcher, format_checker, cv_scorer, cv_editor }
      <skill>/SKILL.md  conhecimento
      <skill>/index.ts  tool({ description, inputSchema, execute })
  app/
    api/chat/route.ts       stream do agente
    api/parse-cv/route.ts   PDF/TXT → texto → Markdown (via modelo)
    layout.tsx · page.tsx · globals.css (tokens LinkedIn)
  components/
    ai-elements/   gerados pelo CLI do AI Elements (não editar à mão; re-adicionar com -o)
    ui/            shadcn (radix)
    ambient/       vgpu: aurora/ (aurora.wgsl + aurora.ts) e ambient-canvas.tsx (fallback CSS)
    workspace/     app-shell, sessions-rail, cv-panel, cv-markdown, agent-sidebar, tool-cards/*
  lib/
    cv/parse.ts    parser heurístico (seções, bullets, contato, métricas)
    cv/sample.ts   CV de exemplo para sessões novas
    store/sessions.ts  zustand persistido
    web/fetch-page.ts  HTML → texto para links de vaga
spec/              esta pasta
```

## Decisões registradas

- **2026-10-03 — shadcn em modo `radix`**, não `base-ui`: o AI Elements (prompt-input, hover-card) é escrito contra a API radix; com base-ui havia erros de tipo. `components.json` usa `"style": "radix-nova"` e o pacote `radix-ui`.
- **2026-10-03 — web search via built-in tool da Groq** (`groq.tools.browserSearch`) em vez de Tavily/Serper: zero chaves extras. Limitação: só nos modelos `openai/gpt-oss-*`. Se trocar `GROQ_SEARCH_MODEL` por outro modelo, a skill `role_matcher` perde a busca.
- **2026-10-03 — `cv_editor` recebe o CV inteiro como *input* da tool** (o modelo escreve o Markdown). Mais simples que diffs e permite preview/aplicar/desfazer no cliente.
- **SKILL.md lido do disco** (`process.cwd()/src/agent/skills`). `next.config.ts` inclui esses arquivos no tracing do `/api/chat` para deploy serverless.
- **2026-10-03 — sem botões de skill na UI.** O agente decide quando invocar cada skill (prompt reforça: pedidos amplos → format_checker + cv_scorer; link → role_matcher; "mude/reescreva" → cv_editor). Mantém o foco do trabalho em *agente que usa skills*, não em formulários.
- **2026-10-03 — paleta "Azure"** (azul único, dark por padrão, painéis glass). A v2 "Obsidian" (íris/aqua/magenta) com fundo de fluido foi revertida por ser agressiva demais; o fundo agora é uma aurora fBm lenta (`.wgsl` tipado com `@vgpu/wgsl-std`).
- **Sem banco de dados**: trabalho acadêmico; `localStorage` basta. Migrar para Postgres/Drizzle está no roadmap.
