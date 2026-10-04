import { convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from "ai";
import { createCvAgent, type CvAgentUIMessage } from "@/agent";
import { SKILL_NAMES, type SkillName } from "@/agent/skills";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY não configurada. Copie .env.example para .env.local." }, { status: 500 });
  }
  const { messages, cv = "" }: { messages: CvAgentUIMessage[]; cv?: string } = await req.json();

  // Skills carregadas em turnos anteriores continuam carregadas (o SKILL.md já está no histórico).
  const loaded = new Set<SkillName>();
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "tool-load_skill" && p.state === "output-available") {
        for (const s of p.output.skills) loaded.add(s.name);
        continue;
      }
      // Tool executada sem load_skill: a skill foi carregada implicitamente naquela chamada.
      if (p.type.startsWith("tool-") && "state" in p && p.state === "output-available") {
        const name = p.type.slice(5) as SkillName;
        const out = (p as { output?: { autoLoaded?: boolean } }).output;
        if (SKILL_NAMES.includes(name) && out?.autoLoaded) loaded.add(name);
      }
    }
  }

  const agent = createCvAgent({ cv, loaded });
  const result = await agent.stream({
    // `tools` aqui é obrigatório para que `toModelOutput` enxugue os resultados antigos do histórico.
    messages: await convertToModelMessages(messages, { tools: agent.tools }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      sendReasoning: true,
      sendSources: true,
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    }),
  });
}
