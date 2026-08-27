import assert from "node:assert/strict";
import test from "node:test";

import {
  NATH_MEDIA_BUCKET,
  mediaPathBelongsToSubmission,
  validateMediaUploads,
  validateUploadTicketInput,
} from "./nath-upload";

const SUBMISSION_ID = "00000000-0000-4000-8000-000000000001";

test("issues tickets only for bounded supported files", () => {
  assert.equal(validateUploadTicketInput({
    submissionId: SUBMISSION_ID,
    filename: "conversa.pdf",
    mime: "application/pdf",
    size: 1024,
  }).ok, true);
  assert.equal(validateUploadTicketInput({
    submissionId: SUBMISSION_ID,
    filename: "virus.exe",
    mime: "application/octet-stream",
    size: 1024,
  }).ok, false);
});

test("binds submitted media to the same submission prefix", () => {
  const path = `nath/${SUBMISSION_ID}/file-conversa.pdf`;
  assert.equal(mediaPathBelongsToSubmission(path, SUBMISSION_ID), true);
  assert.equal(mediaPathBelongsToSubmission(path, "00000000-0000-4000-8000-000000000002"), false);
  assert.equal(validateMediaUploads([{
    questionId: "q1",
    bucket: NATH_MEDIA_BUCKET,
    path,
    filename: "conversa.pdf",
    mime: "application/pdf",
    size: 1024,
  }], SUBMISSION_ID, new Set(["q1"]))?.length, 1);
});
