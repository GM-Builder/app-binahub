---
version: 1
slug: "individual-diagnosis-reference"
primary_target: "src/components/pe-guest-assessment.tsx"
related_targets: ["src/components/pe-email-result.tsx", "src/components/pe-report.tsx", "src/components/pe-diagnosis.module.css"]
---

# Individual diagnosis — reference extension, 26 October 2026

Mode: Operate for entry/answers/access; Read for the report. User confirmed the
entire public guest journey. Visual authority: supplied BinaHub Personal
Development Diagnosis Interface.png and the existing public diagnosis shell.

## Direction contract

THESIS: A clear guided personal-development journey, not a dense questionnaire.
OWN-WORLD: BinaHub navy, white surfaces, pale blue curved ground, small gold
individual accent, inherited Jakarta type and familiar native form controls.
STORY: Understand the three areas, provide context, answer without waiting for
autosave, review, submit, then open private results from email.
FIRST VIEWPORT: Compact white logo header, a 32px introduction, a narrow area
guide on the left and a larger white form on the right. Questions retain the
guide, while reports lead with the existing separate-method profile chart and
practical priorities. Mobile stacks/collapses guidance before the task.
FORM: Code-led extension of the confirmed reference; seed: none (brief-pinned).
Signature interaction: immediate answer selection with background save status,
consistent question-to-review navigation and progressive report detail.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Boundaries

Preserve all CEO question/options/scales, scoring, consent meaning, privacy
purposes, autosave/encryption, retry/conflict handling, attribution and private
email-token flow. The reference's 12 questions, frequency prompt and broad
security claim are not product truth; use the active definition and real
relevance question. No payment, API, database, email template or legacy account
flow changes. Reports are shared with legacy/admin callers, so visual changes
must not alter report content or heading-level support. Existing root DESIGN.md
is architecture and remains untouched. Existing logo is the only shipping raster.

## Implementation record

Implemented as an ordinary extension of the existing public diagnosis shell.
The scoped visual record is `docs/individual-reference-design.md`; behavior and
verification evidence are in `docs/individual-reference-redesign.md`. Root
`DESIGN.md`, `.impeccable/design.json` and global tokens remain unchanged.

Context, questions and review share the observed 1024 px container, 264 px
desktop guide and fluid white task surface. At 767 px and below, guidance stacks
and the question/review guide reduces to static area names without active-area
highlighting or per-area completion counts. At 768–1099 px the sidebar is 210 px;
through 767 px the task guide is a narrow three-column strip. At 479 px and below,
fields use 16 px text and relevance selects stack. Receipt, private access and
the opt-in public report use the same inherited navy/gold identity, Jakarta
typography, header and pale curved ground. Report headings remain configurable
for existing callers.

The supplied reference remains evidence only. `public/full-logo.png` is the
existing repository logo rendered by the shared shell; no new raster is shipped.
The 14 local review images use synthetic mocked questions and report data:
`.impeccable/review/individual-reference-{onboarding,question,case,review,receipt,access,report}-{desktop,mobile}.png`.
They are review artifacts ignored by Git, not participant records or product
assets.

The initial individual browser run passed 2/2 desktop/mobile tests in 21.1 s.
Separate finish review found one accessibility fix: focus the receipt heading on
successful submission. This was implemented, then the production build, targeted
ESLint, 17 PE tests and 2/2 browser tests (35.9 s) passed again. All 14 same-path
captures were refreshed and opened. Bounded reviewer verdict: the sole fix is
resolved; disposition ship. The scoped design record is complete. This does not
claim deployment or backend/security certification.

29 October composition refinement: the guide stays visible throughout questions
and review. Overall question progress is retained; question instructions no
longer expose the active competency. Review shows six question/selected-answer
entries at a time with per-answer editing and explicit reveal of the next six.
This changes display only, preserving all required answers and existing save,
consent, submission and private-access boundaries. See the refreshed scoped
design record and `docs/individual-reference-redesign.md`; earlier finish
evidence above predates this refinement.
