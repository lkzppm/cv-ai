# 02 — Agente e skills

## O agente (`src/agent/index.ts`)

```ts
new ToolLoopAgent({
  model: groq(process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"),
  instructions: buildInstructions(cv),   // persona + regras + <skill> blocks + <cv>
  tools: createSkills({ cv }),           // as 4 skills fechadas sobre o CV
  stopWhen: stepCountIs(8),              // no máx. 8 passos modelo↔tools por mensagem
  providerOptions: { groq: { reasoningFormat: "parsed", reasoningEffort: "low" } },
});
```

- Instanciado **por request** (barato) porque o CV muda entre mensagens.
- O tipo `CvAgentUIMessage = InferAgentUIMessage<CvAgent>` dá tipagem às parts `tool-<skill>` no cliente.
- O stream vai para o cliente com `sendReasoning: true` (painel "Reasoning" do AI Elements) e `sendSources: true`.

## Contrato de uma skill

```
src/agent/skills/<nome>/
  SKILL.md   frontmatter {name, description} + corpo com: quando usar, como funciona, como apresentar
  index.ts   export function create<Nome>(ctx: { cv: string }) → tool({ description, inputSchema, execute })
```

- `description` da tool vem do frontmatter (uma fonte só).
- O corpo do SKILL.md é injetado no system prompt dentro de `<skill name="...">…</skill>` por `skillsPromptBlock()`.
- `execute` roda no servidor e pode chamar o modelo de novo (`generateObject`, `generateText` + `browser_search`).
- O resultado deve ser **JSON serializável e estável**: o cliente tem um card por skill (`components/workspace/tool-cards/`).
- Erros: `throw new Error("mensagem para o usuário")` → vira `output-error` no card e o modelo explica.

## As 4 skills

### role_matcher
- Input: `{ jobUrls: string[], roleQuery?: string }`
- Rodadas (por vaga, máx. 3 vagas):
  0. `fetchPageText(url)` — HTML→texto; LinkedIn costuma devolver authwall → `null`.
  1. `generateText` com `groq.tools.browserSearch({})` → descrição da vaga.
  2. idem → "o que o mercado pede para esse cargo (2025-2026)".
  3. Síntese **sem** busca: JSON `{ roles[], match{score, matched, missing, suggestions} }` validado por zod; fallback `ok:false` com texto bruto.
- Modelo: `GROQ_SEARCH_MODEL` (precisa suportar `browser_search`: `openai/gpt-oss-120b|20b`).

### format_checker
- Input: `{ focus?: string }`
- Parte determinística (`lib/cv/parse.ts`): contato, nome, seções (experiência/educação/habilidades/resumo), tamanho, datas, verbos de ação (lista PT+EN), quantificação, primeira pessoa.
- Parte qualitativa (`generateObject`): 3–6 checagens extras (ordem, consistência, ATS-breakers) + `topFixes[3]`.
- Output: `{ score, summary{pass,warn,fail}, stats, checks[{id,label,status,detail,standard}], topFixes }`.

### cv_scorer
- Input: `{ targetRole?: string, jobKeywords?: string[] }`
- `generateObject` com rubrica de 6 dimensões e pesos fixos (Impacto 25, Clareza 15, Relevância 20, Estrutura 15, Keywords/ATS 15, Consistência 10). A nota geral é **recalculada em código** pela média ponderada para não depender da aritmética do modelo.
- Output: `{ overall, band, verdict, dimensions[], strengths[], weaknesses[], improvementPlan[], missingKeywords[] }`.

### cv_editor
- Input: `{ newCv: string (Markdown completo), summary: string[] }` — o próprio modelo escreve o documento.
- `execute` só calcula estatísticas. O card no cliente tem **Pré-visualizar** e **Aplicar** (→ `store.setCv`, com histórico para **Desfazer**).

## Como adicionar uma skill nova (ex.: `cover_letter`)

1. `mkdir src/agent/skills/cover_letter` com `SKILL.md` (frontmatter + instruções) e `index.ts` exportando `createCoverLetter(ctx)`.
2. Registrar em `src/agent/skills/index.ts` (`SKILL_NAMES` + objeto de `createSkills`).
3. Criar `components/workspace/tool-cards/cover-letter-card.tsx` e adicionar o `case "tool-cover_letter"` em `agent-sidebar.tsx` (switch de render + `SKILL_TITLES`).
4. Opcional: chip em `skill-chips.tsx`.
5. Atualizar este arquivo e o README.

## Modelos Groq testáveis (2026-10)

| Modelo | Tool calling | Reasoning | browser_search | Uso |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | ✔ | ✔ | ✔ | padrão (agente + busca) |
| `openai/gpt-oss-20b` | ✔ | ✔ | ✔ | mais rápido/barato |
| `llama-3.3-70b-versatile` | ✔ | – | – | alternativa sem reasoning |
| `moonshotai/kimi-k2-instruct-0905` | ✔ | – | – | bom em escrita |
