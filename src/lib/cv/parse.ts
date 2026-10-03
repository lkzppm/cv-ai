/**
 * Parser heurístico de currículo em Markdown/texto.
 * Usado pela skill format_checker (checagens determinísticas) e para dar
 * contexto estruturado ao modelo.
 */

export type CvSection = {
  title: string;
  normalized: SectionKind;
  bullets: string[];
  text: string;
};

export type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "other";

export type ParsedCv = {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  wordCount: number;
  estimatedPages: number;
  sections: CvSection[];
  bullets: string[];
  hasDates: boolean;
  firstPersonHits: number;
  quantifiedBullets: number;
  actionVerbBullets: number;
};

const SECTION_ALIASES: Record<SectionKind, string[]> = {
  summary: ["resumo", "sumário", "summary", "perfil", "profile", "objetivo", "objective", "about"],
  experience: ["experiência", "experiencia", "experience", "histórico profissional", "work", "emprego", "carreira"],
  education: ["educação", "educacao", "formação", "formacao", "education", "acadêmic", "academic"],
  skills: ["habilidades", "skills", "competências", "competencias", "tecnologias", "technologies", "stack", "ferramentas"],
  projects: ["projetos", "projects", "portfólio", "portfolio"],
  certifications: ["certificações", "certificacoes", "certifications", "cursos", "courses", "licenças"],
  languages: ["idiomas", "languages", "línguas"],
  other: [],
};

/** Verbos de ação (PT + EN) que abrem bullets fortes. */
export const ACTION_VERBS = [
  "liderei","lidero","desenvolvi","desenvolvo","criei","implementei","implemento","reduzi","aumentei","otimizei","automatizei",
  "projetei","construí","gerenciei","coordenei","entreguei","migrei","lancei","negociei","treinei","mentorei","analisei",
  "arquitetei","escalei","integrei","padronizei","defini","conduzi","planejei","executei","supervisionei","modelei",
  "led","built","developed","created","implemented","reduced","increased","optimized","automated","designed","managed",
  "coordinated","delivered","migrated","launched","negotiated","trained","mentored","analyzed","architected","scaled",
  "integrated","standardized","defined","drove","planned","executed","supervised","modeled","improved","owned","shipped",
];

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(\+?\d{1,3}[\s-]?)?\(?\d{2,3}\)?[\s-]?\d{4,5}[\s-]?\d{4}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[\w-]+/i;
const GITHUB_RE = /github\.com\/[\w-]+/i;
const DATE_RE = /\b(19|20)\d{2}\b|\b(jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)[a-z]*\.?\s*(\/|de)?\s*(19|20)?\d{2}\b|\b(atual|present|current|presente)\b/i;
const FIRST_PERSON_RE = /\b(eu|meu|minha|meus|minhas|I|my|me)\b/g;
const QUANT_RE = /\d+\s?%|\bR?\$\s?\d|\d+\s?(k|mil|milh|m|x|usuários|users|clientes|customers|pessoas|people|projetos|projects|horas|hours|dias|days)\b|\d{2,}/i;

function normalizeSection(title: string): SectionKind {
  const t = title.toLowerCase();
  for (const [kind, aliases] of Object.entries(SECTION_ALIASES) as [SectionKind, string[]][]) {
    if (aliases.some((a) => t.includes(a))) return kind;
  }
  return "other";
}

export function parseCv(markdown: string): ParsedCv {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const sections: CvSection[] = [];
  let current: CvSection | null = null;
  let name: string | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const title = heading[2].replace(/[*_`]/g, "").trim();
      if (heading[1] === "#" && !name) {
        name = title;
        continue;
      }
      current = { title, normalized: normalizeSection(title), bullets: [], text: "" };
      sections.push(current);
      continue;
    }
    // Linha em caixa alta isolada também conta como título (CVs em texto puro)
    if (!heading && line.length > 2 && line.length < 40 && line === line.toUpperCase() && /[A-ZÀ-Ú]/.test(line)) {
      current = { title: line, normalized: normalizeSection(line), bullets: [], text: "" };
      sections.push(current);
      continue;
    }
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    if (current) {
      if (bullet) current.bullets.push(bullet[1].trim());
      current.text += line + "\n";
    } else if (!name && line && !EMAIL_RE.test(line) && !PHONE_RE.test(line)) {
      name = line.replace(/[*_#]/g, "").trim();
    }
  }

  const bullets = sections.flatMap((s) => s.bullets);
  const words = markdown.split(/\s+/).filter(Boolean);
  const firstPersonHits = (markdown.match(FIRST_PERSON_RE) ?? []).length;

  return {
    name,
    email: markdown.match(EMAIL_RE)?.[0],
    phone: markdown.match(PHONE_RE)?.[0],
    linkedin: markdown.match(LINKEDIN_RE)?.[0],
    github: markdown.match(GITHUB_RE)?.[0],
    wordCount: words.length,
    estimatedPages: Math.max(1, Math.round((words.length / 550) * 10) / 10),
    sections,
    bullets,
    hasDates: DATE_RE.test(markdown),
    firstPersonHits,
    quantifiedBullets: bullets.filter((b) => QUANT_RE.test(b)).length,
    actionVerbBullets: bullets.filter((b) => {
      const first = b.toLowerCase().replace(/[^a-zà-ú]/gi, " ").trim().split(/\s+/)[0];
      return ACTION_VERBS.includes(first);
    }).length,
  };
}

export function hasSection(cv: ParsedCv, kind: SectionKind) {
  return cv.sections.some((s) => s.normalized === kind);
}
