import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { SF_TRACK_SRC, SF_TRACK_STUB } from "@/lib/tracking";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.smileflow.com.br"),
  title: "SmileFlow",
  description: "Conteúdo e ferramentas para conduzir conversas de negociação clínica.",
  icons: { icon: "https://smileflow-marketing.vercel.app/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#191615",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-theme="dark" lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        {/* Medição: camada única de smileflow.com.br (tracking/). Carrega GA4, Meta e as outras plataformas só no domínio. */}
        <Script id="sf-track-stub" strategy="beforeInteractive">{SF_TRACK_STUB}</Script>
        <Script id="sf-track" src={SF_TRACK_SRC} strategy="afterInteractive" />
      </body>
    </html>
  );
}
