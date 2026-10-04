"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import type { CvAgentUIMessage } from "@/agent";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { ChatComposer, type ChatComposerHandle } from "./chat-composer";
import { EmptyHero } from "./empty-hero";
import { parseCv } from "@/lib/cv/parse";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Tool, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { SkillLoadedRow, SkillToolHeader } from "./skill-activity";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useActiveSession, useSessions } from "@/lib/store/sessions";
import { useHighlights } from "@/lib/store/highlights";
import { useEditProposal } from "@/lib/store/edit-proposal";
import type { CvHighlight } from "@/lib/cv/refs";
import { ScoreCard, scoreHighlights } from "./tool-cards/score-card";
import { FormatCard, formatHighlights } from "./tool-cards/format-card";
import { RoleMatchCard, roleHighlights } from "./tool-cards/role-match-card";
import { EditProposalCard } from "./tool-cards/edit-proposal-card";


const SKILL_SUBTITLES: Record<string, string> = {
  "tool-role_matcher": "pesquisa da vaga",
  "tool-format_checker": "padrões de mercado",
  "tool-cv_scorer": "análise profunda",
  "tool-cv_editor": "proposta de alteração",
};

export function AgentSidebar() {
  const session = useActiveSession()!;
  const setMessages = useSessions((s) => s.setMessages);
  const composerRef = useRef<ChatComposerHandle>(null);
  const cvStats = useMemo(() => {
    const parsed = parseCv(session.cv);
    return { empty: !session.cv.trim(), name: parsed.name, words: parsed.wordCount };
  }, [session.cv]);

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

  useAutoHighlights(messages);
  const clearHighlights = useHighlights((s) => s.clear);

  const busy = status === "submitted" || status === "streaming";
  const activity = busy ? findActivity(messages) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* indicador flutuante de skill em execução */}
      <AnimatePresence>
        {activity && (
          <motion.div
            key={`${activity.kind}-${activity.name}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
          >
            <span className="glass flex items-center gap-2 rounded-full px-3 py-1 text-[11px] text-accent-foreground">
              <span className="pulse-dot size-1.5 rounded-full bg-primary" />
              {activity.kind === "load" ? `carregando skill ${activity.name}` : `executando tool ${activity.name}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Conversation className="scrollbar-none min-h-0 flex-1">
        <AutoScroll count={messages.length} status={status} />
        <ConversationContent className="gap-5 p-4">
          {messages.length === 0 && <EmptyHero cv={cvStats} onExample={(t) => composerRef.current?.setText(t)} />}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Message from={m.role}>
                  <MessageContent
                    className={
                      m.role === "user"
                        ? "group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-[3px] group-[.is-user]:bg-primary group-[.is-user]:text-white"
                        : "max-w-full rounded-2xl rounded-bl-[3px] border border-glass-border bg-background/30 px-4 py-3"
                    }
                  >
                    {m.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <MessageResponse key={i} className="chat-md">
                              {part.text}
                            </MessageResponse>
                          );
                        case "reasoning":
                          // Blocos vazios (o gpt-oss emite um por passo) só poluem a timeline.
                          if (part.state !== "streaming" && !part.text.trim()) return null;
                          return (
                            <Reasoning key={i} isStreaming={part.state === "streaming"} className="mb-0">
                              <ReasoningTrigger className="w-fit py-0.5 text-xs" getThinkingMessage={thinkingMessage} />
                              <ReasoningContent className="collapsible-fluid mt-1.5 border-l-2 border-glass-border pl-3 text-xs">{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        case "tool-load_skill":
                          return (
                            <motion.div
                              key={part.toolCallId}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            >
                              {part.state === "output-available" ? (
                                <div className="space-y-1.5">
                                  {part.output.skills.map((s) => (
                                    <SkillLoadedRow key={s.name} name={s.name} state={part.state} alreadyLoaded={s.alreadyLoaded} description={s.description} instructions={s.instructions} />
                                  ))}
                                </div>
                              ) : (
                                <SkillLoadedRow name={part.input?.names?.join(", ")} state={part.state} />
                              )}
                            </motion.div>
                          );
                        case "tool-role_matcher":
                        case "tool-format_checker":
                        case "tool-cv_scorer":
                        case "tool-cv_editor":
                          return (
                            <motion.div
                              key={part.toolCallId}
                              data-tool-call={part.toolCallId}
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 26 }}
                              className="rounded-2xl"
                            >
                              <Tool defaultOpen={part.state === "output-available" || part.state === "output-error"} className="gradient-border mb-0 rounded-2xl">
                                <SkillToolHeader
                                  name={part.type.replace("tool-", "")}
                                  state={part.state}
                                  subtitle={SKILL_SUBTITLES[part.type]}
                                  autoLoaded={part.state === "output-available" && Boolean((part.output as { autoLoaded?: boolean }).autoLoaded)}
                                />
                                <ToolContent className="collapsible-fluid">
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
        <ChatComposer
          ref={composerRef}
          status={status}
          onSend={(text) => {
            // Nova pergunta, nova "onda" de tools: os destaques da anterior saem do painel.
            clearHighlights();
            void sendMessage({ text });
          }}
          onStop={stop}
          placeholder="Peça uma análise, cole o link de uma vaga ou diga o que mudar…"
        />
      </div>
    </div>
  );
}

type SkillPart = Extract<CvAgentUIMessage["parts"][number], { type: `tool-${string}` }>;

/**
 * Quando uma tool termina, fixa no painel do CV os trechos que ela mencionou;
 * o cv_editor abre a revisão (diff) no painel. O histórico carregado do storage
 * não dispara (só chamadas novas desta sessão); ao desmontar (troca de sessão)
 * destaques e revisão são limpos.
 */
function useAutoHighlights(messages: CvAgentUIMessage[]) {
  const pin = useHighlights((s) => s.pin);
  const clear = useHighlights((s) => s.clear);
  const propose = useEditProposal((s) => s.propose);
  const dismiss = useEditProposal((s) => s.dismiss);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(messages.flatMap((m) => m.parts.flatMap((p) => ("toolCallId" in p ? [p.toolCallId] : []))));
      return;
    }
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    for (const p of last.parts) {
      if (!p.type.startsWith("tool-") || !("toolCallId" in p) || seen.current.has(p.toolCallId)) continue;
      if (p.state !== "output-available") continue;
      seen.current.add(p.toolCallId);
      if (p.type === "tool-cv_editor") {
        propose({ toolCallId: p.toolCallId, newCv: p.output.newCv, summary: p.output.summary });
        continue;
      }
      const items = highlightsFor(p as SkillPart);
      if (items.length) pin(p.type.replace("tool-", ""), items, p.toolCallId);
    }
  }, [messages, pin, propose]);

  useEffect(
    () => () => {
      clear();
      dismiss();
    },
    [clear, dismiss],
  );
}

function highlightsFor(part: SkillPart): CvHighlight[] {
  if (part.state !== "output-available") return [];
  switch (part.type) {
    case "tool-cv_scorer":
      return scoreHighlights(part.output);
    case "tool-format_checker":
      return formatHighlights(part.output);
    case "tool-role_matcher":
      return roleHighlights(part.output);
    default:
      return [];
  }
}

/**
 * O StickToBottom só acompanha se o usuário já estava no fim. Ao enviar uma
 * mensagem (ou quando o agente começa a responder) forçamos o scroll; a partir
 * daí o "stick" segue o streaming sozinho.
 */
function AutoScroll({ count, status }: { count: number; status: string }) {
  const { scrollToBottom } = useStickToBottomContext();
  useEffect(() => {
    if (count > 0) void scrollToBottom({ animation: "smooth" });
  }, [count, scrollToBottom]);
  useEffect(() => {
    if (status === "submitted") void scrollToBottom({ animation: "smooth" });
  }, [status, scrollToBottom]);
  return null;
}

function thinkingMessage(isStreaming: boolean, duration?: number) {
  if (isStreaming || duration === 0) return <Shimmer duration={1}>Pensando…</Shimmer>;
  if (duration === undefined) return <span>Raciocínio</span>;
  return <span>Pensou por {duration}s</span>;
}

/** O que o agente está fazendo agora: carregando uma skill ou executando uma tool. */
function findActivity(messages: CvAgentUIMessage[]): { kind: "load" | "tool"; name: string } | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return null;
  for (let i = last.parts.length - 1; i >= 0; i--) {
    const p = last.parts[i];
    if (!p.type.startsWith("tool-") || !("state" in p)) continue;
    if (p.state !== "input-streaming" && p.state !== "input-available") continue;
    if (p.type === "tool-load_skill") return { kind: "load", name: p.input?.names?.join(", ") ?? "…" };
    return { kind: "tool", name: p.type.replace("tool-", "") };
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
      return <EditProposalCard output={part.output} toolCallId={part.toolCallId} />;
    default:
      return <ToolOutput output={JSON.stringify(part)} errorText={undefined} />;
  }
}
