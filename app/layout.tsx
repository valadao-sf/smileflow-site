import type { Metadata, Viewport } from "next";
import Script from "next/script";

import "./globals.css";

const PIXEL_ID = "888486630406077";

export const metadata: Metadata = {
  metadataBase: new URL("https://smileflow.com.br"),
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`if(location.hostname==='smileflow.com.br'||location.hostname==='www.smileflow.com.br'){!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView')}`}
        </Script>
      </body>
    </html>
  );
}
