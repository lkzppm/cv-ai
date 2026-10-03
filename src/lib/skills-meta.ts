import { SearchIcon, ListChecksIcon, GaugeIcon, Wand2Icon, type LucideIcon } from "lucide-react";

/** Rótulo curto do modelo exibido na UI (o id real vem de GROQ_MODEL no servidor). */
export const AGENT_MODEL_LABEL = "groq · gpt-oss-120b";

/** Metadados das skills para a UI (hero da sidebar e diálogo "sobre o agente"). */
export type SkillMeta = { key: string; icon: LucideIcon; title: string; desc: string; when: string };

export const SKILLS_META: SkillMeta[] = [
  {
    key: "role_matcher",
    icon: SearchIcon,
    title: "role_matcher",
    desc: "lê links de vagas e pesquisa o mercado em rodadas de web search",
    when: "quando você cola um link de vaga ou cita um cargo-alvo",
  },
  {
    key: "format_checker",
    icon: ListChecksIcon,
    title: "format_checker",
    desc: "confere padrões de mercado e compatibilidade com ATS",
    when: "em pedidos amplos como “analise meu CV” (roda antes do cv_scorer)",
  },
  {
    key: "cv_scorer",
    icon: GaugeIcon,
    title: "cv_scorer",
    desc: "nota 0–100 com rubrica de 6 dimensões e plano de melhoria",
    when: "quando você pede uma nota ou uma análise profunda",
  },
  {
    key: "cv_editor",
    icon: Wand2Icon,
    title: "cv_editor",
    desc: "reescreve o CV; você revisa e aplica com um clique",
    when: "quando você pede para reescrever, aplicar, adicionar ou mudar algo",
  },
];
