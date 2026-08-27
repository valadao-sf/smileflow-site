import { type NextRequest } from "next/server";

import { nathJson, nathOptions } from "@/lib/marketing/nath-cors";
import { createNathStorageAdmin } from "@/lib/marketing/nath-storage";
import {
  NATH_MEDIA_BUCKET,
  nathMediaPath,
  validateUploadTicketInput,
} from "@/lib/marketing/nath-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = validateUploadTicketInput(body);
  if (!parsed.ok) {
    return nathJson(request, { ok: false, error: parsed.error }, parsed.status);
  }

  const path = nathMediaPath(parsed.ticket.submissionId, parsed.ticket.filename);
  try {
    const admin = createNathStorageAdmin();
    const { data, error } = await admin.storage
      .from(NATH_MEDIA_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data?.signedUrl) {
      return nathJson(request, { ok: false, error: "upload_ticket_create_failed" }, 500);
    }
    return nathJson(request, {
      ok: true,
      bucket: NATH_MEDIA_BUCKET,
      path,
      uploadUrl: data.signedUrl,
    });
  } catch {
    return nathJson(request, { ok: false, error: "upload_ticket_unavailable" }, 503);
  }
}

export const OPTIONS = nathOptions;
