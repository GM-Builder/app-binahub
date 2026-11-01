---
version: 1
slug: peta
primary_target: src/components/peta-journey.tsx
related_targets: [src/components/peta-report.tsx, src/components/peta-admin.tsx, src/components/peta.module.css]
---
# PETA invitation pilot

## Admin-only PDF export - 1 November2026 - app0.51.1 / API0.47.2

Owner removes PDF downloads from all participant journeys, including legacy,
program and result-only entry. Keep the existing report/charts, focus, identity
and navigation intact; remove the download action and its unused spacing rule.
Admin individual/group downloads remain in the existing workspace, with the
same consent/retention guards. API removes the participant PDF route too, not
merely its button. This supersedes the participant-download instructions below;
no redesign, scoring/consent change, new asset, SQL or environment variable.

Finish:52 frontend tests,91 API PETA tests and two desktop/mobile browser cases
pass; participant result and admin individual captures were inspected together.
No participant button/request remains; admin individual/group downloads succeed
and permission-denial still offers retry. Scoped lint/type checks and both
production builds pass; the scoped UI detector returns no findings. No live
production access or independent security certification is implied.

## PDF hierarchy refinement - 1 November2026 - API0.47.1

Owner requests typographic hierarchy, consistent leading and balanced PDF spacing,
the original BinaHub logo, and removal of the group admin-companion/internal label.
This is a Read refinement in the sibling API renderer; web UI/scoring/permissions
are untouched. Embed the exact app full-logo.png wordmark and local Inter weights,
not a text approximation or the API's existing square mark. Use the22/20/14pt
title hierarchy, stable native font leading, meaning-based block spacing and
right-aligned numeric columns. Keep the full logo and separately aligned page
count/privacy footer on each page. Group classification wording changes only in
the PDF; confidentiality and review/retention guards remain. The detailed current
record is `binahub-api/docs/peta-pdf-design.md`. Both two-page synthetic examples
were rasterized and inspected; layout assertions cover37 long-name participants.
No browser surface or user choices changed, and no SQL/env change is required.

## Private report downloads - 1 November2026 - app0.51.0

Owner requests individual/group PDFs, then explicitly selects INTERNAL admin
group reports first. This is an Operate/Read extension of the current navy/Jakarta
workspace, not a new visual identity or change to PETA scoring/consent. Add a
plain download button to the participant result and named admin result view;
use a fourth **Laporan grup** view under the same program selector, including
retained history. One workspace per report, explicit prepare/refresh action,
full server coverage/exclusions, descriptive tie-preserving patterns and an
alphabetical matrix with native overflow on mobile. Show empty/loading/retry/
download states, explain internal-only handling, and recheck eligibility on export.
No ranking, automatic sharing/email, public PDF link, AI or extra data entry.

The PDF uses two concise A4 pages for the individual example and a group summary
plus automatically paginated matrix with repeating headers. Exact figures and
fixed-scale vector charts stay readable; numbered privacy footers and the CEO
disclaimer remain. Technical versions/IDs and storage-until copy are not restored.
Embedded local fonts require no external fetch; the web font is unchanged.

Finish:47 frontend tests,88 API PETA tests and2 desktop/mobile browser cases pass.
Four web captures `.impeccable/review/peta-pdf-{individual,group}-{desktop,mobile}.png`
were inspected, with overflow checks at320/768/1024. The detector found no issues.
Both synthetic two-page PDFs were rasterized and inspected; layout regression
tests cover every numbered footer, repeated headers, long names/37 members,
ties, zeros and an explicit >500-results rejection without silent truncation.
One renderer-specific numeric line-height inheritance issue was fixed rather
than shipping invisible page numbers. Production deployment/access is not proven
by these local checks. See `docs/peta-reporting-plan.md` for SQL80 and boundaries.

## Complete pre-start guidance · 1 November 2026 · app0.50.4

The owner asks to ADD the explicit most/least guidance, not reduce the pre-start
page to only those two instructions. Keep the introduction/purpose of PETA and
24-situation/four-statement format, a complete five-step ordered guide with two
nested column explanations, honest-answer guidance, Back/review/finalization,
and the unscored practice explanation for new invitations. Put the CEO-approved
preference-not-competence disclaimer once in its notice. Merge duplicate purpose
copy in the surrounding header/footer; do not restore technical policy/version/
session-timeout bullets. Retain the separate privacy disclosure and unchanged
unchecked consent controls. Native list semantics and existing navy/Jakarta,
760px task layout are preserved. No backend, source, scoring, SQL or env changes.

35 scoped Vitest tests and two synthetic browser tests passed. Desktop1440 and
mobile390 full-page captures at `.impeccable/review/peta-instructions-complete-*`
were inspected together; the same tests passed overflow checks at320/768/1024px.
The inherited screenshot/Playwright launcher is retained and now forwards CLI
filters so this copy pass does not need an unrelated whole-product browser run.
Scoped ESLint, TypeScript and the Next16.4.2 production build passed; the scoped
mechanical detector reported no findings. Production deployment is not verified
by these local checks. The first sandboxed Vitest launch could not rename its
temporary cache; the unchanged suite passed when rerun with normal local access.

## Shared admin access · 31 October 2026

Owner explicitly replaces the creator-only admin scope with access for all verified
BinaHub admins. Progress, settings and consented reports are shared across admins;
optional participant review permission, finalized answers and retention stay intact.
Copy names the admin team rather than “akun admin saya” or a different assigned
reader. Server canReadResult remains authoritative. No layout or visual identity
change. Owner also corrects “antartim” to “antar tim” in situation14's public DTO;
the immutable source, option IDs and scoring key are not rewritten. These current
requirements supersede the historical creator-only directions below.

CEO participant revision on31 October2026: put the context inside the question
card before its statements. Review all24 contexts with the two selected full
texts and the existing Edit action. Use the approved “Hasil merupakan
kecenderungan pribadi/tabiat, bukan ukuran kemampuan/kompetensi.” notice. Add one
plain-language, deterministic reflective paragraph, preserving ties/close scores;
never infer ability, a permanent personality label or use AI. Hide version strings
and generated technical participant IDs in report headers; keep the date and
internal audit metadata. Exact counts, both charts, saved answers and scoring
remain unchanged. This is an Operate/Read refinement, not a new visual world.

## Admin workspace revision · 30 October 2026 · v0.50.0

Operate mode: owner requests friction reduction in existing PETA administration,
not a new instrument, consent policy, public journey or report format. Preserve
the navy/Jakarta admin shell and API contracts. One program picker scopes the
participants, QR and settings; participant management is the default. A lone
program is selected automatically; an explicit valid program_id takes precedence.
Use three native button views: Peserta, Akses peserta, Pengaturan. The participant
list uses a three-column desktop layout and a two-column identity/progress mobile
layout with actions below. Search/status filters are local to the loaded records.
Counts explicitly describe at most 100 loaded submissions, not all enrolled people.
The server's canReadResult remains authoritative; false never offers a result
button. Results open in a named participant view, and Back restores list focus
and its retained program/search/status. Risky actions sit inside a native details
disclosure with existing confirmations. Legacy pilot and audit remain in settings.
QR uses ProgramShareCard without changing its behavior, with min-width fixes scoped
to this workspace. No new raster, palette, motion, SQL or env is introduced.

Source and finish review: 31 scoped unit tests (including navigation), 12 desktop/mobile synthetic browser
cases, ESLint, TypeScript and a successful Next production build. Eight captures
`peta-workspace-{participants,access,settings,result}-{desktop,mobile}.png` were
inspected in a batched pass; QR overflow was fixed and the confirmation pass passed
at 320/390/768/1024px. The scoped detector reported no findings. This is a local
inline finish review, not an independent pentest or proof of production access.
The shared brand font is now self-hosted under the unchanged CSP; two additional
real Next build loopback checks render synthetic reports and load the font with
no external requests, page errors or CSP violations. Admin shell guide/navigation
copy is aligned to the new workflow; other admin surfaces remain unchanged.
Final functional guards distinguish a configured PETA module from an inactive
program and confirm before discarding edited settings on a program change.

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
