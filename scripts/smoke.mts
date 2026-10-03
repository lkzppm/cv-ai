import { createCvAgent } from "@/agent";
import { SAMPLE_CV } from "@/lib/cv/sample";

const scenario = process.argv[2] ?? "format";
const prompts: Record<string, string> = {
  hello: "olá",
  format: "Veja se meu CV está no padrão de formato do mercado atualmente",
  score: "Dê uma nota ao meu currículo",
  analyze: "Analise meu CV",
  role: "Compare meu CV com a vaga de Engenheira de Software Pleno em fintech (sem link)",
  rolelink: "Compare com esta vaga: https://www.gupy.io/vagas",
  edit: "Reescreva meu resumo profissional de forma mais impactante",
};

const agent = createCvAgent({ cv: SAMPLE_CV });
const t0 = Date.now();
const result = await agent.generate({
  messages: [{ role: "user", content: prompts[scenario] }],
});
console.log(`\n=== ${scenario} (${((Date.now() - t0) / 1000).toFixed(1)}s, steps=${result.steps.length}) ===`);
for (const step of result.steps) {
  for (const c of step.toolCalls) console.log("TOOL CALL", c.toolName, JSON.stringify(c.input).slice(0, 300));
  for (const r of step.toolResults) {
    const out = JSON.stringify(r.output);
    console.log("TOOL RESULT", r.toolName, out.length, "chars:", out.slice(0, 500));
  }
}
console.log("\nTEXT:\n", result.text.slice(0, 1500));
