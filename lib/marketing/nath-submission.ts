import type { NathInputMode, NathQuestion } from "@/lib/marketing/nath-form";
import { NATH_ANSWER_MAX_CHARS, NATH_QUESTION_COUNT } from "@/lib/marketing/nath-form";

export function cleanInstagram(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/\/$/, "");
}

export function cleanNathInstagram(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const instagram = cleanInstagram(value);
  if (!instagram || instagram.length > 100) return null;
  return instagram;
}

export interface NathContact {
  fullName: string;
  instagram: string;
  canMentionName: boolean;
  canTagInstagram: boolean;
}

export function cleanNathContact(value: unknown): NathContact | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.fullName !== "string"
    || typeof record.canMentionName !== "boolean"
    || typeof record.canTagInstagram !== "boolean"
  ) return null;
  const fullName = record.fullName.trim().replace(/\s+/g, " ");
  const instagram = cleanNathInstagram(record.instagram);
  if (!fullName || fullName.length > 160 || !instagram) return null;
  return {
    fullName,
    instagram,
    canMentionName: record.canMentionName,
    canTagInstagram: record.canTagInstagram,
  };
}

export interface NathAnswer {
  questionId: string;
  text: string;
  inputMode: NathInputMode;
}

export function cleanNathAnswers(
  value: unknown,
  questions: readonly NathQuestion[],
): NathAnswer[] | null {
  if (!Array.isArray(value) || value.length !== NATH_QUESTION_COUNT) return null;
  if (questions.length !== NATH_QUESTION_COUNT) return null;
  const answers: NathAnswer[] = [];
  for (let index = 0; index < NATH_QUESTION_COUNT; index += 1) {
    const entry = value[index];
    const question = questions[index];
    if (!entry || typeof entry !== "object" || !question) return null;
    const record = entry as Record<string, unknown>;
    if (record.questionId !== question.questionId) return null;
    if (
      record.inputMode !== "text"
      && record.inputMode !== "voice"
      && record.inputMode !== "attachment"
    ) return null;
    if (typeof record.text !== "string") return null;
    const text = index === NATH_QUESTION_COUNT - 1
      ? cleanNathInstagram(record.text)
      : record.text.trim();
    if (!text || text.length > NATH_ANSWER_MAX_CHARS) return null;
    answers.push({
      questionId: question.questionId,
      text,
      inputMode: record.inputMode,
    });
  }
  return answers;
}

export function isPostgresDuplicateKey(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}
