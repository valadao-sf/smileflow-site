import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.VERCEL ? "https://smileflow-marketing.vercel.app" : undefined,
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // Simulador de objeções da Nath: páginas estáticas em public/simulador-objecoes,
  // geradas a partir de um motor único (uma página por objeção, para anúncio e compartilhamento).
  async rewrites() {
    return [
      { source: "/simulador-objecoes", destination: "/simulador-objecoes/index.html" },
      // Perfil de negociação (o funil do vídeo da Nath, fora do simulador): mesma base, página própria para tráfego pago.
      { source: "/perfil-de-negociacao", destination: "/perfil-de-negociacao.html" },
      {
        source: "/simulador-objecoes/:slug(ta-caro|vou-pensar|marido|medo|outra-clinica|desconto)",
        destination: "/simulador-objecoes/:slug.html",
      },
      // Página do guia, para onde a pessoa vai depois de enviar os dados (o PDF fica em /simulador-objecoes/guia/guia-<objeção>.pdf).
      {
        source: "/simulador-objecoes/guia/:slug(ta-caro|vou-pensar|marido|medo|outra-clinica|desconto)",
        destination: "/simulador-objecoes/guia/:slug.html",
      },
    ];
  },
};

export default nextConfig;
