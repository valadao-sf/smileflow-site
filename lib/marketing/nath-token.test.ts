import assert from "node:assert/strict";
import test from "node:test";

import { createSubmissionToken, readSubmissionToken } from "./nath-token.ts";

const ID = "11111111-2222-4333-8444-555555555555";
const SECRET = "test-secret-that-never-leaves-this-test";

test("accepts a current signed submission token", () => {
  const token = createSubmissionToken(ID, SECRET, 1_000);
  assert.equal(readSubmissionToken(token, SECRET, 1_001)?.id, ID);
});

test("rejects a modified submission token", () => {
  const token = createSubmissionToken(ID, SECRET, 1_000);
  assert.equal(readSubmissionToken(`${token}x`, SECRET, 1_001), null);
});

test("rejects an expired submission token", () => {
  const token = createSubmissionToken(ID, SECRET, 1_000);
  assert.equal(readSubmissionToken(token, SECRET, 1_000 + 2 * 60 * 60 + 1), null);
});
