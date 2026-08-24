import type { Metadata } from "next";

import { NegotiationMomentExperience } from "@/components/marketing/negotiation-moment/NegotiationMomentExperience";
import { taCaroMoment } from "@/lib/marketing/negotiation-moments/ta-caro";

export const metadata: Metadata = {
  title: taCaroMoment.seo.title,
  description: taCaroMoment.seo.description,
  alternates: { canonical: taCaroMoment.seo.canonical },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: taCaroMoment.seo.canonical,
    title: taCaroMoment.seo.title,
    description: taCaroMoment.seo.description,
  },
};

export default function QuandoAchamCaroPage() {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: taCaroMoment.seo.title,
      description: taCaroMoment.seo.description,
      url: taCaroMoment.seo.canonical,
      inLanguage: "pt-BR",
      about: "Como conduzir a conversa quando uma paciente diz que o tratamento está caro",
      author: { "@type": "Person", name: "Nathálya Mello" },
      publisher: { "@type": "Organization", name: "SmileFlow", url: "https://smileflow.com.br" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: taCaroMoment.supportingContent.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <NegotiationMomentExperience config={taCaroMoment} />
    </>
  );
}
