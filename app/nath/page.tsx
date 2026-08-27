import type { Metadata } from "next";

import { Flow } from "@/components/marketing/nath/Flow";
import { loadPublishedNathForm } from "@/lib/marketing/nath-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fala comigo",
  description:
    "Tem uma pergunta, uma conversa que você quer que eu veja ou um caso em que queria minha opinião? Me manda.",
  alternates: {
    canonical: "https://smileflow.com.br/nath",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NathPage() {
  const form = await loadPublishedNathForm();
  if (!form) {
    return (
      <main className="nath-screen">
        <section className="nath-conversation-box nath-unavailable">
          <p className="nath-chat__brand">Nathálya</p>
          <h1>Não consegui abrir este formulário agora.</h1>
          <p>Tente novamente em alguns instantes.</p>
        </section>
      </main>
    );
  }
  return <Flow form={form} />;
}
