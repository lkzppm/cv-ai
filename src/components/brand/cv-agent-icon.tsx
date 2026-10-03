import type { SVGProps } from "react";

/**
 * Marca do CV Agent: cabeça de robô (antena, viseira com dois olhos, orelhas)
 * apoiada sobre um documento com linhas e uma seta de tendência para cima.
 * Traço em `currentColor`, viewBox 32×32.
 */
export function CvAgentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* antena */}
      <circle cx="16" cy="3.2" r="1.6" />
      <path d="M16 4.8v2.2" />
      {/* cabeça */}
      <rect x="6" y="7" width="20" height="11" rx="4" />
      {/* viseira e olhos */}
      <rect x="9.5" y="10.3" width="13" height="5.4" rx="2.4" />
      <circle cx="13" cy="13" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="19" cy="13" r="1.2" fill="currentColor" stroke="none" />
      {/* orelhas */}
      <path d="M6 11.5H4.5a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1H6" />
      <path d="M26 11.5h1.5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1H26" />
      {/* pescoço / cauda do balão */}
      <path d="M13 18l-1.3 2.5" />
      {/* documento com dobra */}
      <path d="M9 20.5h10.5l4.5 4.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 29V22a1.5 1.5 0 0 1 1-1.5z" />
      <path d="M19.5 20.5V25h4.5" />
      {/* linhas e seta de crescimento */}
      <path d="M11.5 28h9" />
      <path d="M11.5 25.4h3l3-2.3" />
      <path d="M15.8 23.1h1.7v1.7" />
    </svg>
  );
}
