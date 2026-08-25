# 2026-08-25 — simplifica diagnóstico

## Shipped
- Three-question Closing Diagnosis with immediate PDF, personalized explanation, and Nathálya video — MERGED — PR #6 / https://smileflow-marketing.vercel.app/diagnostico-de-fechamento — Vercel activates it after merge.

## What went wrong
- The browser runtime exposed zero available browsers, so this block has functional and build proof but no honest visual-interaction proof.
- The original Nathálya PDF still names the previous “Venda Clínica” offer on its final page; it was preserved unchanged instead of silently rewriting an approved source.

## Process fix proposed
- Keep one browser backend connected in marketing sessions so the public URL can be visually inspected before the block closes.
