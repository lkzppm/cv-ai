"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FileUpIcon, ClipboardPasteIcon, SparklesIcon, Loader2Icon, ArrowRightIcon, type LucideIcon } from "lucide-react";
import { CvAgentIcon } from "@/components/brand/cv-agent-icon";
import { SKILLS_META } from "@/lib/skills-meta";
import { useSessions } from "@/lib/store/sessions";
import { CV_FILE_ACCEPT, parseCvFile, titleFromFile } from "@/lib/cv/upload";
import { cn } from "@/lib/utils";

/**
 * Homepage: aparece quando não há nenhuma sessão (primeiro acesso ou depois
 * de excluir todas). Três formas de começar + o que o agente sabe fazer.
 */
export function HomeScreen() {
  const createSession = useSessions((s) => s.createSession);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const cv = await parseCvFile(file);
      createSession({ cv, title: titleFromFile(file) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // O cartão de upload é um <label> do input escondido: abre o seletor sem ref.
  const actions: { icon: LucideIcon; title: string; desc: string; primary?: boolean; onClick?: () => void }[] = [
    {
      icon: FileUpIcon,
      title: "Enviar meu currículo",
      desc: "PDF, Markdown ou texto. O arquivo vira Markdown editável.",
      primary: true,
    },
    {
      icon: ClipboardPasteIcon,
      title: "Colar o texto",
      desc: "Abre o editor em branco para você colar o conteúdo.",
      onClick: () => createSession({ cv: "", title: "Meu currículo" }),
    },
    {
      icon: SparklesIcon,
      title: "Testar com um exemplo",
      desc: "Um CV fictício pronto para analisar, pontuar e reescrever.",
      onClick: () => createSession({ title: "Exemplo · Ana Souza" }),
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
      className="mx-auto flex min-h-full max-w-[860px] flex-col justify-center gap-10 pb-16"
    >
      <input
        id="home-cv-file"
        type="file"
        accept={CV_FILE_ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onUpload(f);
        }}
      />

      {/* marca + tagline */}
      <motion.div variants={fadeUp} className="flex flex-col items-center text-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="mb-4 text-primary">
          <CvAgentIcon className="size-20" strokeWidth={1.5} />
        </motion.div>
        <h1 className="text-[34px] font-semibold tracking-tight md:text-[40px]">
          CV<span className="text-gradient">Agent</span>
        </h1>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-snug text-muted-foreground">
          Um agente que lê o seu currículo, decide sozinho qual skill usar e aponta no documento tudo o que encontrar.
        </p>
      </motion.div>

      {/* como começar */}
      <motion.div variants={fadeUp} className="grid gap-3 md:grid-cols-3">
        {actions.map((a) => {
          const Card = a.primary ? motion.label : motion.button;
          return (
          <Card
            key={a.title}
            {...(a.primary ? { htmlFor: "home-cv-file" } : { type: "button" as const, onClick: a.onClick, disabled: uploading })}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className={cn(
              "group flex cursor-pointer flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-60",
              a.primary
                ? "gradient-border border-primary/30 bg-card/70 shadow-[0_24px_60px_-32px_rgba(0,0,0,.5)]"
                : "border-glass-border bg-background/30 hover:border-primary/40",
              a.primary && uploading && "pointer-events-none opacity-60",
            )}
          >
            <span className={cn("grid size-10 place-items-center rounded-xl ring-1", a.primary ? "bg-primary text-primary-foreground ring-primary" : "bg-background/40 text-primary ring-primary/20")}>
              {a.primary && uploading ? <Loader2Icon className="size-5 animate-spin" /> : <a.icon className="size-5" />}
            </span>
            <span>
              <span className="flex items-center gap-1.5 text-[15px] font-medium">
                {a.title}
                <ArrowRightIcon className="size-3.5 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">{a.desc}</span>
            </span>
          </Card>
          );
        })}
      </motion.div>
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-6 text-center text-xs text-destructive">
          {error}
        </motion.p>
      )}

      {/* skills */}
      <motion.div variants={fadeUp}>
        <div className="mb-2 px-1 text-center text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          O que ele sabe fazer
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SKILLS_META.map((s) => (
            <li key={s.key} className="flex gap-2.5 rounded-xl border border-glass-border bg-background/20 p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-background/40 text-primary ring-1 ring-primary/20">
                <s.icon className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[11.5px] font-semibold text-primary">{s.title}</span>
                <span className="block text-[12px] leading-snug text-muted-foreground">{s.desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Sessões, versões do CV e conversas ficam só no seu navegador.
        </p>
      </motion.div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};
