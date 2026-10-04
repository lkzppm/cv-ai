import type { SVGProps } from "react";

/**
 * Marca do CV Agent: um documento com canto dobrado, a cabeça de robô
 * (antena, viseira, olhos felizes "^ ^", orelhas) encaixada na borda superior,
 * e linhas de texto em que uma vira uma seta de crescimento.
 * Traço em `currentColor`, viewBox 32×32. Espelha `src/app/icon.svg`.
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
      <circle cx="16" cy="3.6" r="1.3" />
      <path d="M16 4.9v1.6" />
      {/* documento: a borda superior abre espaço para a cabeça */}
      <path d="M11 6.5H6.5A1.5 1.5 0 0 0 5 8v20.5A1.5 1.5 0 0 0 6.5 30H22l5-5V8a1.5 1.5 0 0 0-1.5-1.5H21" />
      <path d="M27 25h-3.5a1.5 1.5 0 0 0-1.5 1.5V30" />
      {/* cabeça (octógono) + viseira */}
      <path d="M11.5 6.5h9l2.5 2.5v5l-2.5 2.5h-9L9 14V9z" />
      <path d="M11.2 7.6l1.6 2.2h6.4l1.6-2.2" />
      {/* olhos ^ ^ */}
      <path d="M12.3 12.9l1.1-1.4 1.1 1.4" />
      <path d="M17.5 12.9l1.1-1.4 1.1 1.4" />
      {/* orelhas */}
      <path d="M9 10.8H8a1 1 0 0 0-1 1v1.4a1 1 0 0 0 1 1h1" />
      <path d="M23 10.8h1a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1h-1" />
      {/* linhas e seta de crescimento */}
      <path d="M8 20.8h8" />
      <path d="M8 23.3h7.5l5.5-3.8" />
      <path d="M18.4 19.5h2.6v2.6" />
      <path d="M8 25.8h12.5" />
      <path d="M8 28.2h7" />
    </svg>
  );
}
