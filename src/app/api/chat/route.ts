import { convertToModelMessages, createUIMessageStreamResponse, toUIMessageStream } from "ai";
import { createCvAgent, type CvAgentUIMessage } from "@/agent";

export const maxDuration = 120;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "GROQ_API_KEY não configurada. Copie .env.example para .env.local." }, { status: 500 });
  }
  const { messages, cv = "" }: { messages: CvAgentUIMessage[]; cv?: string } = await req.json();

  const agent = createCvAgent({ cv });
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
