"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { normalizeCvText, type CvHighlight, type CvRef } from "@/lib/cv/refs";
import { sectionKindOf } from "@/lib/cv/parse";
import { selectVisible, useHighlights } from "@/lib/store/highlights";

type Box = { key: string; top: number; left: number; width: number; height: number; label?: string; tone?: CvHighlight["tone"] };

const PAD_X = 8;
const PAD_Y = 4;

/**
 * Camada de destaques: envolve o `<article class="cv-doc">`, resolve cada
 * referência (trecho, seção, cabeçalho) para elementos do DOM renderizado e
 * desenha retângulos tracejados por cima. Re-mede quando o CV, o conjunto de
 * destaques ou o tamanho do container mudam.
 */
export function CvHighlightLayer({ markdown, children }: { markdown: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const hover = useHighlights((s) => s.hover);
  const focusedKey = useHighlights((s) => s.focusedKey);
  const pinned = useHighlights((s) => s.pinned);
  const items = useMemo(() => selectVisible({ hover, focusedKey, pinned }), [hover, focusedKey, pinned]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [tick, setTick] = useState(0);

  // Mede os retângulos. ResizeObserver cobre fontes, largura do painel e mudança do CV.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTick((t) => t + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setBoxes(measure(el, items));
    // `markdown` e `tick` entram só para re-medir.
  }, [items, markdown, tick]);

  // Ao fixar/focar (não no hover), rola o primeiro destaque até ficar visível.
  const scrollKey = focusedKey ?? (pinned ? `${pinned.source}:${pinned.items.length}` : null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !scrollKey) return;
    const first = items[0] && resolveRef(el, items[0].refs[0])[0];
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  return (
    <div ref={ref} className="relative">
      {children}
      <AnimatePresence>
        {boxes.map((b) => (
          <motion.div
            key={b.key}
            data-tone={b.tone ?? "primary"}
            className="cv-highlight"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
          >
            {b.label && <span className="cv-highlight-label">{b.label}</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function measure(container: HTMLElement, items: CvHighlight[]): Box[] {
  const base = container.getBoundingClientRect();
  const out: Box[] = [];
  items.forEach((item, i) => {
    item.refs.forEach((r, j) => {
      const els = resolveRef(container, r);
      if (els.length === 0) return;
      const rect = union(els.map((e) => e.getBoundingClientRect()));
      out.push({
        key: `${i}:${j}:${r.kind}:${"text" in r ? r.text : "title" in r ? r.title : ""}`,
        top: rect.top - base.top - PAD_Y,
        left: rect.left - base.left - PAD_X,
        width: rect.width + PAD_X * 2,
        height: rect.height + PAD_Y * 2,
        // O rótulo só no primeiro retângulo do grupo, para não repetir.
        label: j === 0 ? item.label : undefined,
        tone: item.tone,
      });
    });
  });
  return out;
}

function union(rects: DOMRect[]) {
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, left, width: right - left, height: bottom - top };
}

/** Elementos do documento renderizado que correspondem a uma referência. */
export function resolveRef(container: HTMLElement, ref: CvRef | undefined): HTMLElement[] {
  const article = container.querySelector<HTMLElement>("article") ?? container;
  const blocks = Array.from(article.children) as HTMLElement[];
  if (!ref) return [];

  if (ref.kind === "header") {
    const h1 = blocks.find((b) => b.tagName === "H1");
    if (!h1) return blocks.slice(0, 1);
    const next = h1.nextElementSibling as HTMLElement | null;
    return next && next.tagName === "P" ? [h1, next] : [h1];
  }

  if (ref.kind === "section") {
    const want = normalizeCvText(ref.title);
    const wantKind = sectionKindOf(ref.title);
    const start = blocks.findIndex((b) => {
      if (b.tagName !== "H2") return false;
      const have = normalizeCvText(b.textContent ?? "");
      return have === want || have.includes(want) || want.includes(have) || (wantKind !== "other" && sectionKindOf(have) === wantKind);
    });
    if (start < 0) return [];
    const range: HTMLElement[] = [blocks[start]];
    for (let i = start + 1; i < blocks.length && blocks[i].tagName !== "H2"; i++) range.push(blocks[i]);
    return range;
  }

  // quote: o menor bloco cujo texto contém o trecho; cai para um prefixo se o trecho for longo/ligeiramente diferente.
  const q = normalizeCvText(ref.text);
  if (q.length < 4) return [];
  const candidates = Array.from(article.querySelectorAll<HTMLElement>("li, p, h1, h2, h3, td, th"));
  const find = (needle: string) =>
    candidates
      .filter((c) => normalizeCvText(c.textContent ?? "").includes(needle))
      .sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0))[0];
  let hit = find(q);
  if (!hit) {
    const words = q.split(" ");
    const prefix = words.slice(0, 7).join(" ");
    if (words.length >= 4 && prefix.length >= 12) hit = find(prefix);
  }
  return hit ? [hit] : [];
}
