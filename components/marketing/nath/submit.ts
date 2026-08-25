import { readAttribution } from "./attribution";
import type { ContactInfo, RecordedAnswer } from "./types";

interface UploadTicket {
  contentType?: string;
  ok?: boolean;
  path?: string;
  uploadUrl?: string;
}

async function json(response: Response): Promise<Record<string, unknown> | null> {
  return response.json().catch(() => null) as Promise<Record<string, unknown> | null>;
}

export async function submitNathQuestion(
  contact: ContactInfo,
  answers: RecordedAnswer[],
  consentGranted: boolean,
): Promise<string> {
  const startResponse = await fetch("/api/nath/start", { method: "POST" });
  const start = await json(startResponse);
  if (!startResponse.ok || start?.ok !== true || typeof start.token !== "string") {
    throw new Error("Não foi possível iniciar o envio. Tente novamente.");
  }

  const uploaded = await Promise.all(
    answers.map(async (answer, questionIndex) => {
      const ticketResponse = await fetch("/api/nath/upload-ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: start.token,
          questionIndex,
          contentType: answer.mimeType,
          fileSize: answer.blob.size,
        }),
      });
      const ticket = (await json(ticketResponse)) as UploadTicket | null;
      if (
        !ticketResponse.ok ||
        !ticket?.ok ||
        !ticket.path ||
        !ticket.uploadUrl ||
        !ticket.contentType
      ) {
        throw new Error("Não foi possível preparar os áudios. Tente novamente.");
      }

      const uploadResponse = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "content-type": ticket.contentType },
        body: answer.blob,
      });
      if (!uploadResponse.ok) {
        throw new Error("O envio foi interrompido. Tente novamente.");
      }
      return {
        questionIndex,
        path: ticket.path,
        durationS: answer.durationS,
        mimeType: answer.mimeType,
        size: answer.blob.size,
      };
    }),
  );

  const submitResponse = await fetch("/api/nath/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: start.token,
      contact,
      consentGranted,
      attribution: readAttribution(),
      audios: uploaded,
    }),
  });
  const submission = await json(submitResponse);
  if (!submitResponse.ok || submission?.ok !== true || typeof submission.submissionId !== "string") {
    throw new Error("Os áudios subiram, mas a confirmação falhou. Tente novamente.");
  }
  return submission.submissionId;
}
