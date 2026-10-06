# 03 — UI e design

## Layout (inspirado no Claude Design)

```
┌──────────── header (logo · tema) ────────────────────────────────────────────┐
│ sessões │           CV atual (Markdown renderizado)          │ Agente         │
│ (glass, │  ┌──────────────── folha flutuante ─────────────┐  │ conversa       │
│ 248px,  │  │ # Nome                                        │  │ (AI Elements)  │
│ spring) │  │ contato                                       │  │ cards de skill │
│         │  │ ## Experiência …                              │  │ status pill    │
│         │  └──────────────────────────────────────────────┘  │ prompt input   │
│         │     ( toolbar em pílula flutuante: ⬆ ✎ ↶ | ⬇ 🖨 )   │ (440–500px)    │
└──────────────────────────────────────────────────────────────────────────────┘
          fundo: vgpu — folhas de CV esboçadas (WebGPU) · fallback CSS
```

- `< lg`: a sidebar do agente vira um painel sobreposto (tela cheia no celular); `< md`: o rail de sessões abre em tela cheia. Ver "Layout em telas pequenas" abaixo. O rail esquerdo começa fechado e abre pelo botão do header.
- **Divisor móvel** entre CV e chat (`role="separator"`, 12px, cursor `col-resize`): arraste muda `chatWidth` na store (persistido, 360–820px); duplo clique volta ao padrão (460px).
- Barras de rolagem invisíveis no CV e no chat (`@utility scrollbar-none`, que também cobre o container interno do `Conversation`).
- O painel do CV tem `print-area`: `window.print()` imprime só a folha (salvar como PDF).

## Layout em telas pequenas (2026-10-06)

Dois cortes, os mesmos do Tailwind, lidos em JS por `useMediaQuery` (`lib/use-media-query.ts`, `BELOW_MD` / `BELOW_LG`) porque o `motion` anima propriedades diferentes em cada modo:

| Largura | Rail de sessões | Agente (chat) |
|---|---|---|
| `≥ lg` (1024px) | coluna de 248px (spring na largura) | coluna redimensionável |
| `md`–`lg` | coluna de 248px | gaveta à direita (480px) com véu escuro atrás |
| `sm`–`md` | tela cheia | gaveta à direita (480px) com véu |
| `< sm` (celular) | tela cheia | tela cheia |

- **Uma única instância do `AgentSidebar`**, sempre montada: abaixo de `lg` o mesmo `<aside>` troca de classes (`fixed inset-y-0 right-0`) e desliza com `x: 100% ↔ 0%`. Não desmontar é o que mantém o `useChat` (e o streaming) vivo ao fechar o painel ou girar o tablet. Fechado, o painel fica `inert`; aberto, quem fica `inert` é o header e o `<main>`.
- **Estado em `lib/store/mobile-chat.ts`** (`open`, `busy`; não persiste; ignorado no desktop), porque os dois lados se chamam:
  - CV → chat: o **botão de chat** (círculo azul ao lado da toolbar do CV, `lg:hidden`) e `revealInChat` (toque numa marcação ou em "alteração k/N") chamam `show()`.
  - chat → CV: fixar um item de card (`<Highlightable>`) e os botões **Revisar no CV / Ver no CV** do `cv_editor` chamam `hide()`, senão o destaque/diff apareceria atrás do chat. O ✕ do cabeçalho do painel, o véu e `Esc` também fecham.
  - Trocar de sessão fecha o chat e volta o `<main>` ao topo. Enquanto o agente responde com o chat fechado, o botão mostra um ponto pulsante (`busy`).
- **Rail em tela cheia** (`SessionsRail` com `onClose`): ganha um ✕ e fecha ao escolher ou criar uma sessão. Renomear/excluir ficam sempre visíveis em telas de toque (`pointer-coarse:`), que não têm hover.
- **Empilhamento**: os painéis vivem no container das colunas, que abaixo de `lg` sobe para `z-30` para cobrir o header (`z-20`). Superfície `@utility surface-sheet`: opaca, sem `backdrop-filter` (blur em tela cheia sobre o fundo animado custa caro no celular), com um brilho azul no topo.
- **Campos de texto com 16px** abaixo de `lg` (composer, editor do CV; renomear sessão no toque): o Safari do iOS dá zoom na página ao focar campos menores. `viewport.interactiveWidget = "resizes-content"` (`app/layout.tsx`) faz o teclado encolher o layout no Chrome/Android; o Safari ignora e rola a página até o campo.
- Ajustes de densidade: folha do CV com `p-5` e margens laterais mínimas, cartões da homepage em linha (ícone à esquerda), diálogo "Sobre" com abas no topo e rolagem interna, GitHub do header some abaixo de 360px, status das skills só com ícone no chat.
- Testado em Chromium emulando 320, 390 e 820px (toque) e 1440px; **não testado em aparelho real** (teclado do iOS em especial).

## Paleta "Azure" (tokens em `globals.css`) — desde 2026-10-03 (v3)

Uma única família de cor (azul), para não competir com o conteúdo do CV. Escuro é o padrão (navy profundo); o claro é papel frio. Painéis em vidro (`@utility glass`) mantidos da v2.

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--brand` / `--primary` | `#4C8DFF` | `#1F6FEB` | ação principal, títulos de seção do CV, pill de skill em execução |
| `--brand-soft` | `#9ECCFF` | `#7FB4FF` | 3ª cor do fundo, gráficos |
| `--brand-cool` | `#54CCDE` | `#1AA7B8` | fim dos gradientes discretos (`text-gradient`, borda do card) |
| `--background` | `#0A1220` | `#F3F6FB` | fundo (atrás das folhas) |
| `--card` | `#111C2E` | `#FFFFFF` | folha do CV |
| `--success` / `--warning` / `--destructive` | `#3DDC97` / `#FFB454` / `#FF6B7A` | | status |

Regras de tom: botões e balão do usuário são `bg-primary` sólidos (sem gradiente); gradientes só em detalhes finos (logo, borda de 1px, texto do hero). Histórico: v1 LinkedIn blue → v2 "Obsidian" (íris/aqua/magenta, considerada agressiva demais) → v3 Azure.

## Animações (motion v14, `motion/react`)

- Header e sidebar entram com slide/fade; rail de sessões anima largura com spring; item ativo usa `layoutId` (pílula desliza).
- Troca de sessão: `AnimatePresence mode="wait"` no painel do CV (fade + y + scale).
- Mensagens: fade + deslocamento curto; cards de skill com spring; toolbar flutuante em pílula com `whileHover/whileTap`.
- Estado vazio da sidebar: hero com stagger das 4 capacidades (não são botões — o agente decide quando chamar as skills).
- `prefers-reduced-motion`: o fundo WebGPU não inicia; o fallback CSS é estático.
- **Troca de tema** (2026-10-06, `lib/theme.ts`): o tema novo se abre num círculo a partir do botão do header, por cima de uma foto do tema antigo (View Transitions API; `clip-path` animado em `::view-transition-new(root)`, 620 ms). A classe `.dark` tem de entrar **dentro** do callback de `startViewTransition` (`applyTheme`): antes ela só entrava num `useEffect`, depois de o navegador já ter fotografado o estado "novo", e a troca saía seca. Sem a API: fade das cores por CSS (`html.theme-fade`). Com `prefers-reduced-motion`: troca direta.

## Componentes

- **AI Elements** (`components/ai-elements/`, gerados por `pnpm dlx ai-elements@latest add …`): `Conversation`, `Message/MessageResponse` (Streamdown), `PromptInput*`, `Tool/ToolHeader/ToolContent`, `Reasoning`, `Suggestion(s)`, `Shimmer`, `Sources`, `Task`, `CodeBlock`.
  - Não edite esses arquivos à mão; para atualizar: `pnpm dlx ai-elements@latest add <nome>` (sobrescreve).
  - Requer shadcn em modo **radix** (`components.json` → `radix-nova`).
- **shadcn/ui**: button, textarea, input, scroll-area, badge, separator, tooltip, tabs, dialog, progress (+ deps puxadas pelo AI Elements).
- **Tool cards** (`components/workspace/tool-cards/`): um por skill, recebem `part.output` tipado.

## vgpu — "papers" (fundo) — v4, 2026-10-03

Fundo temático e discreto: **folhas de currículo esboçadas** (contorno arredondado, barra do "nome", subtítulo e 5 linhas de texto) numa grade esparsa com colunas desencontradas, derivando para cima muito devagar, com balanço sutil por folha, parallax de ~1% e um foco de luz suave que acompanha o cursor. Substituiu a aurora (v3), considerada ainda chamativa e sem relação com o tema.

- `components/ambient/papers/papers.wgsl`: SDFs de caixa arredondada com antialiasing por `fwidth`; `hash2` da stdlib (`@vgpu/wgsl-std/hash`) decide quais células têm folha (72%), tamanho, jitter e comprimento das linhas. Opacidade da tinta ≈ 7,5% (claro) / 8,5% (escuro); vinheta esmaece perto das bordas para não disputar com os painéis glass.
- `papers.ts`: `init → surface → effect(compile({ colors: [surface.format] })) → frameLoop`; uniforms `time`, `dark`, `pointer` (easing 0.05) e `texel`. Pausa com a aba oculta.
- Fallback CSS (`.ambient-fallback`): linhas finas repetidas em grade + brilho no topo, estático, com máscara radial.
- Validar: `npx vgpu check src/components/ambient/papers/papers.wgsl`.
- **v4.2 (2026-10-03):** seis tipos de documento sorteados por célula (currículo, perfil com avatar e tags, gráfico de barras com animação lenta, checklist com checks, carta, nota com selo circular), grade mais densa (célula 0,34×0,42, 86% das células ocupadas), cada coluna sobe numa velocidade própria (profundidade), folhas com inclinação de até ±6° e balanço em dois eixos.
- **Interação (v4.1):** cada folha calcula a distância do cursor ao seu centro (desfazendo deriva/parallax) e dobra o canto superior direito (dog-ear: canto cortado + aba espelhada pela diagonal `a + b = k`, linha da dobra e sombra), com `k` crescendo com a proximidade e uma respiração lenta. Folhas próximas ganham ~90% mais tinta. Texto some sob o corte e a aba.
- Para ajustar a presença: `alpha` (opacidade), `h.x > 0.28` (densidade), `time * 0.006` (velocidade), `0.40 * near` (tamanho máximo da dobra).

## Chat: markdown e atividade das skills (2026-10-03)

- **Markdown das respostas** (`.chat-md` em `globals.css`, aplicado ao `MessageResponse`/Streamdown): `streamdown/styles.css` importado e `@source` dos pacotes Streamdown para o Tailwind gerar as classes; estilos por `data-streamdown="…"`: títulos e cabeçalhos de tabela em `--primary`, bullets como pontos azuis, numeração azul, tabelas dentro do wrapper com borda `glass-border`, inline code azul claro. Respiro de 0,65rem entre blocos e listas com `padding-left` para os marcadores não colarem na borda da bolha.
- **Mensagem do usuário** sempre branca sobre o azul (`text-white` + regras `.is-user .chat-md`), nos dois temas.
- **Auto-scroll**: `AutoScroll` (dentro do `Conversation`) chama `scrollToBottom` quando a contagem de mensagens muda ou o status vira `submitted`; o `use-stick-to-bottom` só acompanha o streaming se já estava no fim, por isso o empurrão ao enviar.
- **Raciocínio**: um bloco por passo do gpt-oss. Blocos vazios são omitidos; os demais viram uma linha pequena "Pensou por Ns" / "Pensando…" (pt-BR) sem margens, para a timeline reasoning → skill → tool ter ritmo uniforme (`gap-2`).
- **Colapsáveis fluidos** (`.collapsible-fluid` em `globals.css`): keyframes de altura via `--radix-collapsible-content-height` + fade; usado em skill, tool e raciocínio. **Nunca use `!important` nessa animação**: o Radix mede a altura zerando `animation-name` por estilo inline, e inline não vence `!important` — o conteúdo era medido com altura 0 e ficava preso (bug de 2026-10-04). O CSS fica fora das `@layer` do Tailwind, o que já basta para vencer o `animate-in/out` dos componentes gerados. Respeita `prefers-reduced-motion`.
- **Skill carregada vs tool executada** (`skill-activity.tsx`): `SkillLoadedRow` (linha tracejada azul, ícone da skill, "instruções carregadas", expande para ler o SKILL.md) para `tool-load_skill`; `SkillToolHeader` (card sólido, tag TOOL, pílula de estado pt-BR: preparando / executando / concluída / erro) para as demais. O indicador flutuante diz "carregando skill X" ou "executando tool X".

## Homepage sem sessão (2026-10-04)

Sem nenhuma sessão (primeiro acesso ou após excluir todas) o centro mostra `home-screen.tsx`: marca, tagline, três cartões para começar (**Enviar meu currículo** → `<label>` do input escondido + `parseCvFile` + `createSession({ cv, title })`; **Colar o texto** → sessão com CV vazio, que abre direto no editor; **Testar com um exemplo** → `SAMPLE_CV`) e a grade das 4 skills. A coluna do agente e o divisor só existem com sessão. Antes disso o `AppShell` criava uma sessão sozinha e, ao excluir a última, o `CvPanel` em animação de saída quebrava com `session.cv` nulo — agora o painel tem guard (`if (!session) return null` depois dos hooks). Upload compartilhado em `lib/cv/upload.ts`.

**Upload de PDF (2026-10-04).** Testado com um CV do Canva: (1) a `extractText` da unpdf devolvia o texto na ordem do content stream (todos os títulos juntos, bullets longe do cargo) — `lib/cv/pdf-text.ts` lê os itens com `getTextContent()`, agrupa em linhas por `y` (tolerância = metade do tamanho da fonte), ordena de cima para baixo / esquerda para direita, insere linha em branco em saltos verticais grandes e `" | "` entre colunas lado a lado; (2) o gpt-oss-20b gastava os 2 048 tokens de saída padrão da Groq só raciocinando e devolvia texto vazio (`finishReason: "length"`), e o cliente gravava `""` como CV — a conversão agora usa o 120b com `reasoningEffort: "low"` e `maxOutputTokens: 8000` (~1,5 s), a rota devolve `markdown: null` se não terminar com `stop`, e `parseCvFile` cai para o texto bruto.

## Rail de sessões: título longo (2026-10-04)

O `Viewport` do Radix ScrollArea renderiza os filhos dentro de um `div` com `display: table` inline, então a lista assumia a largura do título mais longo e os botões renomear/excluir ficavam fora do rail (cortados pelo `overflow-hidden`). Correção sem tocar no componente gerado: `[&_[data-slot=scroll-area-viewport]>div]:block!` no `ScrollArea` do rail + `w-full min-w-0` na lista; o `truncate` do título volta a valer.

## Destaques no CV (2026-10-04)

As tools "apontam" no documento: cada parte mencionada ganha um **retângulo tracejado** no painel do CV, com rótulo e cor por tom (azul = informação, âmbar = atenção, vermelho = falha, verde = evidência positiva). Várias partes ao mesmo tempo.

- **Dados**: `CvRef` (`quote` | `section` | `header`) dentro do `output` de cada tool — ver `spec/02`. Persistem com a conversa, então o card continua interativo depois de recarregar.
- **Store** (`lib/store/highlights.ts`, zustand sem persist): três camadas — `hover` (item do card sob o cursor) > `focused` (item clicado) > `pinned` (tudo que a última tool mencionou). `selectVisible()` resolve a camada.
- **Camada** (`cv-highlights.tsx`): envolve o `<article class="cv-doc">`, resolve cada ref para elementos do DOM (`resolveRef`), une os `getBoundingClientRect` e desenha `div.cv-highlight` absolutos (CSS em `globals.css`, `--hl` por tom, escondidos no print). Re-mede com `ResizeObserver` e quando o CV/itens mudam; ao fixar ou focar, rola o primeiro destaque para o centro (`scrollIntoView`). Refs que não resolvem simplesmente não desenham.
- **Cards** (`highlightable.tsx`): `<Highlightable item={{ refs, label, tone }}>` — hover mostra, clique fixa/solta, ícone `ScanSearch` à direita; sem refs vira um `div` comum. Cada card exporta `xxxHighlights(output)` com o que fixar automaticamente ao terminar: `format_checker` = checagens com problema; `cv_scorer` = plano de melhoria; `role_matcher` = evidências dos requisitos atendidos. O `cv_editor` não usa destaques: abre a revisão em diff (abaixo).
- **Sidebar**: `useAutoHighlights` fixa quando um `tool-*` chega em `output-available` (ignora o histórico carregado do storage) e limpa ao trocar de sessão. Enviar uma nova mensagem limpa os destaques da onda anterior (a revisão do `cv_editor`, se aberta, fica). O chip "N destaques · tool ×" no cabeçalho do painel limpa tudo.
- **Do CV para o chat**: a marcação é clicável. `<Highlightable>` grava `data-hl-key` (= `highlightKey`) e o wrapper do card grava `data-tool-call`; `lib/reveal.ts` abre o card se estiver recolhido, rola até a linha e pisca (`.hl-flash`). O conjunto fixado guarda o `toolCallId` da tool de origem.

## Histórico de versões navegável (2026-10-04)

`cvHistory` passou a guardar `{ cv, at, label }` (persist v3 migra as strings antigas). `setCv` aceita `label` — "edição manual", "upload", "cv_editor", "restaurada de vN" — e cada versão fica carimbada com a origem. O chip `vN` do cabeçalho (`cv-versions.tsx`, `VersionMenu`) abre a lista da mais nova para a mais antiga; escolher uma versão abre a folha em modo leitura com a `VersionBar` (anterior/seguinte, **Diff com a atual**, **Restaurar**, voltar) e a toolbar troca para as mesmas ações. O diff reutiliza `CvDiff` (o mesmo da revisão do `cv_editor`) em modo só leitura e tom azul: antes = versão aberta, depois = atual. **Restaurar** chama `store.restoreCv(i)`: a atual vai para o histórico e a antiga vira a atual (linear, como um revert; Desfazer continua funcionando). Se o histórico encolher (Desfazer) enquanto uma versão está aberta, o painel volta para a atual.

## Revisão do cv_editor em diff (2026-10-04)

Quando o `cv_editor` termina, o painel troca o documento pela **revisão**: `diffCv(atual, proposta)` (LCS por linhas, blocos separados só por linhas em branco são unidos, mudanças só de espaço são ignoradas) rende os trechos iguais como Markdown normal e cada bloco alterado como um cartão tracejado âmbar com **antes** (vermelho, riscado) e **depois** (verde), e botões **Recusar / Aceitar** por bloco. Aceitar aplica só aquele bloco (`acceptHunk` → `setCv`, com Desfazer); recusar reescreve a proposta sem ele (`rejectHunk`). A barra no cabeçalho mostra "revisão do cv_editor · N blocos · aceitar tudo / recusar tudo". Quando não resta bloco, a revisão fecha sozinha. "alteração k/N" no bloco leva ao card no chat. Estado em `lib/store/edit-proposal.ts` (não persiste; o card oferece "Revisar no CV" depois de recarregar). O botão **Pré-visualizar** foi removido. Na impressão só o "depois" aparece.
- Decisão: overlay medido no DOM em vez de marcar o Markdown — não depende da estrutura do `react-markdown`, suporta faixas (seção = vários blocos) e mantém o documento imprimível intacto.

## Referências de design
- Claude Design (layout canvas + sidebar de chat)
- vgpu examples: https://vgpu.sh/examples · stdlib WGSL: `@vgpu/wgsl-std` (noise, hash, color)
- AI Elements showcase: https://elements.ai-sdk.dev
