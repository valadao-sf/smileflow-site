import { readAttribution } from "./attribution";
import { storageUploadMime } from "./composer/attachments";
import type { ChatAttachment } from "./composer/types";
import type { LocalAnswer } from "./types";

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

interface UploadedMedia {
  questionId: string;
  bucket: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
}

const uploadedFiles = new WeakMap<File, UploadedMedia>();

async function uploadAttachment(
  submissionId: string,
  questionId: string,
  attachment: ChatAttachment,
): Promise<UploadedMedia> {
  const file = attachment.file;
  if (!(file instanceof File)) {
    throw new Error("Anexo inválido. Anexe o arquivo de novo.");
  }
  const cached = uploadedFiles.get(file);
  if (cached?.questionId === questionId) return cached;
  const contentType = storageUploadMime(file.type || attachment.mime, file.name);
  const ticketResponse = await fetch(apiUrl("/api/nath/upload-ticket"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      submissionId,
      filename: file.name,
      mime: contentType,
      size: file.size,
    }),
  });
  const ticket = await responseJson(ticketResponse);
  if (
    !ticketResponse.ok
    || ticket?.ok !== true
    || typeof ticket.bucket !== "string"
    || typeof ticket.path !== "string"
    || typeof ticket.uploadUrl !== "string"
  ) {
    throw new Error("Não consegui preparar o envio do anexo.");
  }

  const put = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: file,
  });
  if (!put.ok) {
    throw new Error("Não consegui enviar o anexo.");
  }

  const uploaded = {
    questionId,
    bucket: ticket.bucket,
    path: ticket.path,
    filename: file.name,
    mime: contentType,
    size: file.size,
  };
  uploadedFiles.set(file, uploaded);
  return uploaded;
}

export async function submitNathConversation(input: {
  submissionId: string;
  formVersion: string;
  answers: LocalAnswer[];
  contact: {
    fullName: string;
    instagram: string;
    canMentionName: boolean;
    canTagInstagram: boolean;
  };
}): Promise<string> {
  const media: UploadedMedia[] = [];
  for (const answer of input.answers) {
    for (const attachment of answer.attachments) {
      media.push(await uploadAttachment(input.submissionId, answer.questionId, attachment));
    }
  }

  const submitResponse = await fetch(apiUrl("/api/nath/submit"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      submissionId: input.submissionId,
      formVersion: input.formVersion,
      answers: input.answers.map((answer) => ({
        questionId: answer.questionId,
        text: answer.text,
        inputMode: answer.inputMode,
      })),
      contact: input.contact,
      media,
      attribution: readAttribution(),
    }),
  });
  const submission = await responseJson(submitResponse);
  if (!submitResponse.ok || submission?.ok !== true || typeof submission.submissionId !== "string") {
    throw new Error("Não consegui enviar agora. Tente novamente.");
  }
  return submission.submissionId;
}
