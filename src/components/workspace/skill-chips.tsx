"use client";

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";

export type SkillChip = { label: string; prompt: string; mode: "send" | "fill" };

export const SKILL_CHIPS: SkillChip[] = [
  { label: "✔ Verificar formato", prompt: "Rode o format_checker no meu CV e me diga o que corrigir.", mode: "send" },
  { label: "★ Dar nota ao CV", prompt: "Faça uma análise profunda com o cv_scorer e me dê a nota.", mode: "send" },
  { label: "⌕ Comparar com vaga", prompt: "Compare meu CV com esta vaga: <cole o link do LinkedIn aqui>", mode: "fill" },
  { label: "✎ Reescrever resumo", prompt: "Reescreva meu resumo profissional para ficar mais forte e aplique com o cv_editor.", mode: "send" },
];

export function SkillChips({ onPick }: { onPick: (chip: SkillChip) => void }) {
  return (
    <Suggestions className="px-3 pb-2">
      {SKILL_CHIPS.map((c) => (
        <Suggestion key={c.label} suggestion={c.prompt} onClick={() => onPick(c)}>
          {c.label}
        </Suggestion>
      ))}
    </Suggestions>
  );
}
