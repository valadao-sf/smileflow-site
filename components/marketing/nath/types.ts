export type Step =
  | "landing"
  | "contact"
  | "q1"
  | "q2"
  | "q3"
  | "success";

export interface ContactInfo {
  name: string;
  instagram: string;
}

export interface RecordedAnswer {
  blob: Blob;
  url: string;
  durationS: number;
  mimeType: string;
}

export const QUESTION_STEPS: readonly Step[] = ["q1", "q2", "q3"];
