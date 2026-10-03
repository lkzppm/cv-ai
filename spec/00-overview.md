# 00 — Visão geral

## Enunciado (disciplina de Inteligência Artificial)

> **Criação de Agente.** Construa passo a passo a implementação de um agente que analise currículos e que use *skills* para esta tarefa. Mostre o código e os softwares a serem instalados e usados.

## Produto: CV Agent

Uma aplicação web no estilo "Claude Design", mas para currículos:

- **Painel principal:** o CV atual do usuário (Markdown renderizado, editável, importável de PDF, exportável).
- **Sidebar direita:** chat com o agente + chips de skills + cards com resultados das skills + propostas de alteração com botão *Aplicar*.
- **Rail esquerdo:** sessões (cada sessão = um CV + histórico de versões + conversa), persistidas no `localStorage`.

## O agente

Um *tool-loop agent* (AI SDK `ToolLoopAgent`) rodando um modelo da **Groq** que decide quando chamar cada skill:

| Skill | Pergunta que responde |
|---|---|
| `role_matcher` | "Meu CV serve para esta vaga? O que falta?" — recebe links (LinkedIn etc.), faz rodadas de web search |
| `format_checker` | "Meu CV segue os padrões do mercado / ATS?" — checklist pass/warn/fail |
| `cv_scorer` | "Que nota meu CV merece e por quê?" — rubrica ponderada 0–100 |
| `cv_editor` | "Aplique essas melhorias" — devolve o CV inteiro reescrito para o usuário aprovar |

Cada skill tem um `SKILL.md` (conhecimento em linguagem natural, injetado no prompt) e um `index.ts` (tool executável com schema `zod`). Isso materializa o conceito de *skills* pedido no trabalho: conhecimento + capacidade, carregados de forma modular.

## Critérios de sucesso para a entrega

1. Rodar localmente com apenas `GROQ_API_KEY`.
2. Demonstrar as 4 skills a partir do chat (os chips já disparam cada uma).
3. README em português com passo a passo, softwares e trechos de código.
