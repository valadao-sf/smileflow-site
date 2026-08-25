import { NextRequest, NextResponse } from "next/server";

import {
  createNathStorageAdmin,
  NATH_AUDIO_BUCKET,
  requireSubmission,
} from "@/lib/marketing/nath-storage";

export const runtime = "nodejs";

interface SubmittedAudio {
  durationS?: unknown;
  mimeType?: unknown;
  path?: unknown;
  questionIndex?: unknown;
  size?: unknown;
}

interface SubmitBody {
  attribution?: unknown;
  audios?: unknown;
  consentGranted?: unknown;
  contact?: unknown;
  token?: unknown;
}

function isContact(value: unknown): value is { name: string; instagram: string } {
  if (!value || typeof value !== "object") return false;
  const contact = value as Record<string, unknown>;
  return (
    typeof contact.name === "string" &&
    contact.name.trim().length > 0 &&
    contact.name.length <= 120 &&
    typeof contact.instagram === "string" &&
    contact.instagram.trim().length > 0 &&
    contact.instagram.length <= 100
  );
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

function validAudios(value: unknown, submissionId: string): SubmittedAudio[] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const seen = new Set<number>();
  for (const audio of value as SubmittedAudio[]) {
    const index = audio.questionIndex;
    if (
      !Number.isInteger(index) ||
      Number(index) < 0 ||
      Number(index) > 2 ||
      seen.has(Number(index)) ||
      typeof audio.path !== "string" ||
      !audio.path.startsWith(`nath/${submissionId}/q${Number(index) + 1}-`) ||
      typeof audio.durationS !== "number" ||
      !Number.isFinite(audio.durationS) ||
      audio.durationS < 0 ||
      typeof audio.size !== "number" ||
      !Number.isInteger(audio.size) ||
      audio.size <= 0 ||
      typeof audio.mimeType !== "string"
    ) {
      return null;
    }
    seen.add(Number(index));
  }
  return value as SubmittedAudio[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  let submission: { id: string } | null = null;
  try {
    submission = requireSubmission(body?.token);
  } catch {
    return NextResponse.json({ ok: false, error: "submit_unavailable" }, { status: 503 });
  }
  if (!submission) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
  if (!isContact(body?.contact)) {
    return NextResponse.json({ ok: false, error: "invalid_contact" }, { status: 400 });
  }
  const audios = validAudios(body?.audios, submission.id);
  if (!audios || typeof body?.consentGranted !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid_submission" }, { status: 400 });
  }

  const manifest = {
    version: 1,
    type: "nath.submission.received",
    submissionId: submission.id,
    submittedAt: new Date().toISOString(),
    contact: {
      name: body.contact.name.trim(),
      instagram: body.contact.instagram.trim(),
    },
    consentGranted: body.consentGranted,
    attribution: cleanAttribution(body.attribution),
    audios,
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
    return NextResponse.json({ ok: false, error: "submission_persist_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, submissionId: submission.id });
}
