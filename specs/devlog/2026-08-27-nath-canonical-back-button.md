# 2026-08-27 — Nath canonical back button

## Shipped
- Replaced the invented Nath back pill with a scoped port of SmileFlow's canonical outline wizard button — SHIPPED — PR #34 / https://smileflow.com.br/nath
- Raised the canonical button target to the DS 44px size required by Apple HIG — SHIPPED — PR #35 / https://smileflow.com.br/nath
- Preserved back navigation and restored the prior question and answer on desktop and mobile — SHIPPED — https://smileflow.com.br/nath

## What went wrong
- The previous implementation was described as Design System-aligned without reusing or resolving the actual canonical component.
- The first Kimi visual loop reopened the rejected Tailwind architecture decision and left unrequested dependencies and incomplete screenshots; both were removed before commit.
- Local visual QA could not render `/nath` without server credentials, and the Vercel preview was login-protected, so the final smoke had to run on the production URL after merge.

## Process fix proposed
- When the founder names a canonical UI reference, freeze the exact component, resolved states and mobile target before editing, then prove that contract on the real URL before calling it aligned.
