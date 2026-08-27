import { randomUUID } from "node:crypto";

import { kindForMime, MAX_ATTACHMENT_BYTES } from "@/components/marketing/nath/composer/attachments";

export const NATH_MEDIA_BUCKET = "wa-audit-media";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function sanitizeUploadFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "file";
}

export function nathMediaPrefix(submissionId: string): string {
  return `nath/${submissionId}/`;
}

export function nathMediaPath(submissionId: string, fileName: string, randomId = randomUUID()): string {
  return `${nathMediaPrefix(submissionId)}${randomId}-${sanitizeUploadFileName(fileName)}`;
}

export function mediaPathBelongsToSubmission(path: unknown, submissionId: string): path is string {
  if (typeof path !== "string" || path.includes("..") || path.includes("\\")) return false;
  const prefix = nathMediaPrefix(submissionId);
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/");
}

export interface UploadTicketInput {
  submissionId: string;
  filename: string;
  mime: string;
  size: number;
}

export type UploadTicketValidation =
  | { ok: true; ticket: UploadTicketInput }
  | { ok: false; error: string; status: number };

export function validateUploadTicketInput(body: unknown): UploadTicketValidation {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "invalid_json", status: 400 };
  }
  const record = body as Record<string, unknown>;
  if (!isUuid(record.submissionId)) {
    return { ok: false, error: "invalid_submission_id", status: 400 };
  }
  if (typeof record.filename !== "string" || record.filename.trim().length === 0) {
    return { ok: false, error: "invalid_filename", status: 400 };
  }
  if (typeof record.mime !== "string" || record.mime.length === 0) {
    return { ok: false, error: "invalid_mime", status: 400 };
  }
  if (typeof record.size !== "number" || !Number.isFinite(record.size) || record.size <= 0) {
    return { ok: false, error: "invalid_size", status: 400 };
  }
  if (record.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "file_too_large", status: 413 };
  }
  if (!kindForMime(record.mime, record.filename)) {
    return { ok: false, error: "file_type_not_allowed", status: 400 };
  }
  return {
    ok: true,
    ticket: {
      submissionId: record.submissionId,
      filename: record.filename.trim(),
      mime: record.mime,
      size: record.size,
    },
  };
}

export interface NathMediaUpload {
  questionId: string;
  bucket: string;
  path: string;
  filename: string;
  mime: string;
  size: number;
}

export function validateMediaUploads(
  value: unknown,
  submissionId: string,
  allowedQuestionIds: ReadonlySet<string>,
): NathMediaUpload[] | null {
  if (value == null) return [];
  if (!Array.isArray(value)) return null;
  const uploads: NathMediaUpload[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const record = entry as Record<string, unknown>;
    if (typeof record.questionId !== "string" || !allowedQuestionIds.has(record.questionId)) return null;
    if (record.bucket !== NATH_MEDIA_BUCKET) return null;
    if (!mediaPathBelongsToSubmission(record.path, submissionId)) return null;
    if (typeof record.filename !== "string" || record.filename.length === 0) return null;
    if (typeof record.mime !== "string" || !kindForMime(record.mime, record.filename)) return null;
    if (typeof record.size !== "number" || record.size <= 0 || record.size > MAX_ATTACHMENT_BYTES) return null;
    uploads.push({
      questionId: record.questionId,
      bucket: NATH_MEDIA_BUCKET,
      path: record.path,
      filename: record.filename,
      mime: record.mime,
      size: record.size,
    });
  }
  return uploads;
}
