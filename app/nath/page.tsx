import type { Metadata } from "next";

import { Flow } from "@/components/marketing/nath/Flow";

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

export default function NathPage() {
  return <Flow />;
}
