# SmileFlow Site — Repository Kernel

Inherit the universal operating contract from `core-agents/AGENTS.md`. This repository is the
public acquisition runtime served at `smileflow.com.br`. It presents approved SmileFlow offers;
it does not independently define positioning, commercial strategy, product truth or data policy.

## Sources and ownership

- Treat current pages and components as implementation evidence, not automatic approval for new
  copy or offers. Read the source named in the request before changing either.
- Before changing stored fields, consent, retention or submission behavior, find the owning
  Supabase schema and current production contract. Do not guess ownership from a UI component.
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

For text, show the focused diff. For a public interaction, open the real route and complete its
main action. Load framework or deployment documentation only when the request touches that surface.
