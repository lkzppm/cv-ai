# 04 — Stack, versões e instalação

Versões fixadas em 2026-10-03 (`package.json` é a fonte da verdade):

| Pacote | Versão | Nota |
|---|---|---|
| node | 26.x (testado em 26.7) | ≥ 20 funciona |
| pnpm | 11.x | `packageManager` no package.json |
| next | 16.3.8 | App Router, Turbopack padrão, `LayoutProps<"/">` gerado por `next typegen` |
| react / react-dom | 19.2.x | |
| ai | 7.0.x | `ToolLoopAgent`, `stepCountIs`, `toUIMessageStream`, `createUIMessageStreamResponse` |
| @ai-sdk/react | 4.0.x | `useChat`, `DefaultChatTransport` |
| @ai-sdk/groq | 4.0.x | `createGroq`, `groq.tools.browserSearch` |
| zod | 4.x | schemas das tools |
| zustand | 5.x | store persistida |
| tailwindcss | 4.x | `@theme inline` |
| shadcn | 4.21 (CLI) | `components.json` style `radix-nova` + pacote `radix-ui` |
| ai-elements | 1.9 (CLI) | registry https://elements.ai-sdk.dev/api/registry/<nome>.json |
| vgpu | 0.5.0 | WebGPU; `@vgpu/adapter-node` e `webgpu` têm build scripts ignorados (`pnpm-workspace.yaml`) |
| @vgpu/wgsl, @vgpu/wgsl-std | 0.5.0 (dev) | loader `.wgsl` para Turbopack/webpack + stdlib WGSL (noise, hash, color) |
| motion | 14.x | animações (`motion/react`): AnimatePresence, layoutId, springs |
| unpdf | 1.8.x | `getDocumentProxy` + `extractText` |
| react-markdown + remark-gfm | 10.x / 4.x | render do CV |

## Softwares a instalar (do zero)

1. **Node.js ≥ 20** — https://nodejs.org
2. **pnpm** — `npm i -g pnpm`
3. **Git** + conta no GitHub
4. **Chave da Groq** — https://console.groq.com/keys (gratuita)
5. (opcional) **Chrome/Edge recentes** para WebGPU; sem isso o fundo usa CSS.

## Comandos de instalação usados neste repo (reprodutível)

```bash
pnpm create next-app@latest cv-ai --ts --tailwind --eslint --app --src-dir --use-pnpm --import-alias "@/*"
cd cv-ai
pnpm add ai @ai-sdk/react @ai-sdk/groq zod zustand react-markdown remark-gfm unpdf vgpu lucide-react radix-ui
pnpm dlx shadcn@latest init --base radix --preset nova --template next --yes
pnpm dlx shadcn@latest add button textarea input scroll-area badge separator tooltip tabs dialog progress
pnpm dlx ai-elements@latest add conversation message prompt-input tool reasoning sources suggestion shimmer task
```

## Comandos do dia a dia

```bash
pnpm dev          # http://localhost:3000
pnpm build        # checagem de tipos + build
pnpm lint
pnpm exec tsc --noEmit
```

## Links
- AI SDK: https://ai-sdk.dev/docs (migração 7.0: https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0)
- Groq models: https://console.groq.com/docs/models · built-in tools: https://console.groq.com/docs/tool-use/built-in-tools
- AI Elements: https://elements.ai-sdk.dev · repo: https://github.com/vercel/ai-elements
- vgpu: https://github.com/vercel-labs/vgpu
- Next.js docs locais (versão exata): `node_modules/next/dist/docs/`

## Scripts de teste (adicionado 2026-10-03)

- `tsx` (devDependency) roda `scripts/smoke.mts` (agente completo por cenário) e `scripts/skill.mts` (uma skill isolada) com `--env-file=.env.local`. Arquivos `.mts` porque o `tsx` compila `.ts` como CJS e rejeita top-level `await`.
- `pnpm approve-builds esbuild` foi necessário uma vez (pnpm 11 bloqueia scripts de pós-instalação por padrão).
