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
      strokeWidth={2}
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
      <path d="M13.5 18l-1.5 2.5" />
      {/* documento com dobra */}
      <path d="M9.5 20.5H20l4 4v4.5a1.5 1.5 0 0 1-1.5 1.5h-13a1.5 1.5 0 0 1-1.5-1.5V22a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M20 20.5v4h4" />
      {/* linhas e seta de crescimento */}
      <path d="M12 28.2h8" />
      <path d="M12 25.3h3.5l3-2.4" />
      <path d="M16.6 22.9h1.9v1.9" />
    </svg>
  );
}
