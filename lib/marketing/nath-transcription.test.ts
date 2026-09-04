import assert from "node:assert/strict";
import test from "node:test";

import { transcribeNathAudio } from "./nath-transcription";

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

test("uses SmileFlow's Scribe transcription path first", async () => {
  process.env.GEMINI_API_KEY = "gemini-test\\n";
  process.env.ELEVENLABS_API_KEY = "sk_test";
  const calledUrls: string[] = [];
  globalThis.fetch = async (input) => {
    calledUrls.push(String(input));
    return new Response(JSON.stringify({ text: "  pergunta transcrita  " }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const input = audio();
  const result = await transcribeNathAudio(input.buffer, input.file, "resposta.webm");
  assert.equal(result, "pergunta transcrita");
  assert.equal(calledUrls.length, 1);
  assert.match(calledUrls[0] ?? "", /elevenlabs\.io\/v1\/speech-to-text/);
});

test("falls back to the documented direct Gemini exception when Scribe is unavailable", async () => {
  process.env.GEMINI_API_KEY = "gemini-test";
  process.env.ELEVENLABS_API_KEY = "sk_test";
  const calledUrls: string[] = [];
  globalThis.fetch = async (input) => {
    calledUrls.push(String(input));
    if (calledUrls.length === 1) {
      return new Response(JSON.stringify({ detail: { message: "unavailable" } }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    assert.equal(String(input), "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "fallback transcrito" }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const input = audio();
  const result = await transcribeNathAudio(input.buffer, input.file, "resposta.webm");
  assert.equal(result, "fallback transcrito");
  assert.match(calledUrls[0] ?? "", /elevenlabs\.io\/v1\/speech-to-text/);
  assert.match(calledUrls[1] ?? "", /gemini-2\.5-flash:generateContent/);
});

test("uses the documented direct Gemini exception when ElevenLabs contains only a key id", async () => {
  process.env.GEMINI_API_KEY = "gemini-test";
  process.env.ELEVENLABS_API_KEY = "legacy-key-id";
  let calledUrl = "";
  globalThis.fetch = async (input, init) => {
    calledUrl = String(input);
    assert.equal(calledUrl, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    assert.deepEqual(init?.headers, {
      "content-type": "application/json",
      "x-goog-api-key": "gemini-test",
    });
    const body = JSON.parse(String(init?.body)) as { contents?: Array<{ parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> }> };
    const inlineAudio = body.contents?.[0]?.parts?.[1]?.inlineData;
    assert.equal(inlineAudio?.mimeType, "audio/webm");
    assert.equal(inlineAudio?.data, Buffer.alloc(2_048, 1).toString("base64"));
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "gemini transcrito" }] } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const input = audio();
  const result = await transcribeNathAudio(input.buffer, input.file, "resposta.webm");
  assert.equal(result, "gemini transcrito");
  assert.match(calledUrl, /gemini-2\.5-flash:generateContent/);
});
