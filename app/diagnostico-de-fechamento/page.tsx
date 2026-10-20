import type { Metadata } from "next";

import { DiagnosticoFechamentoExperience } from "@/components/marketing/diagnostico-fechamento/DiagnosticoFechamentoExperience";

const canonical = "https://smileflow.com.br/diagnostico-de-fechamento";
const title = "Diagnóstico de Fechamento | Nathálya";
const description = "Responda três perguntas sobre a hora de falar o preço, entenda o que faz você recuar e baixe na hora o Diagnóstico de Fechamento da Nathálya.";
// No smileflow.com.br, o proxy só encaminha a rota exata desta página para cá; por isso a imagem usa o
// domínio deste projeto (public/images/og), que é público e é a origem para onde o proxy encaminha.
const ogImage = "https://smileflow-marketing.vercel.app/images/og/diagnostico-de-fechamento.jpg";
const ogAlt = "O que acontece com você na hora de falar o preço? Diagnóstico de Fechamento, Nathálya Mello.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: canonical,
    title,
    description,
    images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
  },
  twitter: { card: "summary_large_image", title, description, images: [ogImage] },
};

export default function DiagnosticoFechamentoPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    inLanguage: "pt-BR",
    about: "Insegurança ao falar preço e conduzir a decisão de um tratamento",
    author: { "@type": "Person", name: "Nathálya Mello" },
    publisher: { "@type": "Organization", name: "SmileFlow", url: "https://smileflow.com.br" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <DiagnosticoFechamentoExperience />
    </>
  );
}
