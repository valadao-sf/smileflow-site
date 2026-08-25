import { randomUUID } from "node:crypto";

import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";
import { nathUploadSecret } from "@/lib/marketing/nath-storage";
import { createSubmissionToken } from "@/lib/marketing/nath-token";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const submissionId = randomUUID();
    return nathJson(request, {
      ok: true,
      submissionId,
      token: createSubmissionToken(submissionId, nathUploadSecret()),
    });
  } catch {
    return nathJson(request, { ok: false, error: "submission_start_failed" }, 503);
  }
}

export const OPTIONS = nathOptions;
