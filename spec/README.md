# spec/ — base de conhecimento do projeto

Documentos curtos e estáveis para qualquer sessão (humana ou Claude Code) retomar o trabalho sem reler o código inteiro. Leia nesta ordem:

| Arquivo | O que contém |
|---|---|
| [00-overview.md](00-overview.md) | Objetivo do trabalho, enunciado da disciplina, visão do produto |
| [01-architecture.md](01-architecture.md) | Stack, fluxo de dados, árvore de pastas, decisões |
| [02-agent-and-skills.md](02-agent-and-skills.md) | Contrato de uma skill, as 4 skills, como criar uma nova |
| [03-ui-design.md](03-ui-design.md) | Layout em 3 colunas, paleta LinkedIn, componentes AI Elements, vgpu |
| [04-stack-and-versions.md](04-stack-and-versions.md) | Versões fixadas, comandos de instalação, links de referência |
| [05-roadmap.md](05-roadmap.md) | Status atual, próximos passos, ideias |

Regras de manutenção:
- Atualize o spec quando mudar uma decisão, não quando mudar uma linha de código.
- Datas sempre absolutas (ex.: 2026-10-03).
- O `CLAUDE.md` na raiz aponta para cá; não duplique conteúdo lá.
