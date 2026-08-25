import assert from "node:assert/strict";
import test from "node:test";

import { cleanNathAnswers, cleanNathContact } from "./nath-submission.ts";

test("accepts the three text answers", () => {
  assert.deepEqual(cleanNathAnswers([" primeira ", "segunda", "terceira"]), [
    "primeira",
    "segunda",
    "terceira",
  ]);
});

test("rejects an incomplete conversation", () => {
  assert.equal(cleanNathAnswers(["primeira", "segunda"]), null);
});

test("normalizes the Instagram profile without changing the name", () => {
  assert.deepEqual(
    cleanNathContact({ name: " Nath Silva ", instagram: "https://instagram.com/@nath.silva/" }),
    { name: "Nath Silva", instagram: "nath.silva" },
  );
});
