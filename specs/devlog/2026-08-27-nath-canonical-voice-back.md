# 2026-08-27 — Nath canonical voice and back

## Shipped
- Nath recording again exposes both canonical `/inicio` completions: stop to transcribe into the editable field, or transcribe and send directly — SHIPPED — PR #32 / https://smileflow.com.br/nath
- Question steps now expose the SmileFlow wizard back control and restore the previous text, voice transcript, input mode, and attachments without duplicating answers — SHIPPED — PR #32 / https://smileflow.com.br/nath

## What went wrong
- The prior fix removed canonical direct voice send even though the Chairman had explicitly required all `/inicio` chatbar behaviors; it solved perceived feedback by inventing a new interaction.
- Back navigation was omitted from the first one-question-per-screen implementation instead of being checked against SmileFlow's existing wizard navigation rule.

## Process fix proposed
- When a named reference is frozen, the release proof must compare every touched behavior against that source; any intentional divergence requires explicit approval before implementation.
