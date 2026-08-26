# 2026-08-26 — Nath public transcription

## Shipped
- Nath public voice transcription — SHIPPED — [PR #25](https://github.com/valadao-sf/smileflow-site/pull/25) / https://smileflow.com.br/nath?source=instagram — a recorded Portuguese question returned readable text and advanced to question two.
- Public transcription rate limit — SHIPPED — Vercel Firewall rule `Nath STT per IP`, enabled at 12 requests per 600 seconds.

## What went wrong
- The earlier composer copy was treated as delivered before the public microphone-to-visible-transcript path had been smoked; production had an ElevenLabs key ID instead of a usable restricted `sk_` key and returned 502.

## Process fix proposed
- A copied public interaction is SHIPPED only after its canonical user action completes on the public URL, including the external provider response and visible UI effect.
