---
version: 1
slug: program-meeting-checklist
primary_target: src/app/admin/_components/spin-meeting-checklist.tsx
related_targets: [src/app/admin/_components/spin-panel.tsx]
---

# Checklist kebutuhan program saat meeting

Mode Operate. Ordinary extension of the existing BinaHub sales workspace.
User confirmed 26 October: reuse CEO questions, see the client's answers,
complete missing needs, keep internal consultation additions separate, no
automatic report rewrite or email. Also allow an admin-led checklist when no
client submission exists. Only submitted client records are identifiable here;
private unsubmitted browser drafts remain private.

## Direction contract

THESIS: One shared conversation brief, with a visible distinction between what
the client submitted and what the consultant adds; no copying between forms.
OWN-WORLD: Inherit BinaHub navy actions, white task surfaces, slate text, thin
dividers, existing sans typography and 12–16px corners. No new visual identity.
STORY: Select a client, open the meeting checklist, identify missing fields,
complete the conversation, save and continue later or mark the session complete.
FIRST VIEWPORT: Client contact and meeting state above a five-group navigator;
the current question group fills the main column. A missing-only filter and
answered/total count lead directly to actionable gaps. Save feedback sits beside
the session actions, not between the operator and the next input.
FORM: Local code-led extension of the established Discovery workspace, using
the same branching fields and answer controls; seed: none (brief-pinned).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Verification

Verified 26 October 2026 against the incumbent admin components and six synthetic,
API-mocked desktop/mobile captures. The sole finish-review fix (outer navigation
bypassing the unsaved-change guard) is resolved; the reviewer's disposition is
ship at fix-list scope. Frontend, SPIN API, four browser checks, lint, and both
production builds passed. Migration 72 and live deployment remain unverified.
See [the design verification report](../../docs/program-meeting-design-verification.md)
for evidence and limits. This ordinary extension preserves the existing
architecture `DESIGN.md` and absent visual sidecar; no new raster asset ships.
