# 2026-08-28 — Nath visual rollback

## Shipped

- Restored Nath's dark SmileFlow visual shell from `99ab323` while preserving the requested intake behavior — **SHIPPED** — [PR #39](https://github.com/valadao-sf/smileflow-site/pull/39) · [production](https://smileflow.com.br/nath) · merge `3c77daaa98bf6527d1360c06bfde98c0da5880da`.

## What went wrong

- The previous change interpreted maximum Apple HIG adherence as permission to replace the approved SmileFlow palette, typography, card and button treatment. The founder wanted only the named flow and control changes.

## Process fix proposed

- When a founder asks for platform-standard behavior on an existing surface, preserve the current visual tokens by default and change only the named controls unless a redesign is explicitly requested.
