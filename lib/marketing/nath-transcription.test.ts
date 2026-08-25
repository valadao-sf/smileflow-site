import assert from "node:assert/strict";
import test from "node:test";

import { transcribeNathAudio } from "./nath-transcription.ts";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_GEMINI_KEY = process.env.GEMINI_API_KEY;
const ORIGINAL_ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;

function audio(): { buffer: Buffer; file: Blob } {
  const buffer = Buffer.alloc(2_048, 1);
  return { buffer, file: new Blob([buffer], { type: "audio/webm" }) };
}

test.afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_KEY;
  process.env.ELEVENLABS_API_KEY = ORIGINAL_ELEVENLABS_KEY;
});

test("uses SmileFlow's Gemini transcription path first", async () => {
  process.env.GEMINI_API_KEY = "gemini-test\\n";
  process.env.ELEVENLABS_API_KEY = "legacy-key-id";
  let calledUrl = "";
  globalThis.fetch = async (input) => {
    calledUrl = String(input);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "  pergunta transcrita  " }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const input = audio();
  const result = await transcribeNathAudio(input.buffer, input.file, "resposta.webm");
  assert.equal(result, "pergunta transcrita");
  assert.match(calledUrl, /gemini-2\.5-flash:generateContent/);
});

test("falls back to Scribe only with an actual sk_ key", async () => {
  process.env.GEMINI_API_KEY = "gemini-test";
  process.env.ELEVENLABS_API_KEY = "sk_test";
  const calledUrls: string[] = [];
  globalThis.fetch = async (input) => {
    calledUrls.push(String(input));
    if (calledUrls.length === 1) {
      return new Response(JSON.stringify({ error: { message: "unavailable" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ text: "fallback transcrito" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const input = audio();
  const result = await transcribeNathAudio(input.buffer, input.file, "resposta.webm");
  assert.equal(result, "fallback transcrito");
  assert.match(calledUrls[1] ?? "", /elevenlabs\.io\/v1\/speech-to-text/);
});

test("does not call Scribe with SmileFlow's legacy key id", async () => {
  process.env.GEMINI_API_KEY = "gemini-test";
  process.env.ELEVENLABS_API_KEY = "legacy-key-id";
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    return new Response(JSON.stringify({ error: { message: "unavailable" } }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  };

  const input = audio();
  await assert.rejects(
    () => transcribeNathAudio(input.buffer, input.file, "resposta.webm"),
    /STT unavailable/,
  );
  assert.equal(callCount, 1);
});
