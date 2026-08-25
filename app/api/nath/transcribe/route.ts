import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";

export const runtime = "nodejs";

const MIN_AUDIO_BYTES = 1_000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

interface ScribeResponse {
  text?: unknown;
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size < MIN_AUDIO_BYTES) {
    return nathJson(request, { error: "audio_required" }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return nathJson(request, { error: "audio_too_large" }, 413);
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return nathJson(request, { error: "transcription_unavailable" }, 503);

  const scribeForm = new FormData();
  scribeForm.append("file", audio, audio.name || "resposta.webm");
  scribeForm.append("model_id", "scribe_v1");
  scribeForm.append("language_code", "pt");
  scribeForm.append("diarize", "false");
  scribeForm.append("tag_audio_events", "false");

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: scribeForm,
    });
    if (!response.ok) return nathJson(request, { error: "transcription_failed" }, 502);
    const payload = (await response.json()) as ScribeResponse;
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) return nathJson(request, { error: "empty_transcript" }, 422);
    return nathJson(request, { text });
  } catch {
    return nathJson(request, { error: "transcription_failed" }, 502);
  }
}

export const OPTIONS = nathOptions;
