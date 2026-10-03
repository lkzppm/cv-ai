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

- `< lg`: a sidebar do agente fica oculta (TODO: drawer). O rail esquerdo colapsa pelo botão do header.
- O painel do CV tem `print-area`: `window.print()` imprime só a folha (salvar como PDF).

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
- Para ajustar a presença: `alpha` (opacidade), `h.x > 0.28` (densidade), `time * 0.006` (velocidade).

## Referências de design
- Claude Design (layout canvas + sidebar de chat)
- vgpu examples: https://vgpu.sh/examples · stdlib WGSL: `@vgpu/wgsl-std` (noise, hash, color)
- AI Elements showcase: https://elements.ai-sdk.dev
