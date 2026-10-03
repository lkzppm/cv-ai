"use client";

import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CvAgentIcon } from "@/components/brand/cv-agent-icon";
import { SKILLS_META } from "@/lib/skills-meta";

/** Botão "i" do header: o que o agente é, quais skills tem e como decide usá-las. */
export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Sobre o agente">
          <InfoIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong max-w-lg rounded-3xl p-0 sm:max-w-xl">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-accent text-primary ring-1 ring-primary/25">
              <CvAgentIcon className="size-6" />
            </span>
            <div>
              <DialogTitle className="text-lg">CV Agent</DialogTitle>
              <DialogDescription>
                Agente de IA que analisa, pontua e reescreve currículos usando skills.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 pb-6 text-sm">
          <p className="text-muted-foreground">
            Você conversa normalmente. O agente lê o CV que está no painel, decide sozinho qual skill
            chamar, executa e explica o resultado. Não há botões: a escolha é dele.
          </p>

          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Skills
            </div>
            <ul className="grid gap-2">
              {SKILLS_META.map((s) => (
                <li key={s.key} className="flex items-start gap-3 rounded-2xl border border-glass-border bg-background/40 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-primary ring-1 ring-primary/20">
                    <s.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[12px] font-semibold text-primary">{s.title}</div>
                    <div className="text-[12.5px] leading-snug">{s.desc}</div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">Usa {s.when}.</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            <dt className="text-muted-foreground">Modelo</dt>
            <dd>Groq · openai/gpt-oss-120b (tool calling + reasoning + web search)</dd>
            <dt className="text-muted-foreground">Loop</dt>
            <dd>AI SDK 7 ToolLoopAgent, até 8 passos por mensagem, streaming para a UI</dd>
            <dt className="text-muted-foreground">Contexto</dt>
            <dd>O CV atual é enviado a cada mensagem; propostas só entram no painel quando você aplica</dd>
            <dt className="text-muted-foreground">Dados</dt>
            <dd>Sessões, versões e conversas ficam no seu navegador (localStorage)</dd>
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
