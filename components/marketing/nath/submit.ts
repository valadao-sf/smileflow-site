import { readAttribution } from "./attribution";
import type { ContactInfo } from "./types";

const MARKETING_ORIGIN = "https://smileflow-marketing.vercel.app";

function apiUrl(path: string): string {
  if (
    typeof window !== "undefined" &&
    /(^|\.)smileflow\.com\.br$/.test(window.location.hostname)
  ) {
    return `${MARKETING_ORIGIN}${path}`;
  }
  return path;
}

async function responseJson(response: Response): Promise<Record<string, unknown> | null> {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

function audioFileName(audio: Blob): string {
  if (audio.type.includes("mp4") || audio.type.includes("m4a")) return "resposta.m4a";
  if (audio.type.includes("ogg")) return "resposta.ogg";
  return "resposta.webm";
}

export async function transcribeNathAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, audioFileName(audio));
  const response = await fetch(apiUrl("/api/nath/transcribe"), { method: "POST", body: form });
  const payload = await responseJson(response);
  if (!response.ok || typeof payload?.text !== "string") {
    throw new Error("Não consegui transcrever agora.");
  }
  return payload.text;
}

export async function submitNathConversation(
  contact: ContactInfo,
  answers: string[],
): Promise<string> {
  const startResponse = await fetch(apiUrl("/api/nath/start"), { method: "POST" });
  const start = await responseJson(startResponse);
  if (!startResponse.ok || start?.ok !== true || typeof start.token !== "string") {
    throw new Error("Não consegui iniciar o envio. Tente novamente.");
  }

  const submitResponse = await fetch(apiUrl("/api/nath/submit"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      answers,
      attribution: readAttribution(),
      contact,
      token: start.token,
    }),
  });
  const submission = await responseJson(submitResponse);
  if (!submitResponse.ok || submission?.ok !== true || typeof submission.submissionId !== "string") {
    throw new Error("Não consegui enviar agora. Tente novamente.");
  }
  return submission.submissionId;
}
