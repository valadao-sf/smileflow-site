# 2026-08-27 — Nath one-question intake

## Shipped
- Public four-question Nath intake using the canonical SmileFlow composer, one question per screen, text or transcribed voice answers, real attachments, auto-advance, and a persisted normalized response — SHIPPED — PR #27 / https://smileflow.com.br/nath
- Markdown attachments now use the private Storage bucket's supported MIME consistently in the ticket, signed upload, and persisted metadata — SHIPPED — PR #28 / https://smileflow.com.br/nath

## What went wrong
- Broad Kimi and Grok missions stalled or restated the request; implementation only advanced after the work was reduced to exact file-scoped missions.
- The pre-merge gate missed that browsers send Markdown as `text/markdown` while the existing private bucket accepts `text/plain`; the defect was caught by the public file-upload smoke.
- The first post-merge retry loaded seconds before the production activation and therefore exercised the old bundle; commit deployment status plus a fresh navigation separated activation delay from a code regression.

## Process fix proposed
- For any attachment-path change, make one real file upload on the public URL part of the release proof; response status alone does not prove Storage accepted the bytes.
