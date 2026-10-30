---
version: 1
slug: peta
primary_target: src/components/peta-journey.tsx
related_targets: [src/components/peta-report.tsx, src/components/peta-admin.tsx, src/components/peta.module.css]
---
# PETA invitation pilot

## Review wording revision · 30 October 2026

User confirms review remains optional and only the assigned admin (currently the
CEO as program companion) can review. Use the approved “tim pendamping” wording
on participant screens and “admin pendamping” in the dashboard; label the action
“Lihat hasil peserta”. Keep initial checkboxes unchecked, existing ownership/
permission gates and legacy snapshots intact; no facilitator permission is added.
Distinguish absent participant permission from a different assigned reviewer.
This is a code-led Operate copy refinement, not a new consent policy or redesign.

Implemented and verified with18unit tests,10synthetic browser cases and build.
The four privacy/admin desktop/mobile captures were opened and remain readable;
the mechanical detector found no findings. A separate review hit its service
quota, so the scoped fallback review was recorded inline; no independent review
or production authorization claim is made. Existing design tokens remain intact.

## Report copy revision · 30 October 2026

User explicitly requests removal of the report's storage-until/contact sentence.
Keep both charts, exact figures, reflection questions, retained consent disclosure,
one-year retention and consultant permissions unchanged. This is a code-led Read
surface deletion, not a new design or authority to build group reporting. Existing
report composition remains the reference; verify participant and admin variants.

Implemented: the shared participant/admin report no longer renders that sentence.
Both charts, exact counts and reflection prompts remain. Consent/privacy copy,
one-year retention, consultant permissions and the journey help footer are unchanged.
Current report evidence: `.impeccable/review/peta-result-{desktop,mobile}.png`,
refreshed on 30 October 2026; the scoped detector reports no findings.

## Current direction contract · 30 October 2026

THESIS: PETA belongs to an existing program; participants enter through its
shared QR/code and retain their own private identity and result.
OWN-WORLD: Preserve the existing BinaHub program shell, share-card QR, Jakarta,
navy/ice, native controls and 760px questionnaire. No new identity or raster.
STORY: Admin creates/selects a program and enables PETA. Participants register
or return with their personal participant code, read plain instructions and a
short disclaimer, consent, practise, and complete 24 situations.
FIRST VIEWPORT: Instructions lead. Plain result-purpose and privacy summaries
remain discoverable; internal policy references/version IDs are not rendered.
Admin selects a real program rather than creating another independent activity.
FORM: User-confirmed local extension, code-led, no comp or concept seed. Next/
Back switch immediately with a finite 200ms transform/opacity transition; a
serial background queue preserves revisions/latest edits and truthful status.
Only final submission waits for confirmed saves. Reduced motion is instant.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, verdict and scoped design record. Root architecture DESIGN stays intact.

The original standalone invitation flow is retained for existing pilot records,
not for new program creation. Never auto-link/migrate old records to a guessed
program, change the real protected program, disclose mapping keys, turn shared
program access into result access, or silently expand consultant permissions.

Operate for invitations, consent, practice and answers; Read for results. Adult
invited professionals. Owner approves the proposed dedicated /peta module,
participant results, separately disclosed consultant access, and one-year
retention from initial consent. No payment or uninvited start.

## Direction contract

THESIS: One situation and two legible choices, not a dense personality-test grid.
OWN-WORLD: Inherited Jakarta/navy, white and ice surfaces, restrained gold,
native controls, fine borders; existing BinaHub header, no decorative new raster.
STORY: Understand preferences, accept the actual data use, practise, choose,
review, and read relative counts without ability or permanent-type labels.
FIRST VIEWPORT: Compact brand header, PETA title and honest pilot introduction,
24-situation explanation and invitation status. Questions use a 760px task column;
mobile places the two choice controls beside each full statement, not small letters.
FORM: Code-led extension of the approved BinaHub shell and CEO screen spec;
seed: none (brief-pinned). No new identity or global token changes.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
review, its verdict, and the scoped design record at docs/peta-design.md. Root
DESIGN.md is the incumbent architecture record and stays intact. No new raster
is shipped; the existing BinaHub logo is reused.

## Boundaries

Preserve all 24 contexts/96 texts/order and private keys. Server-only deterministic
scoring; diverging -24..24 and paired 0..24 charts with a shared table. No AI,
percentages, ranking, forced single type, automatic HR/program recommendation,
participant quality flags, third-party analytics or automatic organization access.
Initial links are one-use; recovery uses a separately verified fresh grant.
Source licensing/privacy review and production security checks remain release
gates. No production SQL, real invitation, email or cleanup is executed here.

## QUALITY BAR (brief-pinned, code-led)

- Exact screen/composition authority: CEO `product/screen-spec.md` in the local
  PETA pack, sections 01–07; inherited `DiagnosisShell` and admin shell.
- The brief specifies one 760px task, two native choice groups, practice,
  all-24 review and two fixed-scale charts with an accessible table. This is
  a precisely specified extension, not an open surface concept; new-work §3
  explicitly exempts it from concept-seed. No seed/decision comp was generated.
- Question content stays intact and readable at 390px, with 44px choice targets;
  no premature dimension disclosure. Autosave failure keeps the local choices.
- Public identity, consent purpose, invitation gate and one-year storage period
  must be understandable without internal operational/configuration language.
- Report must explain relative preferences without a normative ability score,
  preserve ties, and show both net and method counts in charts and text.
- Existing art, typography, global design tokens and unrelated journeys stay
  unchanged. Synthetic screenshots are UI evidence, not psychometric validation.

## Implemented design record

Updated 30 October 2026. The source-grounded PETA design boundary is
`docs/peta-design.md`. It records the inherited palette/type and 760px task column,
program module entry and reused `ProgramShareCard` QR/code, participant identity,
instructions-first consent, native privacy disclosure with a visible rotating
chevron, and immediate question navigation with a finite 200ms transition
(instant for reduced motion). Serial in-memory saves report actual state; final
submission waits for confirmation. Complete review, fixed-axis charts, exact
zero-width bars, private result access and separate consultant permission remain.
It does not replace the root architecture document or create a global sidecar,
global token, raster asset, or new image-provenance record. Existing pilot records
and their invitation UI remain separate from program-bound records.

The current finish review uses eight synthetic captures:
`.impeccable/review/peta-program-{consent,privacy,question,admin}-{desktop,mobile}.png`.
The privacy disclosure's visible-chevron finding was resolved and the scoped
review passed. The twelve earlier captures remain historical evidence:
`.impeccable/review/peta-{welcome,consent,question,review,result,admin}-{desktop,mobile}.png`;
their original consent/admin screens are not current program-entry evidence.
Participant captures include the inherited header. Admin captures show isolated
preview content; actual `AdminShell` inheritance is checked in route source.
Synthetic browser results and screenshots do not establish a live API, production
authorization, security certification, or psychometric validation.
