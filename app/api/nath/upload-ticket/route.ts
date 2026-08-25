import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  createNathStorageAdmin,
  NATH_AUDIO_BUCKET,
  requireSubmission,
} from "@/lib/marketing/nath-storage";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"]);

interface UploadTicketBody {
  contentType?: unknown;
  fileSize?: unknown;
  questionIndex?: unknown;
  token?: unknown;
}

function extensionFor(contentType: string): string {
  if (contentType === "audio/mp4") return "m4a";
  if (contentType === "audio/ogg") return "ogg";
  if (contentType === "audio/mpeg") return "mp3";
  return "webm";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as UploadTicketBody | null;
  let submission: { id: string } | null = null;
  try {
    submission = requireSubmission(body?.token);
  } catch {
    return NextResponse.json({ ok: false, error: "upload_unavailable" }, { status: 503 });
  }
  if (!submission) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const contentType =
    typeof body?.contentType === "string"
      ? body.contentType.split(";")[0].trim().toLowerCase()
      : "";
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;
  const questionIndex = body?.questionIndex;
  if (
    !ALLOWED_MIMES.has(contentType) ||
    !Number.isInteger(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_AUDIO_BYTES ||
    !Number.isInteger(questionIndex) ||
    Number(questionIndex) < 0 ||
    Number(questionIndex) > 2
  ) {
    return NextResponse.json({ ok: false, error: "invalid_audio" }, { status: 400 });
  }

  const path =
    `nath/${submission.id}/q${Number(questionIndex) + 1}-${randomUUID()}.${extensionFor(contentType)}`;
  const admin = createNathStorageAdmin();
  const { data, error } = await admin.storage
    .from(NATH_AUDIO_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ ok: false, error: "upload_ticket_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    bucket: NATH_AUDIO_BUCKET,
    contentType,
    path,
    uploadUrl: data.signedUrl,
  });
}
