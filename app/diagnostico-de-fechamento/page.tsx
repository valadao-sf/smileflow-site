import type { Metadata } from "next";

import { DiagnosticoFechamentoExperience } from "@/components/marketing/diagnostico-fechamento/DiagnosticoFechamentoExperience";

const canonical = "https://smileflow.com.br/diagnostico-de-fechamento";
const title = "Diagnóstico de Fechamento | Nathálya";
const description = "Descubra o que faz você recuar na hora de falar o preço e qual comportamento treinar primeiro. Resultado gratuito em cerca de 2 minutos.";

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
  },
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
