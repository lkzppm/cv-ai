# 02 — Agente e skills

## O agente (`src/agent/index.ts`)

```ts
new ToolLoopAgent({
  model: groq(process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"),
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

- **Carregamento progressivo (2026-10-03).** O agente tem uma tool extra, `load_skill({ names: SkillName[] })`, que devolve o `SKILL.md` completo. `prepareStep` limita `activeTools` a `["load_skill", ...ctx.loaded]`, então uma skill só pode ser executada depois de carregada; `requireLoaded()` em cada `execute` é o backstop. `ctx.loaded` (em `context.ts`) é reconstruído pela rota a partir dos `tool-load_skill` do histórico, logo cada skill é carregada uma vez por conversa. Para o modelo, `toModelOutput` do `load_skill` remove as seções internas (`Como funciona`, `Padrões de referência`); a UI recebe o documento inteiro e mostra a linha "skill carregada" (`skill-activity.tsx`). Custo: 1 passo extra por resposta (o modelo carrega várias skills numa chamada); análise completa 20 s → 29 s no free tier.
- `description` da tool vem do frontmatter (uma fonte só).
- O system prompt recebe, por skill, só `description` + seção `## Quando usar` (`agentFacing()` em `registry.ts`); o restante chega via `load_skill`. As chamadas internas da skill (`generateObject`) continuam usando `doc.instructions` completo.
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
- `execute` só calcula estatísticas. A revisão acontece **no painel do CV** como diff por blocos (`lib/cv/diff.ts`, `cv-diff-view.tsx`): aceitar um bloco aplica só ele (`store.setCv`, com **Desfazer**); recusar tira o bloco da proposta. O card mostra o resumo e "Aceitar tudo / Recusar tudo"; sem revisão aberta (ex.: após recarregar), "Revisar no CV" reabre. (2026-10-04)

## Gate das skills: de `activeTools` para gate macio (2026-10-04)

O gate por `prepareStep → activeTools` (só `load_skill` + skills carregadas iam na requisição) provocava um erro fatal: quando o gpt-oss-20b decidia chamar `cv_editor` sem ter carregado a skill naquela conversa, a Groq rejeitava a geração inteira com `400 "attempted to call tool 'cv_editor' which was not in request.tools"` — o stream morria e não há como interceptar isso no SDK. Decisão: **todas as tools vão sempre na requisição**; `requireLoaded(ctx, name)` virou um gate macio — se a skill não estava carregada, carrega na hora e devolve `true`; a tool inclui `autoLoaded: true` no output, o `toModelOutput` anexa `skillNote` com as instruções de apresentação do SKILL.md, a rota conta a skill como carregada nos turnos seguintes e o card mostra a pílula "skill carregada aqui". O protocolo explícito (`load_skill` antes) continua no prompt e é o caminho normal; o gate macio é a rede de segurança.

## Referências ao CV (`CvRef`) — 2026-10-04

Toda tool que fala de uma parte do CV devolve **âncoras** para a UI destacar no painel (`src/lib/cv/refs.ts`):

| `kind` | Campo | Como a UI resolve |
|---|---|---|
| `quote` | `text` (trecho VERBATIM) | menor bloco renderizado (`li`, `p`, `h1–h3`, `td`) cujo texto normalizado contém o trecho; cai para os 7 primeiros termos |
| `section` | `title` (`##`) | do `h2` até o próximo `h2`; casa por texto ou pelo tipo normalizado (`sectionKindOf`) |
| `header` | — | `h1` + linha de contato |

Onde cada skill produz refs:

- **format_checker** — checagens determinísticas calculam `refs` no servidor (contato/nome → `header`; seções/datas → `section`; verbos/quantificação → `quote` dos bullets fracos **de experiência/projetos**, não de habilidades; primeira pessoa → linhas com "eu/meu"). As qualitativas pedem `evidence: string[]` ao modelo (trechos copiados exatamente), convertido em `quote`.
- **cv_scorer** — `dimensions[].evidence` (até 2 trechos) e `improvementPlan[].quote` (trecho a alterar, ou `null` → o card usa `section`).
- **role_matcher** — `match.evidence` (trechos que comprovam os `matched`); fica fora do `toModelOutput`.
- **cv_editor** — não devolve refs: a UI calcula o diff entre o CV atual e `newCv` e mostra antes/depois no próprio painel.

Regra de prompt: peça sempre cópia **exata** ("copie EXATAMENTE") — paráfrases não resolvem no DOM. Os campos de evidência não vão para o modelo (`toModelOutput`), só para o card.

## Como adicionar uma skill nova (ex.: `cover_letter`)

1. `mkdir src/agent/skills/cover_letter` com `SKILL.md` (frontmatter + instruções) e `index.ts` exportando `createCoverLetter(ctx)`.
2. Registrar em `src/agent/skills/index.ts` (`SKILL_NAMES` + objeto de `createSkills`).
3. Criar `components/workspace/tool-cards/cover-letter-card.tsx` e adicionar o `case "tool-cover_letter"` em `agent-sidebar.tsx` (switch de render + `SKILL_SUBTITLES`).
4. Se a skill cita partes do CV, devolva `CvRef[]` no output, exporte `coverLetterHighlights(output)` do card e registre em `highlightsFor()` na sidebar; envolva as linhas do card em `<Highlightable item=…>`.
5. Atualizar este arquivo e o README.

## Modelos Groq testáveis (2026-10)

Modelos de texto disponíveis na conta em 2026-10-03 (`GET /openai/v1/models`): `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`. Os Llama 3.x e Kimi foram descontinuados.

| Modelo | Tool calling | Reasoning | browser_search | Resultado do teste (2026-10-03) |
|---|---|---|---|---|
| `openai/gpt-oss-120b` | ✔ | ✔ | ✔ | **padrão das skills e da busca**; único confiável no `generateObject` e na síntese do `role_matcher` |
| `openai/gpt-oss-20b` | ✔ | ✔ | ✔ | **padrão do agente** (decide skill + redige); falhou no `cv_scorer` (`"4"` string onde o schema pede inteiro) e na síntese do `role_matcher` |
| `qwen/qwen3.8-27b` | ✔ | ✔ | – | funciona no `cv_scorer`, mas o free tier limita a 1 000 tokens de saída/min — inviável |

Limites do free tier observados: 8 000 tokens/min **por modelo** (120b, 20b e qwen, cada um com seu balde). Uma análise completa usa ~12–15k tokens; o SDK honra o `retry-after` automaticamente (até ~45 s).

**Decisão 2026-10-03 — divisão agente/skills.** Agente no `gpt-oss-20b` (`GROQ_MODEL`), skills e busca no `gpt-oss-120b` (`GROQ_SKILL_MODEL`, `GROQ_SEARCH_MODEL`). Dobra o orçamento de tokens/min sem perder qualidade onde importa (avaliação estruturada e síntese de busca). Medições com `pnpm smoke`: análise completa 129 s → 20 s, `cv_editor` 60 s → 16 s, `role_matcher` ~igual (a busca domina). Com Dev Tier, `GROQ_MODEL=openai/gpt-oss-120b` dá respostas um pouco mais elaboradas.
