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
          fundo: vgpu — fluido interativo (WebGPU) · fallback CSS
```

- `< lg`: a sidebar do agente fica oculta (TODO: drawer). O rail esquerdo colapsa pelo botão do header.
- O painel do CV tem `print-area`: `window.print()` imprime só a folha (salvar como PDF).

## Paleta "Obsidian" (tokens em `globals.css`) — desde 2026-10-03 (v2)

Tema **escuro é o padrão**. Três tintas sobre quase-preto violeta; o claro é um papel lilás suave.

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--iris` / `--primary` | `#8B7CFF` | `#6A5AE0` | ação principal, títulos de seção do CV, gradientes |
| `--aqua` / `--success` | `#2EE6A6` | `#15B587` | sucesso, skill em execução, 2ª cor dos gradientes |
| `--magenta` | `#FF5CAA` | `#E04A92` | 3ª cor dos gradientes, balão do usuário |
| `--background` | `#08070D` | `#F4F3FA` | fundo (atrás do fluido) |
| `--card` | `#100F18` | `#FFFFFF` | folha do CV |
| `--glass` / `--glass-border` | rgba | rgba | painéis translúcidos (`@utility glass`) |
| `--warning` / `--destructive` | `#FFB454` / `#FF5C7A` | | status |

Utilities próprias: `glass`, `text-gradient`, `ring-glow`, `gradient-border`, `.grain`, `.pulse-dot`. Easings: `--ease-out-expo`, `--ease-spring`.
Troca de tema usa `document.startViewTransition` (crossfade) quando disponível.

## Animações (motion v14, `motion/react`)

- Header e sidebar entram com slide/fade; rail de sessões anima largura com spring; item ativo usa `layoutId` (pílula desliza).
- Troca de sessão: `AnimatePresence mode="wait"` no painel do CV (fade + y + scale).
- Mensagens: entrada com blur→nítido; cards de skill com spring; toolbar flutuante em pílula com `whileHover/whileTap`.
- Estado vazio da sidebar: hero com stagger das 4 capacidades (não são botões — o agente decide quando chamar as skills).
- `prefers-reduced-motion`: o fluido não inicia e o fallback não anima.

## Componentes

- **AI Elements** (`components/ai-elements/`, gerados por `pnpm dlx ai-elements@latest add …`): `Conversation`, `Message/MessageResponse` (Streamdown), `PromptInput*`, `Tool/ToolHeader/ToolContent`, `Reasoning`, `Suggestion(s)`, `Shimmer`, `Sources`, `Task`, `CodeBlock`.
  - Não edite esses arquivos à mão; para atualizar: `pnpm dlx ai-elements@latest add <nome>` (sobrescreve).
  - Requer shadcn em modo **radix** (`components.json` → `radix-nova`).
- **shadcn/ui**: button, textarea, input, scroll-area, badge, separator, tooltip, tabs, dialog, progress (+ deps puxadas pelo AI Elements).
- **Tool cards** (`components/workspace/tool-cards/`): um por skill, recebem `part.output` tipado.

## vgpu — fluido interativo (fundo)

Adaptado do exemplo oficial **"Interactive Fluid"** (`npx vgpu examples pull fluid`): solver Navier-Stokes com advecção semi-Lagrangiana, confinamento de vorticidade, 3 iterações de Jacobi para pressão e projeção, tudo em compute shaders (grade 128×72, tinta 512×288).

- `components/ambient/fluid/*.wgsl`: shaders como módulos tipados (`import … from "./fluid-common.wgsl"`), carregados pelo `@vgpu/wgsl/loader-webpack` configurado em `next.config.ts` (regra Turbopack `*.wgsl` + webpack). Tipos em `src/wgsl-env.d.ts`.
- `advect-dye.wgsl`: emissores ociosos nas cores íris/aqua; rastro do cursor magenta↔ciano conforme a direção.
- `display.wgsl`: uniform `dark` escolhe composição aditiva (escuro) ou pastel (claro).
- `pointer-input.ts`: o canvas fica atrás da UI (`pointer-events: none`), então o movimento é lido no `window` e mapeado para o canvas; só mover o mouse já mexe a tinta.
- `renderer.ts`: passo fixo 1/60 s, pausa quando a aba está oculta, DPR limitado a 1.5, `onError` → fallback CSS.
- `ambient-canvas.tsx`: import dinâmico, `useSyncExternalStore` para detectar `navigator.gpu` sem mismatch de hidratação, grão SVG por cima.
- Validar shaders: `npx vgpu check src/components/ambient/fluid/*.wgsl`.

## Referências de design
- Claude Design (layout canvas + sidebar de chat)
- vgpu examples: https://vgpu.sh/examples (fluid, nextjs-flare, radiance-cascades)
- AI Elements showcase: https://elements.ai-sdk.dev
