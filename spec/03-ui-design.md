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
          fundo: vgpu — aurora lenta (WebGPU) · fallback CSS
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
| `--background` | `#0A1220` | `#F3F6FB` | fundo (atrás da aurora) |
| `--card` | `#111C2E` | `#FFFFFF` | folha do CV |
| `--success` / `--warning` / `--destructive` | `#3DDC97` / `#FFB454` / `#FF6B7A` | | status |

Regras de tom: botões e balão do usuário são `bg-primary` sólidos (sem gradiente); gradientes só em detalhes finos (logo, borda de 1px, texto do hero). Histórico: v1 LinkedIn blue → v2 "Obsidian" (íris/aqua/magenta, considerada agressiva demais) → v3 Azure.

## Animações (motion v14, `motion/react`)

- Header e sidebar entram com slide/fade; rail de sessões anima largura com spring; item ativo usa `layoutId` (pílula desliza).
- Troca de sessão: `AnimatePresence mode="wait"` no painel do CV (fade + y + scale).
- Mensagens: fade + deslocamento curto; cards de skill com spring; toolbar flutuante em pílula com `whileHover/whileTap`.
- Estado vazio da sidebar: hero com stagger das 4 capacidades (não são botões — o agente decide quando chamar as skills).
- `prefers-reduced-motion`: a aurora não inicia e o fallback não anima.

## Componentes

- **AI Elements** (`components/ai-elements/`, gerados por `pnpm dlx ai-elements@latest add …`): `Conversation`, `Message/MessageResponse` (Streamdown), `PromptInput*`, `Tool/ToolHeader/ToolContent`, `Reasoning`, `Suggestion(s)`, `Shimmer`, `Sources`, `Task`, `CodeBlock`.
  - Não edite esses arquivos à mão; para atualizar: `pnpm dlx ai-elements@latest add <nome>` (sobrescreve).
  - Requer shadcn em modo **radix** (`components.json` → `radix-nova`).
- **shadcn/ui**: button, textarea, input, scroll-area, badge, separator, tooltip, tabs, dialog, progress (+ deps puxadas pelo AI Elements).
- **Tool cards** (`components/workspace/tool-cards/`): um por skill, recebem `part.output` tipado.

## vgpu — aurora (fundo)

Um único efeito fullscreen, de propósito discreto (substituiu o fluido da v2, que foi considerado agressivo demais):

- `components/ambient/aurora/aurora.wgsl`: `fbmSimplex2d` importado da stdlib (`@vgpu/wgsl-std/noise/simplex`) com *domain warp* em duas etapas, muito lento (`time * 0.035`). Três bandas azuis (brand/teal/sky) com intensidade 0.22 no claro e 0.42 no escuro, vinheta e brilho de topo.
- `aurora.ts`: `init → surface → effect → frameLoop`; uniforms `time`, `dark`, `pointer` (parallax de ~1.5% com easing) e `texel`. Pausa com a aba oculta, DPR ≤ 1.5, `onError` → fallback CSS.
- `ambient-canvas.tsx`: import dinâmico, detecção de `navigator.gpu` com `useSyncExternalStore`, grão SVG a 5%.
- Loader `.wgsl` continua configurado em `next.config.ts` (Turbopack + webpack); tipos em `src/wgsl-env.d.ts`.
- Validar: `npx vgpu check src/components/ambient/aurora/aurora.wgsl`.

## Referências de design
- Claude Design (layout canvas + sidebar de chat)
- vgpu examples: https://vgpu.sh/examples · stdlib WGSL: `@vgpu/wgsl-std` (noise, hash, color)
- AI Elements showcase: https://elements.ai-sdk.dev
