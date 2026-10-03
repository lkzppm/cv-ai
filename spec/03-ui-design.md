# 03 — UI e design

## Layout (inspirado no Claude Design)

```
┌──────────── header (logo · tema) ────────────────────────────────────────────┐
│ sessões │           CV atual (Markdown renderizado)          │ Agente         │
│ (rail,  │  toolbar: PDF/texto · Desfazer · Editar · .md · 🖨  │ conversa       │
│ 240px)  │  ┌──────────────── folha branca ────────────────┐  │ (AI Elements)  │
│         │  │ # Nome                                        │  │ cards de skill │
│         │  │ contato                                       │  │ chips de skill │
│         │  │ ## Experiência …                              │  │ prompt input   │
│         │  └──────────────────────────────────────────────┘  │ (420–480px)    │
└──────────────────────────────────────────────────────────────────────────────┘
          fundo: vgpu (WebGPU) com blobs azuis · fallback CSS
```

- `< lg`: a sidebar do agente fica oculta (TODO: drawer). O rail esquerdo colapsa pelo botão do header.
- O painel do CV tem `print-area`: `window.print()` imprime só a folha (salvar como PDF).

## Paleta "LinkedIn blue" (tokens em `globals.css`)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--primary` | `#0A66C2` | `#378FE9` | botões, títulos de seção do CV, ícones |
| `--brand-navy` | `#004182` | `#70B5F9` | H1 do CV |
| `--brand-sky` | `#70B5F9` | `#378FE9` | gradientes/ambient |
| `--accent` | `#E8F3FF` | `#16314D` | hover, destaques |
| `--background` | `#F3F6FA` | `#0A1726` | fundo |
| `--card` | `#FFFFFF` | `#10223A` | folha do CV, header |
| `--success` / `--warning` / `--destructive` | verde/âmbar/vermelho | | status das checagens |

Tema escuro = classe `.dark` no `<html>` (store `theme`, `ThemeApplier`).

## Componentes

- **AI Elements** (`components/ai-elements/`, gerados por `pnpm dlx ai-elements@latest add …`): `Conversation`, `Message/MessageResponse` (Streamdown), `PromptInput*`, `Tool/ToolHeader/ToolContent`, `Reasoning`, `Suggestion(s)`, `Shimmer`, `Sources`, `Task`, `CodeBlock`.
  - Não edite esses arquivos à mão; para atualizar: `pnpm dlx ai-elements@latest add <nome>` (sobrescreve).
  - Requer shadcn em modo **radix** (`components.json` → `radix-nova`).
- **shadcn/ui**: button, textarea, input, scroll-area, badge, separator, tooltip, tabs, dialog, progress (+ deps puxadas pelo AI Elements).
- **Tool cards** (`components/workspace/tool-cards/`): um por skill, recebem `part.output` tipado.

## vgpu (fundo ambiente)

- `components/ambient/ambient.ts`: shader WGSL inline (3 blobs gaussianos nas cores da paleta, vinheta, uniform `dark`), `init() → surface → effect → frameLoop`.
- `ambient-canvas.tsx`: `"use client"`, import dinâmico (WebGPU só existe no browser), respeita `prefers-reduced-motion`, fallback `.ambient-fallback` (gradientes CSS) quando `navigator.gpu` não existe ou `init()` falha.
- Cleanup no `useEffect` é obrigatório (StrictMode monta duas vezes).
- Validar shader: `npx vgpu check` (só para arquivos `.wgsl`; o nosso é inline).

## Referências de design
- Claude Design (layout canvas + sidebar de chat)
- LinkedIn brand colors: #0A66C2 / #004182 / #70B5F9
- AI Elements showcase: https://elements.ai-sdk.dev
