import type { ChatAttachment } from "./composer/types";
import type { NathInputMode } from "@/lib/marketing/nath-form";

export interface LocalAnswer {
  questionId: string;
  text: string;
  inputMode: NathInputMode;
  attachments: ChatAttachment[];
}
