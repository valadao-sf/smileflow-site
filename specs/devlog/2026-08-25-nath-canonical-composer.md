# 2026-08-25 — Nath canonical composer

## Shipped
- Canonical SmileFlow chatbar and centered Nath conversation — SHIPPED — [PR #17](https://github.com/valadao-sf/smileflow-site/pull/17) / https://smileflow.com.br/nath?source=instagram — typing, attachment controls, named loading/error states and the real microphone UI are active; a production text submission persisted only `submission.json`.
- ElevenLabs transcription — BLOCKED — the existing `ELEVENLABS_API_KEY` is an API key ID, not the recoverable `sk_` secret; ElevenLabs rejects it with `api_key_id_used_as_api_key`.

## What went wrong
- The previous implementation approximated the `/inicio` composer after the founder asked for a copy; the founder had to repeat that the complete component tree and behavior were the source of truth.
- Copying the existing ElevenLabs environment value without validating it propagated an unusable key ID and did not enable transcription.

## Process fix proposed
- When the founder names a canonical component to copy, freeze and copy its complete import tree before adapting the host callbacks; validate any copied credential by effect before calling the integration available.
