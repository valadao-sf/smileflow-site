import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";
import { loadPublishedNathForm } from "@/lib/marketing/nath-form";
import { createNathStorageAdmin } from "@/lib/marketing/nath-storage";
import { cleanNathAnswers, cleanNathContact, isPostgresDuplicateKey } from "@/lib/marketing/nath-submission";
import { isUuid, validateMediaUploads } from "@/lib/marketing/nath-upload";

export const runtime = "nodejs";

interface SubmitBody {
  answers?: unknown;
  attribution?: unknown;
  contact?: unknown;
  formVersion?: unknown;
  media?: unknown;
  submissionId?: unknown;
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
  if (!isUuid(body?.submissionId)) {
    return nathJson(request, { ok: false, error: "invalid_submission_id" }, 400);
  }
  const submissionId = body.submissionId;

  let form;
  try {
    form = await loadPublishedNathForm();
  } catch {
    return nathJson(request, { ok: false, error: "submit_unavailable" }, 503);
  }
  if (!form) {
    return nathJson(request, { ok: false, error: "form_unavailable" }, 503);
  }
  if (typeof body.formVersion !== "string" || body.formVersion !== form.version) {
    return nathJson(request, { ok: false, error: "invalid_form_version" }, 409);
  }

  const answers = cleanNathAnswers(body.answers, form.questions);
  if (!answers) {
    return nathJson(request, { ok: false, error: "invalid_submission" }, 400);
  }

  const questionIds = new Set(form.questions.map((question) => question.questionId));
  const media = validateMediaUploads(body.media, submissionId, questionIds);
  if (!media) {
    return nathJson(request, { ok: false, error: "invalid_media" }, 400);
  }

  const instagram = answers[answers.length - 1]?.text;
  if (!instagram) {
    return nathJson(request, { ok: false, error: "invalid_submission" }, 400);
  }
  const contact = body.contact === undefined ? null : cleanNathContact(body.contact);
  if (body.contact !== undefined && (!contact || contact.instagram !== instagram)) {
    return nathJson(request, { ok: false, error: "invalid_contact" }, 400);
  }

  const row = {
    id: submissionId,
    form_id: form.id,
    form_slug: "nath-question-v1",
    contact_info: contact ?? { instagram },
    answers,
    media_uploads: media,
    metadata: {
      attribution: cleanAttribution(body.attribution),
      formVersion: form.version,
    },
  };

  try {
    const admin = createNathStorageAdmin();
    const { error } = await admin.from("form_responses").insert(row);
    if (isPostgresDuplicateKey(error)) {
      return nathJson(request, { ok: true, submissionId });
    }
    if (error) {
      return nathJson(request, { ok: false, error: "submission_persist_failed" }, 500);
    }
    return nathJson(request, { ok: true, submissionId });
  } catch {
    return nathJson(request, { ok: false, error: "submit_unavailable" }, 503);
  }
}

export const OPTIONS = nathOptions;
