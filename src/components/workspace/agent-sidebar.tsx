"use client";

import { useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { SKILLS_META } from "@/lib/skills-meta";
import type { CvAgentUIMessage } from "@/agent";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { ScoreCard } from "./tool-cards/score-card";
import { FormatCard } from "./tool-cards/format-card";
import { RoleMatchCard } from "./tool-cards/role-match-card";
import { EditProposalCard } from "./tool-cards/edit-proposal-card";


const SKILL_TITLES: Record<string, string> = {
  "tool-role_matcher": "role_matcher · pesquisa da vaga",
  "tool-format_checker": "format_checker · padrões de mercado",
  "tool-cv_scorer": "cv_scorer · análise profunda",
  "tool-cv_editor": "cv_editor · proposta de alteração",
};

export function AgentSidebar() {
  return (
    <PromptInputProvider>
      <AgentSidebarInner />
    </PromptInputProvider>
  );
}

function AgentSidebarInner() {
  const session = useActiveSession()!;
  const setMessages = useSessions((s) => s.setMessages);
  const controller = usePromptInputController();

  // O CV é lido na hora do envio para refletir edições feitas no painel.
  const transport = useMemo(
    () =>
      new DefaultChatTransport<CvAgentUIMessage>({
        api: "/api/chat",
        body: () => {
          const s = useSessions.getState();
          return { cv: s.sessions.find((x) => x.id === s.activeId)?.cv ?? "" };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat<CvAgentUIMessage>({
    id: session.id,
    messages: session.messages as CvAgentUIMessage[],
    transport,
  });

  useEffect(() => {
    if (status === "ready" || status === "error") setMessages(session.id, messages);
  }, [messages, status, session.id, setMessages]);

  const onSubmit = (msg: PromptInputMessage) => {
    const text = msg.text.trim();
    if (!text) return;
    sendMessage({ text });
    controller.textInput.clear();
  };

  const busy = status === "submitted" || status === "streaming";
  const runningSkill = busy ? findRunningSkill(messages) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* indicador flutuante de skill em execução */}
      <AnimatePresence>
        {runningSkill && (
          <motion.div
            key={runningSkill}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
          >
            <span className="glass flex items-center gap-2 rounded-full px-3 py-1 text-[11px] text-accent-foreground">
              <span className="pulse-dot size-1.5 rounded-full bg-primary" />
              executando {runningSkill}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Conversation className="scrollbar-none min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
          {messages.length === 0 && <EmptyHero />}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Message from={m.role}>
                  <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                    {m.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return <MessageResponse key={i}>{part.text}</MessageResponse>;
                        case "reasoning":
                          return (
                            <Reasoning key={i} isStreaming={part.state === "streaming"}>
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        case "tool-role_matcher":
                        case "tool-format_checker":
                        case "tool-cv_scorer":
                        case "tool-cv_editor":
                          return (
                            <motion.div
                              key={part.toolCallId}
                              layout
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            >
                              <Tool defaultOpen={part.state === "output-available" || part.state === "output-error"} className="gradient-border rounded-2xl">
                                <ToolHeader type={part.type} state={part.state} title={SKILL_TITLES[part.type]} />
                                <ToolContent>
                                  {part.state === "input-streaming" && <Shimmer>Preparando a skill…</Shimmer>}
                                  {part.state === "input-available" && <Shimmer>{`Executando ${part.type.replace("tool-", "")}…`}</Shimmer>}
                                  {part.state === "output-error" && <ToolOutput output={undefined} errorText={part.errorText} />}
                                  {part.state === "output-available" && renderSkillOutput(part)}
                                  {part.state !== "output-available" && part.type !== "tool-cv_editor" && part.input != null && (
                                    <ToolInput input={part.input} />
                                  )}
                                </ToolContent>
                              </Tool>
                            </motion.div>
                          );
                        default:
                          return null;
                      }
                    })}
                  </MessageContent>
                </Message>
              </motion.div>
            ))}
          </AnimatePresence>
          {status === "submitted" && <Shimmer className="px-2 text-sm">Pensando…</Shimmer>}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error.message}
            </motion.div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-3">
        <PromptInput
          onSubmit={onSubmit}
          className="rounded-2xl border-glass-border bg-background/60 shadow-none transition-shadow focus-within:ring-glow"
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Peça uma análise, cole o link de uma vaga ou diga o que mudar…" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={status}
              onStop={stop}
              disabled={!busy && !controller.textInput.value.trim()}
              className="rounded-full"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

/** Estado vazio: hero + as capacidades do agente (não são botões: ele decide quando usar). */
function EmptyHero() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
      className="flex flex-col gap-5 px-1 pt-6"
    >
      <motion.div variants={fadeUp}>
        <h2 className="text-[26px] font-semibold leading-tight tracking-tight">
          O que você quer <span className="text-gradient">melhorar</span> no seu CV?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Converse normalmente. Eu escolho a skill certa para cada pedido e mostro o resultado aqui.
        </p>
      </motion.div>

      <div className="grid gap-2">
        {SKILLS_META.map((s) => (
          <motion.div
            key={s.key}
            variants={fadeUp}
            className="group flex items-start gap-3 rounded-2xl border border-glass-border bg-background/40 p-3 transition-colors hover:border-primary/40"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
              <s.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[12px] font-semibold text-primary">{s.title}</div>
              <div className="text-[12.5px] leading-snug text-muted-foreground">{s.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="text-[12px] text-muted-foreground">
        Experimente: <em>“analise meu CV”</em>, <em>“compare com https://linkedin.com/jobs/view/…”</em>, <em>“reescreva meu resumo”</em>.
      </motion.div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

type SkillPart = Extract<CvAgentUIMessage["parts"][number], { type: `tool-${string}` }>;

function findRunningSkill(messages: CvAgentUIMessage[]): string | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return null;
  for (let i = last.parts.length - 1; i >= 0; i--) {
    const p = last.parts[i];
    if (p.type.startsWith("tool-") && "state" in p && (p.state === "input-streaming" || p.state === "input-available")) {
      return p.type.replace("tool-", "");
    }
  }
  return null;
}

function renderSkillOutput(part: SkillPart) {
  if (part.state !== "output-available") return null;
  switch (part.type) {
    case "tool-cv_scorer":
      return <ScoreCard output={part.output} />;
    case "tool-format_checker":
      return <FormatCard output={part.output} />;
    case "tool-role_matcher":
      return <RoleMatchCard output={part.output} />;
    case "tool-cv_editor":
      return <EditProposalCard output={part.output} />;
    default:
      return <ToolOutput output={JSON.stringify(part)} errorText={undefined} />;
  }
}
