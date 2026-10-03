"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { ChatStatus } from "ai";
import { Spinner } from "@/components/ui/spinner";
import { AGENT_MODEL_LABEL } from "@/lib/skills-meta";
import { cn } from "@/lib/utils";

type Props = {
  status: ChatStatus;
  onSend: (text: string) => void;
  onStop: () => void;
  placeholder?: string;
};

/**
 * Composer do chat: cartão em vidro com textarea que cresce até 8 linhas,
 * Enter envia / Shift+Enter quebra linha, botão circular que vira "parar"
 * durante o streaming. Sem dependência do PromptInput do AI Elements para
 * ter controle total do visual.
 */
export function ChatComposer({ status, onSend, onStop, placeholder }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";
  const canSend = value.trim().length > 0 && !busy;

  // auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 8 * 24 + 8) + "px";
  }, [value]);

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  }, [value, busy, onSend]);

  return (
    <div
      className={cn(
        "glass relative rounded-[26px] p-2 pl-4 transition-shadow duration-300",
        focused ? "ring-glow" : "shadow-[0_10px_30px_-18px_rgba(0,0,0,.6)]",
      )}
      onClick={() => ref.current?.focus()}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label="Mensagem para o agente"
        className="block w-full resize-none bg-transparent py-2.5 pr-12 text-[14px] leading-6 text-foreground outline-none placeholder:text-muted-foreground/70"
      />

      <div className="mt-1 flex items-center justify-between pb-0.5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-glass-border bg-background/40 px-2 py-0.5 font-mono text-[10.5px]">
            {AGENT_MODEL_LABEL}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={busy ? "busy" : focused ? "hint" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="hidden sm:inline"
            >
              {busy ? "gerando resposta…" : focused ? "Enter envia · Shift+Enter quebra linha" : "o agente escolhe a skill"}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation();
            if (busy) onStop();
            else submit();
          }}
          disabled={!busy && !canSend}
          aria-label={busy ? "Parar" : "Enviar"}
          className={cn(
            "grid size-9 place-items-center rounded-full transition-all duration-200",
            busy
              ? "bg-foreground/10 text-foreground hover:bg-foreground/15"
              : canSend
                ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--brand)] hover:brightness-110"
                : "bg-foreground/8 text-muted-foreground/60",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={status === "submitted" ? "spin" : busy ? "stop" : "send"}
              initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 20 }}
              transition={{ duration: 0.16 }}
              className="grid place-items-center"
            >
              {status === "submitted" ? (
                <Spinner className="size-4" />
              ) : busy ? (
                <SquareIcon className="size-3.5" fill="currentColor" />
              ) : (
                <ArrowUpIcon className="size-4" strokeWidth={2.5} />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
