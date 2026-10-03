---
name: role_matcher
description: Recebe links de vagas (LinkedIn, Gupy, Greenhouse, etc.) ou o nome de um cargo, faz rodadas de web search e devolve os requisitos, palavras-chave e um mapa de aderência do CV atual àquela vaga.
---

## Quando usar
- O usuário colou um ou mais links de vaga, ou citou um cargo/empresa-alvo ("quero vaga de Dev Pleno na Nubank").
- O usuário perguntou "meu CV serve para X?", "o que falta para a vaga Y?".

## Como funciona (rodadas)
1. **Rodada 0 – fetch direto:** tenta baixar a página da vaga. O LinkedIn geralmente bloqueia; se vier vazio, segue para a busca.
2. **Rodada 1 – vaga:** web search para recuperar título, empresa, requisitos obrigatórios, desejáveis e responsabilidades.
3. **Rodada 2 – mercado:** web search sobre o que o mercado pede para esse cargo hoje (skills, certificações, senioridade, keywords de ATS).
4. **Síntese:** cruza os requisitos com o CV atual e produz `matched`, `missing` e `suggestions`.

## Como apresentar o resultado
- Comece pelo **match score** e pelas 3 lacunas mais importantes.
- Liste keywords que o CV deveria conter *exatamente* (ATS faz match literal).
- Nunca invente experiência: sugira como *reposicionar* o que já existe ou o que o usuário precisa aprender.
- Ofereça em seguida chamar `cv_editor` para aplicar as mudanças.
