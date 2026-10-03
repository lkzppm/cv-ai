import { ToolLoopAgent, stepCountIs, type InferAgentUIMessage } from "ai";
import { AGENT_MODEL_ID, agentModel, isReasoningModel } from "./models";
import { buildInstructions } from "./prompts";
import { createSkills, type SkillContext } from "./skills";

/**
 * Cria o agente para uma requisição. O CV entra pelo contexto e é fechado
 * dentro das skills, por isso instanciamos por request (é barato).
 */
export function createCvAgent(ctx: SkillContext) {
  return new ToolLoopAgent({
    model: agentModel(),
    instructions: buildInstructions(ctx.cv),
    tools: createSkills(ctx),
    stopWhen: stepCountIs(8),
    temperature: 0.3,
    providerOptions: isReasoningModel(AGENT_MODEL_ID)
      ? { groq: { reasoningFormat: "parsed", reasoningEffort: "low", parallelToolCalls: false } }
      : { groq: { parallelToolCalls: false } },
  });
}

export type CvAgent = ReturnType<typeof createCvAgent>;
/** Tipo das mensagens de UI com as tools tipadas (usado no useChat). */
export type CvAgentUIMessage = InferAgentUIMessage<CvAgent>;
