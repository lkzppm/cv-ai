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
export type SkillDoc = {
  name: string;
  description: string;
  /** Corpo do SKILL.md sem o frontmatter. */
  instructions: string;
};

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
  };
  cache.set(name, doc);
  return doc;
}

/** Bloco de texto com todas as skills para o system prompt. */
export function renderSkillsForPrompt(docs: SkillDoc[]): string {
  return docs
    .map((d) => `<skill name="${d.name}">\n${d.description}\n\n${d.instructions}\n</skill>`)
    .join("\n\n");
}
