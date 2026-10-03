"use client";

import { useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SparklesIcon } from "lucide-react";
import type { CvAgentUIMessage } from "@/agent";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
import { SkillChips, type SkillChip } from "./skill-chips";
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

  // Persiste a conversa na sessão quando o stream termina.
  useEffect(() => {
    if (status === "ready" || status === "error") setMessages(session.id, messages);
  }, [messages, status, session.id, setMessages]);

  const onSubmit = (msg: PromptInputMessage) => {
    const text = msg.text.trim();
    if (!text) return;
    sendMessage({ text });
    controller.textInput.clear();
  };

  const onChip = (chip: SkillChip) => {
    if (chip.mode === "send") sendMessage({ text: chip.prompt });
    else controller.textInput.setInput(chip.prompt);
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <SparklesIcon className="size-4 text-primary" />
        <div className="text-sm font-semibold">Agente</div>
        <span className="ml-auto text-[11px] text-muted-foreground">4 skills</span>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<SparklesIcon className="size-8 text-primary" />}
              title="O que você quer melhorar no CV?"
              description="Peça uma análise, cole links de vagas ou escolha uma skill abaixo."
            />
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
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
                        <Tool key={part.toolCallId} defaultOpen={part.state === "output-available" || part.state === "output-error"}>
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
                      );
                    default:
                      return null;
                  }
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer className="px-2 text-sm">Pensando…</Shimmer>}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <SkillChips onPick={onChip} />

      <div className="border-t p-3">
        <PromptInput onSubmit={onSubmit} className="rounded-xl">
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ex.: compare meu CV com esta vaga: https://linkedin.com/jobs/view/…" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !controller.textInput.value.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

type SkillPart = Extract<CvAgentUIMessage["parts"][number], { type: `tool-${string}` }>;

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
