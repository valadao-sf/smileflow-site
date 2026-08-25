# 2026-08-25 — Closing diagnosis canonical domain

## Shipped
- Closing Diagnosis canonical metadata and proxy-safe assets — MERGED — PR #14 / https://smileflow.com.br/diagnostico-de-fechamento — Vercel activates `main` automatically after merge.

## What went wrong
- Page media used root-relative URLs from the split runtime, so publishing the HTML through the canonical domain could leave images, video, captions, and the PDF pointing at the wrong deployment.

## Process fix proposed
- Split-runtime pages must prove both canonical metadata and public-asset origins before domain publication.
