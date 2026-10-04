import fs from "node:fs";
import path from "node:path";

/**
 * Registry de skills.
 *
 * Cada skill vive em `src/agent/skills/<nome>/` com:
 *  - SKILL.md  → conhecimento/instruções em linguagem natural (frontmatter: name, description)
 *  - index.ts  → implementação executável (tool do AI SDK com schema zod)
 *
 * O SKILL.md é lido em tempo de execução e injetado no system prompt, no
 * mesmo espírito do padrão "Agent Skills" (instruções progressivas que o
 * modelo carrega quando precisa).
 */
/** Remove do SKILL.md as seções que só interessam ao código (como funciona, padrões de referência). */
export function agentRelevant(body: string) {
  return body
    .split(/\n(?=## )/)
    .filter((section) => !/^## (como funciona|padr(ões|oes) de refer)/i.test(section))
    .join("\n")
    .trim();
}

/** Texto que acompanha o resultado quando a tool rodou sem `load_skill` antes. */
export function autoLoadNote(doc: SkillDoc) {
  return `A skill "${doc.name}" não tinha sido carregada; foi carregada agora junto com esta execução. Apresente o resultado seguindo estas instruções:\n\n${agentRelevant(doc.instructions)}`;
}

export type SkillDoc = {
  name: string;
  description: string;
  /** Corpo do SKILL.md sem o frontmatter (usado pelas chamadas internas da skill). */
  instructions: string;
  /**
   * Só a seção "Quando usar" — é o que vai para o system prompt. O restante
   * (regras, rubrica, como apresentar) entra via `load_skill` quando o agente
   * decide usar a skill (carregamento progressivo; economiza tokens no free tier).
   */
  agentInstructions: string;
};

/** Mantém apenas as seções `## Quando usar…`. */
export function agentFacing(body: string): string {
  return body
    .split(/^(?=## )/m)
    .filter((p) => /^## quando usar/i.test(p.trim()))
    .join("")
    .trim();
}

const SKILLS_DIR = path.join(process.cwd(), "src", "agent", "skills");
const cache = new Map<string, SkillDoc>();

export function loadSkillDoc(name: string): SkillDoc {
  const cached = cache.get(name);
  if (cached && process.env.NODE_ENV === "production") return cached;

  const file = path.join(SKILLS_DIR, name, "SKILL.md");
  const raw = fs.readFileSync(file, "utf8");
  const fm = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  const meta: Record<string, string> = {};
  let body = raw;
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    }
    body = fm[2];
  }
  const doc: SkillDoc = {
    name: meta.name ?? name,
    description: meta.description ?? "",
    instructions: body.trim(),
    agentInstructions: agentFacing(body),
  };
  cache.set(name, doc);
  return doc;
}

/** Bloco de texto com todas as skills para o system prompt. */
export function renderSkillsForPrompt(docs: SkillDoc[]): string {
  return docs
    .map((d) => `<skill name="${d.name}">\n${d.description}\n\n${d.agentInstructions}\n</skill>`)
    .join("\n\n");
}
