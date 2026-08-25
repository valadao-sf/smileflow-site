export type Step =
  | "landing"
  | "contact"
  | "q1"
  | "q2"
  | "q3"
  | "consent"
  | "success";

export interface ContactInfo {
  name: string;
  whatsapp: string;
  instagram: string;
}

export interface RecordedAnswer {
  blob: Blob;
  url: string;
  durationS: number;
  mimeType: string;
}

export const QUESTION_STEPS: readonly Step[] = ["q1", "q2", "q3"];
