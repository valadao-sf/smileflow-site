import type { ChatAttachment } from "./composer/types";
import type { NathInputMode } from "@/lib/marketing/nath-form";

export interface LocalAnswer {
  questionId: string;
  text: string;
  /** Session-only editable value; attachment-only answers keep this empty. */
  draftText?: string;
  inputMode: NathInputMode;
  attachments: ChatAttachment[];
}
