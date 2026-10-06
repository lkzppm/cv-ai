"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { InfoIcon, SparklesIcon, LayersIcon, BotIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SKILLS_META } from "@/lib/skills-meta";
import { cn } from "@/lib/utils";

type SectionKey = "overview" | "skills" | "stack";

const SECTIONS: { key: SectionKey; label: string; icon: typeof BotIcon }[] = [
  { key: "overview", label: "Visão geral", icon: BotIcon },
  { key: "skills", label: "Skills", icon: SparklesIcon },
  { key: "stack", label: "Stack", icon: LayersIcon },
];

const STACK: { name: string; role: string; href: string }[] = [
  { name: "Next.js 16", role: "App Router, Turbopack e route handlers da API do agente", href: "https://nextjs.org" },
  { name: "Vercel AI SDK 7", role: "ToolLoopAgent, tools tipadas com zod e streaming para o useChat", href: "https://ai-sdk.dev" },
  { name: "Groq · gpt-oss-20b + 120b", role: "20b decide e responde; 120b avalia (skills) e busca na web", href: "https://console.groq.com/docs/models" },
  { name: "AI Elements + shadcn/ui", role: "Componentes de conversa, mensagens, tools e reasoning", href: "https://elements.ai-sdk.dev" },
  { name: "vgpu (WebGPU)", role: "Fundo com documentos esboçados em shader WGSL", href: "https://github.com/vercel-labs/vgpu" },
  { name: "motion", role: "Transições e micro-interações da interface", href: "https://motion.dev" },
  { name: "zustand + unpdf", role: "Sessões no navegador e extração de texto de PDF", href: "https://github.com/pmndrs/zustand" },
];

/** Botão "i" do header: diálogo com sub-menu (visão geral · skills · stack). */
export function AboutDialog() {
  const [section, setSection] = useState<SectionKey>("overview");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full text-muted-foreground hover:text-foreground" aria-label="Sobre o agente">
          <InfoIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl p-0 sm:max-w-[720px]">
        <DialogTitle className="sr-only">Sobre o CV Agent</DialogTitle>
        <DialogDescription className="sr-only">O que o agente é, quais skills tem e com que tecnologias foi feito.</DialogDescription>

        <div className="grid max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)] sm:min-h-[440px] sm:grid-cols-[180px_1fr] sm:grid-rows-1">
          {/* sub-menu: abas no topo no celular (pr-12 = espaço do botão de fechar), coluna a partir de sm */}
          <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-glass-border bg-background/20 p-2 pr-12 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3">
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] whitespace-nowrap transition-colors sm:gap-2.5 sm:px-3",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="about-active"
                      className="absolute inset-0 rounded-xl bg-accent ring-1 ring-primary/25"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <s.icon className={cn("relative size-4", active && "text-primary")} />
                  <span className="relative">{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* conteúdo */}
          <div className="relative min-w-0 overflow-y-auto p-4 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4 text-sm"
              >
                {section === "overview" && <Overview />}
                {section === "skills" && <Skills />}
                {section === "stack" && <Stack />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-tight">{children}</h3>
      {sub && <p className="mt-1 text-[13px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Overview() {
  return (
    <>
      <SectionTitle sub="Um agente de IA que analisa, pontua e reescreve currículos usando skills.">
        O que é
      </SectionTitle>
      <ol className="space-y-2">
        {[
          ["Você fala, ele decide", "Não há botões de skill. O agente interpreta o pedido, carrega as instruções da skill (SKILL.md) e só então executa a tool — você vê os dois momentos no chat."],
          ["O CV é o contexto", "O documento do painel é enviado a cada mensagem; edições feitas por você valem na hora. As tools apontam no CV, com retângulos tracejados, cada trecho que citam."],
          ["Nada muda sem você", "Propostas do cv_editor viram um diff no próprio CV: você aceita ou recusa bloco a bloco, e dá para desfazer."],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-2xl border border-glass-border bg-background/30 p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{i + 1}</span>
            <div>
              <div className="font-medium">{t}</div>
              <div className="text-[12.5px] leading-snug text-muted-foreground">{d}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[12px] text-muted-foreground">
        Sessões, versões do CV e conversas ficam apenas no seu navegador. Trabalho da disciplina de Inteligência Artificial.
      </p>
    </>
  );
}

function Skills() {
  const [open, setOpen] = useState(SKILLS_META[0].key);
  return (
    <>
      <SectionTitle sub="Cada skill é um par SKILL.md (conhecimento) + código executável. Clique para ver quando o agente usa.">
        Skills
      </SectionTitle>
      <ul className="space-y-1.5">
        {SKILLS_META.map((s) => {
          const active = open === s.key;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setOpen(s.key)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                  active ? "border-primary/40 bg-accent/70" : "border-glass-border bg-background/30 hover:border-primary/30",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl ring-1", active ? "bg-primary text-primary-foreground ring-primary" : "bg-background/40 text-primary ring-primary/20")}>
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[12px] font-semibold text-primary">{s.title}</div>
                  <div className="text-[12.5px] leading-snug">{s.desc}</div>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 rounded-lg bg-background/40 px-2.5 py-1.5 text-[12px] text-muted-foreground">
                          <span className="font-medium text-foreground">Quando usa:</span> {s.when}.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Stack() {
  return (
    <>
      <SectionTitle sub="Tudo roda com uma única chave: GROQ_API_KEY.">Stack</SectionTitle>
      <ul className="divide-y divide-glass-border rounded-2xl border border-glass-border bg-background/30">
        {STACK.map((t) => (
          <li key={t.name} className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium">{t.name}</div>
              <div className="text-[12px] leading-snug text-muted-foreground">{t.role}</div>
            </div>
            <a
              href={t.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir ${t.name}`}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <ExternalLinkIcon className="size-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
