import assert from "node:assert/strict";
import test from "node:test";

import { INSTAGRAM_QUESTION, QUESTIONS } from "../../components/marketing/nath/copy";
import { validatePublishedNathForm } from "./nath-form";

function formRow() {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "nath-question-v1",
    version: "1.0",
    status: "published",
    definition: {
      pages: [
        ...QUESTIONS.map((question, index) => ({
          id: `page-${index + 1}`,
          questionId: `q${index + 1}`,
          type: "question",
          order: index + 1,
          questionText: question.title,
          help: question.help,
        })),
        {
          id: "page-4",
          questionId: "instagram",
          type: "question",
          order: 4,
          questionText: INSTAGRAM_QUESTION,
          help: "",
        },
      ],
    },
  };
}

test("accepts only the published frozen four-question definition", () => {
  const form = validatePublishedNathForm(formRow());
  assert.equal(form?.questions.length, 4);
  assert.equal(form?.questions[3].questionId, "instagram");
});

test("rejects copy drift", () => {
  const row = formRow();
  row.definition.pages[0]!.questionText = "Pergunta reescrita";
  assert.equal(validatePublishedNathForm(row), null);
});
