# SmileFlow Site — Repository Kernel

Inherit the universal operating contract from `core-agents/AGENTS.md`. This repository is the
public acquisition runtime served at `smileflow.com.br`. It presents approved SmileFlow offers;
it does not independently define positioning, commercial strategy, product truth or data policy.

## Sources and ownership

- Use current pages and components to move quickly; get new copy or offers from their approved
  source. Start at the source named in the request.
- For stored fields, consent, retention or submission behavior, follow the owning Supabase schema;
  UI components do not define data ownership.
- Keep product application behavior in the owning SmileFlow repository. This repository owns the
  public site and its acquisition interactions.

## Dangerous boundaries

- Nath intake can handle contact details, voice and attachments. Keep privileged keys server-only,
  use signed uploads, preserve controlled bucket/path rules and isolate submissions by UUID.
- Preserve the binding between a submission, the published form/version and the consent captured.
- PII, uploaded media, persistence, privileged service access and production publication are
  dangerous boundaries. Use the universal ask-first and proof rules.
- Never use real visitor data in fixtures, screenshots, prompts or model review.

## Proof and implementation context

Use a focused diff for text and open the real route when the changed public interaction needs proof.
Load framework or deployment docs when the touched surface needs them.
