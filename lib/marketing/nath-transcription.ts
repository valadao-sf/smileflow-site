/**
 * Copied from SmileFlow's production Olana transcription boundary:
 * valadao-sf/smileflow src/app/api/olana/transcribe/route.ts
 * and src/lib/arena/scribe.ts
 * commit: b02dfda6d85b8392e81b217c208503815c25c9a3
 *
 * ElevenLabs Scribe is the canonical SmileFlow path. Gemini remains a fallback
 * for deployments that have a usable Gemini key but temporarily lose Scribe.
 */

const GEMINI_INLINE_MAX_BYTES = 14 * 1024 * 1024;
const GEMINI_TRANSCRIBE_MODEL = "gemini-2.5-flash";

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
}

interface ScribeResponse {
  text?: unknown;
}

function cleanEnvKey(value: string | undefined): string {
  return (value ?? "")
    .replace(/\\r\\n|\\n|\\r/gu, "")
    .replace(/[\r\n]/gu, "")
    .trim();
}

function audioMime(file: Blob, fileName: string): string {
  if (file.type.startsWith("audio/")) return file.type;
  const clean = fileName.toLowerCase();
  if (clean.endsWith(".m4a") || clean.endsWith(".mp4")) return "audio/mp4";
  if (clean.endsWith(".ogg") || clean.endsWith(".oga")) return "audio/ogg";
  if (clean.endsWith(".wav")) return "audio/wav";
  if (clean.endsWith(".mp3") || clean.endsWith(".mpeg")) return "audio/mpeg";
  return "audio/webm";
}

async function transcribeWithGemini(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = cleanEnvKey(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  if (buffer.byteLength > GEMINI_INLINE_MAX_BYTES) {
    throw new Error("audio exceeds Gemini inline limit");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TRANSCRIBE_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Transcreva exatamente a fala em português brasileiro. Retorne somente a transcrição, sem comentários, rótulos ou markdown.",
            },
            {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
  );
  const data = await response.json().catch(() => ({})) as GeminiGenerateResponse;
  if (!response.ok) {
    throw new Error(
      `Gemini transcription error ${response.status}: ${data.error?.message ?? "unknown"}`,
    );
  }
  const transcript = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!transcript) throw new Error("Gemini returned an empty transcript");
  return transcript;
}

async function transcribeWithScribe(
  buffer: Buffer,
  file: Blob,
  fileName: string,
  apiKey: string,
): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: audioMime(file, fileName) });
  form.append("file", blob, fileName);
  form.append("model_id", "scribe_v1");
  form.append("language_code", "pt");
  form.append("diarize", "true");
  form.append("tag_audio_events", "true");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });
  const data = await response.json().catch(() => ({})) as ScribeResponse;
  if (!response.ok) throw new Error(`ElevenLabs Scribe error ${response.status}`);
  const transcript = typeof data.text === "string" ? data.text.trim() : "";
  if (!transcript) throw new Error("ElevenLabs returned an empty transcript");
  return transcript;
}

export async function transcribeNathAudio(
  buffer: Buffer,
  file: Blob,
  fileName: string,
): Promise<string> {
  const elevenLabsKey = cleanEnvKey(process.env.ELEVENLABS_API_KEY);
  let scribeError: unknown = new Error("ELEVENLABS_API_KEY is incompatible or missing");
  try {
    if (elevenLabsKey.startsWith("sk_")) {
      return await transcribeWithScribe(buffer, file, fileName, elevenLabsKey);
    }
  } catch (error) {
    scribeError = error;
  }

  let geminiError: unknown;
  try {
    return await transcribeWithGemini(buffer, audioMime(file, fileName));
  } catch (error) {
    geminiError = error;
  }

  const scribeMessage = scribeError instanceof Error ? scribeError.message : String(scribeError);
  const geminiMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
  throw new Error(`STT unavailable — Scribe: ${scribeMessage}; Gemini: ${geminiMessage}`);
}

export const _testing = { audioMime, cleanEnvKey };
