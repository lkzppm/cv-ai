# CV Agent — agente de IA que analisa currículos usando *skills*

> Trabalho da disciplina de **Inteligência Artificial** · *Criação de Agente*
> Enunciado: "Construa passo a passo a implementação de um agente que analise currículos e que use skills para esta tarefa. Mostre o código e os softwares a serem instalados e usados."

Interface no estilo *Claude Design* voltada a currículos: o **CV atual fica no painel principal** (folha flutuante em vidro sobre um fundo WebGPU discreto de currículos esboçados), e uma **sidebar** traz o chat com o agente, os resultados das skills e as propostas de alteração (com botão *Aplicar*). Não há botões de skill: **o agente decide quando invocar cada uma**. Cada **sessão** guarda um CV, seu histórico de versões e a conversa.

```
┌───────────── header ─────────────────────────────────────────────────────────┐
│ sessões │          CV atual (Markdown · editar · PDF · exportar)   │ Agente   │
│         │                                                           │ chat +   │
│         │   ┌──────── folha ────────┐                               │ skills + │
│         │   │ # Nome · contato      │                               │ cards    │
│         │   │ ## Experiência …      │                               │          │
│         │   └───────────────────────┘                               │ [input]  │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Stack

| Camada | Tecnologia |
|---|---|
| Front/Back | **Next.js 16.3** (App Router, Turbopack, React 19) + TypeScript |
| LLM | **Groq API** via `@ai-sdk/groq`: `openai/gpt-oss-20b` no agente, `openai/gpt-oss-120b` nas skills e na busca |
| Agente | **Vercel AI SDK 7** — `ToolLoopAgent`, streaming para `useChat` |
| UI | Tailwind v4 · shadcn/ui · **AI Elements** (componentes de chat da Vercel) |
| Visual | **vgpu** (WebGPU): fundo com folhas de currículo esboçadas (shader `.wgsl` tipado, SDFs + `@vgpu/wgsl-std`) + **motion** para as transições; fallback CSS |
| Estado | zustand + localStorage (sessões) |
| PDF | unpdf |

## As skills do agente

| Skill | O que faz |
|---|---|
| `role_matcher` | Recebe links de vagas (LinkedIn, Gupy…) ou um cargo-alvo, faz **rodadas de web search** (built-in `browser_search` da Groq) e devolve requisitos, keywords de ATS e o % de aderência do CV |
| `format_checker` | Confere o CV contra padrões de mercado (Harvard/reverse-chronological, ATS, tamanho, verbos de ação, resultados quantificados) → checklist pass/warn/fail |
| `cv_scorer` | Análise profunda com rubrica de 6 dimensões ponderadas → **nota 0–100**, pontos fortes/fracos e plano de melhoria |
| `cv_editor` | Propõe o CV inteiro reescrito; o usuário pré-visualiza e aplica (com *desfazer*) |

Cada skill é uma pasta com `SKILL.md` (conhecimento em linguagem natural) e `index.ts` (tool executável com schema `zod`).

**Carregamento progressivo.** O system prompt lista só nome, descrição e "quando usar" de cada skill. Quando o agente decide usar uma, ele chama `load_skill({ names })`, que devolve o `SKILL.md` completo (regras, rubrica, como apresentar); só depois a tool da skill fica disponível (`prepareStep` → `activeTools`). No chat isso aparece como dois eventos distintos: **skill carregada** (linha tracejada com o documento) e **tool executada** (card com o resultado).

**Tools que apontam no CV.** Quando uma tool cita uma parte do currículo (um bullet sem número, a seção de Habilidades, o cabeçalho), o painel ao lado desenha um **retângulo tracejado** em cada trecho citado, com rótulo e cor (atenção, falha, evidência). As tools devolvem referências (`quote` = trecho exato, `section`, `header`) e a interface as localiza no documento renderizado. Passe o mouse em uma linha do card para ver só aquele trecho; clique para fixar. O `cv_editor` marca o que vai mudar antes de você aplicar.

---

## Passo a passo

### 1. Softwares a instalar

| Software | Versão | Onde |
|---|---|---|
| Node.js | ≥ 20 (testado com 26) | https://nodejs.org |
| pnpm | 11 | `npm i -g pnpm` |
| Git | qualquer | https://git-scm.com |
| Chave da API Groq | gratuita | https://console.groq.com/keys |
| Navegador com WebGPU (opcional) | Chrome/Edge atuais | sem WebGPU o fundo usa CSS |

### 2. Clonar e configurar

```bash
git clone https://github.com/lkzppm/cv-ai.git
cd cv-ai
pnpm install
cp .env.example .env.local      # cole sua GROQ_API_KEY
pnpm dev                        # http://localhost:3000
```

### 3. Como o projeto foi criado (reprodutível do zero)

```bash
pnpm create next-app@latest cv-ai --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*"
cd cv-ai
pnpm add ai @ai-sdk/react @ai-sdk/groq zod zustand react-markdown remark-gfm unpdf vgpu lucide-react radix-ui motion
pnpm add -D @vgpu/wgsl @vgpu/wgsl-std @webgpu/types
pnpm dlx shadcn@latest init --base radix --preset nova --template next --yes
pnpm dlx shadcn@latest add button textarea input scroll-area badge separator tooltip tabs dialog progress
pnpm dlx ai-elements@latest add conversation message prompt-input tool reasoning sources suggestion shimmer task
```

### 4. O agente (`src/agent/index.ts`)

```ts
import { ToolLoopAgent, stepCountIs } from "ai";

export function createCvAgent(ctx: { cv: string }) {
  return new ToolLoopAgent({
    model: groq("openai/gpt-oss-120b"),
    instructions: buildInstructions(ctx.cv), // persona + SKILL.md de cada skill + o CV
    tools: createSkills(ctx),                // role_matcher, format_checker, cv_scorer, cv_editor
    stopWhen: stepCountIs(8),
    providerOptions: { groq: { reasoningFormat: "parsed", reasoningEffort: "low" } },
  });
}
```

A rota `src/app/api/chat/route.ts` faz o streaming:

```ts
const agent = createCvAgent({ cv });
const result = await agent.stream({ messages: await convertToModelMessages(messages) });
return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream, sendReasoning: true }) });
```

### 5. Uma skill por dentro (`src/agent/skills/cv_scorer/index.ts`, resumido)

```ts
export function createCvScorer(ctx: { cv: string }) {
  const doc = loadSkillDoc("cv_scorer"); // lê SKILL.md
  return tool({
    description: doc.description,
    inputSchema: z.object({ targetRole: z.string().optional() }),
    execute: async ({ targetRole }) => {
      const { object } = await generateObject({
        model: agentModel(),
        schema: scoreSchema,                 // 6 dimensões, pesos, plano de melhoria
        prompt: `${doc.instructions}\n...\n${ctx.cv}`,
      });
      return { ...object, overall: weightedAverage(object.dimensions) };
    },
  });
}
```

E o `SKILL.md` correspondente descreve *quando usar*, a *rubrica* e *como apresentar* o resultado — o modelo lê isso no system prompt.

### 6. A interface (`src/components/workspace/agent-sidebar.tsx`, resumido)

```tsx
const { messages, sendMessage, status } = useChat<CvAgentUIMessage>({
  transport: new DefaultChatTransport({ api: "/api/chat", body: () => ({ cv: currentCv() }) }),
});

{m.parts.map((part) => {
  switch (part.type) {
    case "text":            return <MessageResponse>{part.text}</MessageResponse>;
    case "reasoning":       return <Reasoning isStreaming={part.state === "streaming"}>…</Reasoning>;
    case "tool-cv_scorer":  return <Tool><ToolHeader …/><ToolContent><ScoreCard output={part.output} /></ToolContent></Tool>;
    // … format_checker, role_matcher, cv_editor
  }
})}
```

### 7. Usar

1. Abra http://localhost:3000 — uma sessão com um CV de exemplo é criada.
2. Cole o seu CV em **Editar** ou envie um **PDF** (é convertido para Markdown).
3. Na sidebar, converse: "analise meu CV" (o agente roda `format_checker` e `cv_scorer`), cole um link de vaga (`role_matcher`) ou peça mudanças (`cv_editor`).
4. Peça "aplique as melhorias" → o `cv_editor` gera uma proposta → **Aplicar** → **Desfazer** se quiser.
5. Exporte em `.md` ou imprima (salvar como PDF).

## Estrutura

```
src/agent/            agente, prompts, modelos e skills/<nome>/{SKILL.md,index.ts}
src/app/api/chat      streaming do agente
src/app/api/parse-cv  PDF → texto → Markdown
src/components/       ai-elements (gerado) · ui (shadcn) · ambient (vgpu) · workspace (layout, painel, sidebar, cards)
src/lib/              parser de CV, store de sessões, fetch de páginas
spec/                 base de conhecimento do projeto (leia primeiro)
```

## Variáveis de ambiente

| Nome | Padrão | Descrição |
|---|---|---|
| `GROQ_API_KEY` | — | obrigatória |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | agente: decide a skill e escreve a resposta (precisa de tool calling) |
| `GROQ_SKILL_MODEL` | `openai/gpt-oss-120b` | chamadas internas do `format_checker` / `cv_scorer` (`generateObject`) |
| `GROQ_SEARCH_MODEL` | `openai/gpt-oss-120b` | `browser_search` do `role_matcher` |

## Testar as skills sem o navegador

```bash
pnpm smoke format      # cenários: hello · format · score · analyze · role · rolelink · edit
pnpm skill cv_scorer '{"targetRole":"Engenheira de Software Pleno","jobKeywords":null}'
```

`pnpm smoke` roda o agente completo (decisão de skill + resposta) e imprime as tool calls;
`pnpm skill` executa uma skill isolada, útil para depurar schema e prompt.

### Sobre latência no free tier da Groq

O plano gratuito permite **8 000 tokens/min por modelo**. Uma análise completa
(`format_checker` + `cv_scorer`) consome ~12–15 mil tokens, então com um único modelo o SDK
espera o `retry-after` (10–45 s) entre passos. Por isso o padrão divide o trabalho:

| Cenário | tudo no 120b | agente 20b + skills 120b |
|---|---|---|
| Análise completa | 129 s | **20 s** |
| Reescrever resumo | 60 s | **16 s** |
| Vaga por cargo (2 buscas) | 64 s | 77 s (a busca em si é lenta) |

O 120b continua nas skills porque o 20b falhou no schema do `cv_scorer` e na síntese do
`role_matcher`. Para usar só o 120b (respostas um pouco mais elaboradas), defina
`GROQ_MODEL=openai/gpt-oss-120b` e ative o Dev Tier em https://console.groq.com/settings/billing.

## Referências

- AI SDK — https://ai-sdk.dev/docs · AI Elements — https://elements.ai-sdk.dev
- Groq — https://console.groq.com/docs/models · built-in tools — https://console.groq.com/docs/tool-use/built-in-tools
- vgpu — https://github.com/vercel-labs/vgpu
- Next.js 16 — docs locais em `node_modules/next/dist/docs/`

## Licença

MIT
