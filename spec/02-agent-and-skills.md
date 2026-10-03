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
- O corpo do SKILL.md é injetado no system prompt dentro de `<skill name="...">…</skill>` por `skillsPromptBlock()` — **só as seções que o agente precisa** (`Quando usar`, `Como apresentar`, `Regras`). Seções internas (`Padrões de referência`, `Rubrica`, `Faixas`, `Como funciona`) ficam fora do prompt do agente e entram apenas nas chamadas internas da skill (`doc.instructions`). Ver `agentFacing()` em `registry.ts`. Decidido em 2026-10-03 para caber no free tier da Groq (8k tokens/min).
- **Inputs opcionais usam `.nullish()`, nunca `.optional()`**: o `gpt-oss` envia `null` em campos que não preenche e `.optional()` rejeita (`expected string, but got null`). Normalize com `?? []` no `execute`.
- **Schemas de `generateObject` não podem ter `.optional()`**: a Groq usa structured outputs estritos e exige todas as chaves em `required`. Use `.nullable()`.
- **`toModelOutput`**: cada tool devolve ao modelo uma versão enxuta do resultado (sem fontes, sem rationales longos, sem o CV inteiro do `cv_editor`). O card da UI continua recebendo o output completo. Para isso funcionar no histórico, `route.ts` chama `convertToModelMessages(messages, { tools: agent.tools })`.
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

Modelos de texto disponíveis na conta em 2026-10-03 (`GET /openai/v1/models`): `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`. Os Llama 3.x e Kimi foram descontinuados.

| Modelo | Tool calling | Reasoning | browser_search | Resultado do teste (2026-10-03) |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | ✔ | ✔ | ✔ | **padrão**; único confiável em todas as skills |
| `openai/gpt-oss-20b` | ✔ | ✔ | ✔ | falhou no `cv_scorer` (gerou `"4"` string onde o schema pede inteiro) |
| `qwen/qwen3.8-27b` | ✔ | ✔ | – | funciona no `cv_scorer`, mas o free tier limita a 1 000 tokens de saída/min — inviável |

Limites do free tier observados: `gpt-oss-120b` 8 000 tokens/min (por modelo). Uma análise completa usa ~12–15k tokens; o SDK honra o `retry-after` automaticamente (até ~45 s). `GROQ_SKILL_MODEL` permite mover as chamadas internas para outro modelo e dobrar o orçamento, mas nenhum alternativo passou no teste.
