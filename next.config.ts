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
      {
        source: "/simulador-objecoes/:slug(ta-caro|vou-pensar|marido|medo|outra-clinica|desconto)",
        destination: "/simulador-objecoes/:slug.html",
      },
    ];
  },
};

export default nextConfig;
