import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeApplier } from "@/components/workspace/theme-applier";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CV Agent",
  description:
    "Agente de IA que analisa, pontua e reescreve seu currículo usando skills (role_matcher, format_checker, cv_scorer, cv_editor). Next.js + AI SDK + Groq.",
};

// O teclado virtual encolhe o layout (Chrome/Android), mantendo o composer do chat e a toolbar do CV visíveis.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeApplier />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
