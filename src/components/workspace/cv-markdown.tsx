"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function CvMarkdown({ markdown }: { markdown: string }) {
  return (
    <article className="cv-doc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}
