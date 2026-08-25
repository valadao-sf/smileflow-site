import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { nathUploadSecret } from "@/lib/marketing/nath-storage";
import { createSubmissionToken } from "@/lib/marketing/nath-token";

export const runtime = "nodejs";

export async function POST() {
  try {
    const submissionId = randomUUID();
    return NextResponse.json({
      ok: true,
      submissionId,
      token: createSubmissionToken(submissionId, nathUploadSecret()),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "submission_start_failed" }, { status: 503 });
  }
}
