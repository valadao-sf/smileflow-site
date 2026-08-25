import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";
import {
  createNathStorageAdmin,
  NATH_AUDIO_BUCKET,
  requireSubmission,
} from "@/lib/marketing/nath-storage";
import { cleanNathAnswers, cleanNathContact } from "@/lib/marketing/nath-submission";

export const runtime = "nodejs";

interface SubmitBody {
  answers?: unknown;
  attribution?: unknown;
  contact?: unknown;
  token?: unknown;
}

function cleanAttribution(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if ((key === "source" || key.startsWith("utm_")) && typeof entry === "string") {
      result[key] = entry.slice(0, 200);
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  let submission: { id: string } | null = null;
  try {
    submission = requireSubmission(body?.token);
  } catch {
    return nathJson(request, { ok: false, error: "submit_unavailable" }, 503);
  }
  if (!submission) return nathJson(request, { ok: false, error: "invalid_token" }, 401);

  const contact = cleanNathContact(body?.contact);
  const answers = cleanNathAnswers(body?.answers);
  if (!contact || !answers) {
    return nathJson(request, { ok: false, error: "invalid_submission" }, 400);
  }

  const manifest = {
    version: 2,
    type: "nath.submission.received",
    submissionId: submission.id,
    submittedAt: new Date().toISOString(),
    contact,
    attribution: cleanAttribution(body?.attribution),
    answers: answers.map((text, questionIndex) => ({ questionIndex, text })),
  };
  const admin = createNathStorageAdmin();
  const manifestPath = `nath/${submission.id}/submission.json`;
  const { error } = await admin.storage
    .from(NATH_AUDIO_BUCKET)
    .upload(manifestPath, Buffer.from(JSON.stringify(manifest)), {
      contentType: "application/octet-stream",
      upsert: true,
    });
  if (error) {
    return nathJson(request, { ok: false, error: "submission_persist_failed" }, 500);
  }
  return nathJson(request, { ok: true, submissionId: submission.id });
}

export const OPTIONS = nathOptions;
