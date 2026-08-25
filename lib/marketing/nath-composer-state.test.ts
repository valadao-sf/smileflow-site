import assert from "node:assert/strict";
import test from "node:test";

import {
  composerReducer,
  initialComposer,
} from "../../components/marketing/nath/composer/composer-state.ts";

test("voice transcription appends to an existing typed answer", () => {
  let state = composerReducer(initialComposer, { type: "TYPE", text: "Texto antes" });
  state = composerReducer(state, { type: "MIC_START" });
  assert.equal(state.phase, "gravando");
  state = composerReducer(state, { type: "MIC_STOP" });
  assert.equal(state.phase, "transcrevendo");
  state = composerReducer(state, { type: "TRANSCRIPT_READY", text: "e depois por voz" });
  assert.equal(state.phase, "idle");
  assert.equal(state.text, "Texto antes e depois por voz");
});

test("failed submission preserves the answer and attachments for retry", () => {
  let state = composerReducer(initialComposer, { type: "TYPE", text: "Minha resposta" });
  state = composerReducer(state, { type: "ADD_FILES", names: ["conversa.png"] });
  state = composerReducer(state, { type: "THINK_START" });
  state = composerReducer(state, { type: "FAIL", error: "Falha ao enviar." });
  assert.equal(state.phase, "erro");
  assert.equal(state.text, "Minha resposta");
  assert.equal(state.attachments[0]?.name, "conversa.png");
});

test("successful submission clears content and keeps attachment ids monotonic", () => {
  let state = composerReducer(initialComposer, { type: "ADD_FILES", names: ["primeiro.png"] });
  state = composerReducer(state, { type: "DONE" });
  assert.equal(state.text, "");
  assert.deepEqual(state.attachments, []);
  state = composerReducer(state, { type: "ADD_FILES", names: ["segundo.png"] });
  assert.equal(state.attachments[0]?.id, "att-2");
});
