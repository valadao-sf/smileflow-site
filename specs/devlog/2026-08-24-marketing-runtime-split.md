# 2026-08-24 — Marketing runtime split

## Shipped
- The `quando-acham-caro` acquisition route now builds in the dedicated `smileflow-site` repository with no Olana, Supabase, authentication, database, or product runtime dependency — PARTIAL — local production build and 390×667 browser journey passed; public activation waits on merge and routing.

## What went wrong
- A simple marketing route paid the monorepo's three-minute frontend gate and six-minute production build, including an irrelevant Olana boundary check.

## Process fix proposed
- New public acquisition routes belong in `smileflow-site`; the product monorepo may only keep a temporary path rewrite while migration is incomplete.
