import { createGroq } from "@ai-sdk/groq";

/**
 * Provider Groq (LPU). A chave vem de GROQ_API_KEY.
 * Documentação: https://console.groq.com/docs/models
 */
export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/** Modelo principal do agente (tool calling + reasoning). */
export const AGENT_MODEL_ID = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

/** Modelo com a built-in tool `browser_search` da Groq (usado pela skill role_matcher). */
export const SEARCH_MODEL_ID =
  process.env.GROQ_SEARCH_MODEL ?? "openai/gpt-oss-120b";

/**
 * Modelo das chamadas internas das skills (generateObject do format_checker e cv_scorer).
 * A Groq aplica o rate limit POR modelo: usar um modelo diferente do agente
 * dobra o orçamento de tokens/min no free tier.
 */
export const SKILL_MODEL_ID = process.env.GROQ_SKILL_MODEL ?? AGENT_MODEL_ID;

export const agentModel = () => groq(AGENT_MODEL_ID);
export const skillModel = () => groq(SKILL_MODEL_ID);
export const searchModel = () => groq(SEARCH_MODEL_ID);

/** gpt-oss expõe reasoning; outros modelos ignoram estas opções. */
export const isReasoningModel = (id: string) => id.startsWith("openai/gpt-oss");
