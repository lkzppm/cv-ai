"use client";

import { motion } from "motion/react";
import { FileUpIcon, MessageSquareTextIcon, CheckCheckIcon, CheckCircle2Icon } from "lucide-react";
import { CvAgentIcon } from "@/components/brand/cv-agent-icon";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Analise meu CV",
  "Dê uma nota ao meu currículo",
  "Compare com esta vaga: <link>",
  "Reescreva meu resumo profissional",
];

type Props = {
  cv: { empty: boolean; name?: string; words: number };
  onExample: (text: string) => void;
};

/**
 * Estado vazio da sessão: saudação, três passos (com o 1º refletindo se o CV
 * já está carregado) e exemplos que só preenchem o campo — quem decide qual
 * skill chamar continua sendo o agente.
 */
export function EmptyHero({ cv, onExample }: Props) {
  const steps = [
    {
      icon: FileUpIcon,
      title: cv.empty ? "Coloque seu CV no painel" : "CV carregado",
      desc: cv.empty
        ? "Cole o texto em Editar ou envie um PDF pela barra de ferramentas."
        : `${cv.name ?? "Documento"} · ${cv.words} palavras. Pode editar a qualquer momento.`,
      done: !cv.empty,
    },
    {
      icon: MessageSquareTextIcon,
      title: "Diga o que você precisa",
      desc: "Uma análise, uma nota, uma vaga para comparar ou uma mudança no texto.",
      done: false,
    },
    {
      icon: CheckCheckIcon,
      title: "Revise e aplique",
      desc: "Resultados aparecem em cards aqui; alterações só entram no CV quando você aplicar.",
      done: false,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      className="flex min-h-full flex-col justify-center gap-6 px-2 py-6"
    >
      <motion.div variants={fadeUp} className="flex flex-col items-center text-center">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-3 text-primary"
        >
          <CvAgentIcon className="size-14" strokeWidth={1.6} />
        </motion.div>
        <h2 className="text-[22px] font-semibold tracking-tight">Olá, sou o CV Agent.</h2>
        <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-snug text-muted-foreground">
          Eu leio o currículo desta sessão e escolho sozinho a ferramenta certa para cada pedido.
        </p>
      </motion.div>

      <motion.ol variants={fadeUp} className="relative space-y-1">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 rounded-2xl p-2.5">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full ring-1 transition-colors",
                  s.done ? "bg-primary text-primary-foreground ring-primary" : "bg-background/40 text-primary ring-primary/25",
                )}
              >
                {s.done ? <CheckCircle2Icon className="size-4" /> : <s.icon className="size-4" />}
              </span>
              {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-primary/30 to-transparent" />}
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex items-center gap-2 text-[13.5px] font-medium">
                <span className="text-[10.5px] font-semibold text-muted-foreground">0{i + 1}</span>
                {s.title}
              </div>
              <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </motion.ol>

      <motion.div variants={fadeUp}>
        <div className="mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Exemplos
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((e) => (
            <motion.button
              key={e}
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onExample(e)}
              className="rounded-full border border-glass-border bg-background/40 px-3 py-1.5 text-[12.5px] text-foreground/85 transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {e}
            </motion.button>
          ))}
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">Clicar só preenche o campo; você edita e envia.</p>
      </motion.div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};
