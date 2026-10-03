// Executa uma skill diretamente (sem o agente) para depuração.
import { createSkills } from "@/agent/skills";
import { SAMPLE_CV } from "@/lib/cv/sample";

const [name, json = "{}"] = process.argv.slice(2);
// Skill isolada: já marcamos como carregada (o load_skill é papel do agente).
const skills = createSkills({ cv: SAMPLE_CV, loaded: new Set(["role_matcher", "format_checker", "cv_scorer", "cv_editor"]) }) as unknown as Record<string, { execute?: (i: unknown, o: unknown) => Promise<unknown> }>;
const skill = skills[name];
if (!skill?.execute) throw new Error(`skill desconhecida: ${name}`);
const t0 = Date.now();
try {
  const out = await skill.execute(JSON.parse(json), { toolCallId: "dbg", messages: [] });
  console.log(`OK ${name} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(JSON.stringify(out, null, 2).slice(0, 4000));
} catch (e) {
  console.log(`ERR ${name} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.error(e);
}
