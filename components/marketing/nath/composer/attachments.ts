/**
 * Copied from:
 * valadao-sf/smileflow src/app/dashboard/_olana/attachments.ts
 * commit: 02b052e
 *
 * Attachment helpers for the composer: validation, labels and text context.
 * No React; DOM APIs (FileReader) only inside functions, so the module stays
 * import-safe in node (unit tests).
 */

import { t } from "./i18n";
import type { ChatAttachment, ChatAttachmentKind } from "./types";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_DATAURL_BYTES = 3 * 1024 * 1024; // 3 MB decoded

export const ATTACH_ACCEPT = "image/*,audio/*,.pdf,.txt,.md";

const ALLOWED_FILE_MIMES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

const ALLOWED_FILE_EXTENSIONS = /\.(?:pdf|txt|md)$/iu;

export function kindForMime(mime: string, name: string): ChatAttachmentKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (ALLOWED_FILE_MIMES.has(mime) || ALLOWED_FILE_EXTENSIONS.test(name)) return "file";
  return null;
}

export interface AttachmentValidation<T> {
  accepted: Array<{ file: T; attachment: ChatAttachment }>;
  errors: string[];
}

let attachmentSeq = 0;

export function nextAttachmentId(): string {
  attachmentSeq += 1;
  return `att-${Date.now().toString(36)}-${attachmentSeq}`;
}

/**
 * Validates picked/dropped/pasted files against size and type rules and builds the
 * attachment objects (without previewUrl — the caller creates object URLs).
 */
export function validateFiles<T extends { name: string; type: string; size: number }>(
  files: Iterable<T>,
): AttachmentValidation<T> {
  const accepted: Array<{ file: T; attachment: ChatAttachment }> = [];
  const errors: string[] = [];
  for (const file of files) {
    const kind = kindForMime(file.type, file.name);
    if (!kind) {
      errors.push(t("fileTypeNotAllowed", { name: file.name }));
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      errors.push(t("fileTooLarge", { name: file.name }));
      continue;
    }
    accepted.push({
      file,
      attachment: {
        id: nextAttachmentId(),
        kind,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      },
    });
  }
  return { accepted, errors };
}

/**
 * FileReader → data URL (base64) for previews; null on failure.
 * Session-only — never persisted.
 */
export function readFileAsDataUrl(file: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function kindLabel(kind: ChatAttachmentKind): string {
  if (kind === "image") return t("kindImage");
  if (kind === "audio") return t("kindAudio");
  return t("kindFile");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Text appended to the outgoing message so attachments keep honest context.
 */
export function buildAttachmentContext(attachments: ChatAttachment[]): string {
  const blocks: string[] = [];
  for (const attachment of attachments) {
    if (attachment.transcript) {
      blocks.push(`${t("audioTranscriptLabel", { name: attachment.name })}\n${attachment.transcript}`);
    } else {
      blocks.push(t("attachmentMarker", { name: attachment.name, kind: kindLabel(attachment.kind) }));
    }
  }
  return blocks.join("\n\n");
}

/** Compose the final request text: user text first, then the attachment context. */
export function composeMessageText(text: string, attachments: ChatAttachment[]): string {
  const context = buildAttachmentContext(attachments);
  if (!context) return text;
  return text ? `${text}\n\n${context}` : context;
}
