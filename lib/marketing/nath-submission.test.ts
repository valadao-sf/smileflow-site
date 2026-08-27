import assert from "node:assert/strict";
import test from "node:test";

import type { NathQuestion } from "./nath-form";
import { cleanNathAnswers } from "./nath-submission";

const QUESTIONS: NathQuestion[] = [
  { id: "page-1", questionId: "q1", title: "Q1", help: "" },
  { id: "page-2", questionId: "q2", title: "Q2", help: "" },
  { id: "page-3", questionId: "q3", title: "Q3", help: "" },
  { id: "page-4", questionId: "instagram", title: "Instagram", help: "" },
];

test("accepts four ordered text, voice or attachment answers", () => {
  assert.deepEqual(cleanNathAnswers([
    { questionId: "q1", text: " primeira ", inputMode: "text" },
    { questionId: "q2", text: "segunda", inputMode: "voice" },
    { questionId: "q3", text: "[Anexo: conversa.pdf]", inputMode: "attachment" },
    { questionId: "instagram", text: "https://instagram.com/@pessoa/", inputMode: "text" },
  ], QUESTIONS), [
    { questionId: "q1", text: "primeira", inputMode: "text" },
    { questionId: "q2", text: "segunda", inputMode: "voice" },
    { questionId: "q3", text: "[Anexo: conversa.pdf]", inputMode: "attachment" },
    { questionId: "instagram", text: "pessoa", inputMode: "text" },
  ]);
});

test("rejects incomplete or reordered answers", () => {
  assert.equal(cleanNathAnswers([], QUESTIONS), null);
  assert.equal(cleanNathAnswers([
    { questionId: "q2", text: "fora de ordem", inputMode: "text" },
    { questionId: "q1", text: "resposta", inputMode: "text" },
    { questionId: "q3", text: "resposta", inputMode: "text" },
    { questionId: "instagram", text: "pessoa", inputMode: "text" },
  ], QUESTIONS), null);
});
