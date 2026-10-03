"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { ChatStatus } from "ai";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const LINE = 24; // line-height do textarea (px)
const MAX_LINES = 8;

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

  // auto-grow com transição: mede com a transição desligada (senão animaria a
  // partir de 0 a cada tecla), restaura a altura anterior e só então anima.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = el.style.height || `${LINE}px`;
    el.style.transition = "none";
    el.style.height = "0px";
    const target = Math.max(LINE, Math.min(el.scrollHeight, MAX_LINES * LINE));
    el.style.height = prev;
    void el.offsetHeight; // reflow para fixar o ponto de partida
    el.style.transition = "";
    el.style.height = `${target}px`;
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
        "glass relative flex items-end gap-2 rounded-[24px] py-1.5 pr-1.5 pl-4 transition-shadow duration-300",
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
        style={{ height: LINE }}
        className="scrollbar-none block min-w-0 flex-1 resize-none self-center bg-transparent py-0 text-[14px] leading-6 text-foreground outline-none transition-[height] duration-200 ease-out placeholder:text-muted-foreground/70"
      />

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
          "grid size-8 shrink-0 place-items-center rounded-full transition-all duration-200",
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
  );
}
