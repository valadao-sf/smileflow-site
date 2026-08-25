import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";
import { transcribeNathAudio } from "@/lib/marketing/nath-transcription";

export const runtime = "nodejs";

const MIN_AUDIO_BYTES = 1_000;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof File) || audio.size < MIN_AUDIO_BYTES) {
    return nathJson(request, { error: "audio_required" }, 400);
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return nathJson(request, { error: "audio_too_large" }, 413);
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const text = await transcribeNathAudio(buffer, audio, audio.name || "resposta.webm");
    return nathJson(request, { text });
  } catch (error) {
    console.error(JSON.stringify({
      event: "nath_transcribe_failed",
      message: error instanceof Error ? error.message : String(error),
    }));
    return nathJson(request, { error: "transcription_failed" }, 502);
  }
}

export const OPTIONS = nathOptions;
