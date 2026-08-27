/**
 * Copied from:
 * valadao-sf/smileflow src/app/dashboard/_olana/types.ts
 * commit: 02b052e
 *
 * Only the composer attachment types. Olana chat/thread/tool payloads stay out.
 */

export type ChatAttachmentKind = "image" | "audio" | "file";

export interface ChatAttachment {
  id: string;
  kind: ChatAttachmentKind;
  name: string;
  mime: string;
  size: number;
  /** Session-only object URL for previews/playback. Never persisted. */
  previewUrl?: string;
  /** Session-only data URL of images. Never persisted. */
  dataUrl?: string;
  /** Filled after a successful transcription (voice notes / audio uploads). */
  transcript?: string;
  /** Audio duration when known (recorded notes always have it). */
  durationMs?: number;
  /** Session-only transcription state; absent when no transcription was attempted. */
  transcriptStatus?: "pending" | "failed";
  /** Live File retained for signed upload. Never persisted as bytes in form JSON. */
  file?: File;
}
