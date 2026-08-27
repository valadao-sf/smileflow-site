import { INSTAGRAM_QUESTION, QUESTIONS } from "@/components/marketing/nath/copy";
import { createNathStorageAdmin } from "@/lib/marketing/nath-storage";

export const NATH_FORM_SLUG = "nath-question-v1";
export const NATH_QUESTION_COUNT = 4;
export const NATH_ANSWER_MAX_CHARS = 12_000;

export type NathInputMode = "text" | "voice" | "attachment";

export interface NathQuestion {
  id: string;
  questionId: string;
  title: string;
  help: string;
}

export interface PublishedNathForm {
  id: string;
  version: string;
  questions: readonly [NathQuestion, NathQuestion, NathQuestion, NathQuestion];
}

interface FormPageLike {
  id?: unknown;
  type?: unknown;
  order?: unknown;
  questionId?: unknown;
  questionText?: unknown;
  help?: unknown;
  description?: unknown;
}

function pageHelp(page: FormPageLike): string {
  if (typeof page.help === "string") return page.help;
  if (typeof page.description === "string") return page.description;
  return "";
}

function asQuestion(page: FormPageLike): NathQuestion | null {
  if (page.type !== "question") return null;
  if (typeof page.id !== "string" || page.id.length === 0) return null;
  if (typeof page.questionId !== "string" || page.questionId.length === 0) return null;
  if (typeof page.questionText !== "string" || page.questionText.length === 0) return null;
  return {
    id: page.id,
    questionId: page.questionId,
    title: page.questionText,
    help: pageHelp(page),
  };
}

function expectedCopy(): readonly { title: string; help: string }[] {
  return [
    QUESTIONS[0],
    QUESTIONS[1],
    QUESTIONS[2],
    { title: INSTAGRAM_QUESTION, help: "" },
  ];
}

export function validatePublishedNathForm(row: unknown): PublishedNathForm | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0) return null;
  if (typeof record.version !== "string" || record.version.length === 0) return null;
  if (record.status !== "published") return null;
  if (record.slug !== NATH_FORM_SLUG) return null;
  const definition = record.definition;
  if (!definition || typeof definition !== "object") return null;
  const pages = (definition as { pages?: unknown }).pages;
  if (!Array.isArray(pages)) return null;

  const questionPages = pages
    .filter((page): page is FormPageLike => !!page && typeof page === "object")
    .filter((page) => page.type === "question")
    .sort((a, b) => {
      const left = typeof a.order === "number" ? a.order : 0;
      const right = typeof b.order === "number" ? b.order : 0;
      return left - right;
    });

  if (questionPages.length !== NATH_QUESTION_COUNT) return null;

  const questions: NathQuestion[] = [];
  const expected = expectedCopy();
  for (let index = 0; index < NATH_QUESTION_COUNT; index += 1) {
    const question = asQuestion(questionPages[index] ?? {});
    const freeze = expected[index];
    if (!question || !freeze) return null;
    if (question.title !== freeze.title) return null;
    if (question.help !== freeze.help) return null;
    questions.push(question);
  }

  return {
    id: record.id,
    version: record.version,
    questions: questions as unknown as PublishedNathForm["questions"],
  };
}

export async function loadPublishedNathForm(): Promise<PublishedNathForm | null> {
  const admin = createNathStorageAdmin();
  const { data, error } = await admin
    .from("forms")
    .select("id, slug, version, status, definition")
    .eq("slug", NATH_FORM_SLUG)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return validatePublishedNathForm(data);
}
