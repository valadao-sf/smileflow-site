# 2026-08-27 — Nath visible voice transcript

## Shipped
- Voice answers now always return to the editable composer before submission: record, use the visible `Transcrever` action, review the transcript, then send and advance — SHIPPED — PR #30 / https://smileflow.com.br/nath

## What went wrong
- The previous handoff claimed voice was shipped after proving only the recording takeover and the transcription route independently; the Chairman was the first person to expose that the combined interaction did not visibly confirm transcription.
- The copied canonical recording arrow called `sendVoice`, which transcribed successfully and immediately cleared the field while advancing, making a 200 response look like nothing happened.

## Process fix proposed
- A microphone UX change is not proven until the public-page smoke records through the component and asserts that the returned transcript is visibly present in the editable field before submission.
