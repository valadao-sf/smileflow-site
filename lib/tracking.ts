// Ponte tipada para a camada única de medição (public/_sf/track.js, fonte em tracking/).
// Os nomes de evento são os mesmos do simulador e do app smileflow; o mapa por plataforma está em tracking/README.md.
export type SfTrackParams = Record<string, string | number | boolean | undefined>;
type SfTrackFn = ((name: string, params?: SfTrackParams, opts?: { eventId?: string }) => string | undefined) & { q?: unknown[] };

declare global {
  interface Window {
    sfTrack?: SfTrackFn;
  }
}

/** Guarda as chamadas feitas antes de /_sf/track.js carregar. */
export const SF_TRACK_STUB =
  "window.sfTrack=window.sfTrack||function(){(window.sfTrack.q=window.sfTrack.q||[]).push(arguments)};";
export const SF_TRACK_SRC = "/_sf/track.js";

/** Manda um evento para a camada de medição. Nunca quebra a página. */
export function sfTrack(name: string, params: SfTrackParams = {}, opts: { eventId?: string } = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.sfTrack?.(name, params, opts);
  } catch {
    // Medição nunca bloqueia a experiência.
  }
}
