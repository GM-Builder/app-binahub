# Individual diagnosis — scoped design record

Observed on 26 October 2026 for the public guest journey at
`/insight/individual` and its private email-result route. This extends the public
diagnosis visual system recorded in
[`diagnosis-reference-design.md`](diagnosis-reference-design.md). It does not
establish a repository-wide visual system. Root `DESIGN.md` remains the
architecture record; global tokens and `.impeccable/design.json` are unchanged.
Behavioral boundaries and verification limits are recorded in
[`individual-reference-redesign.md`](individual-reference-redesign.md).

Sources: the supplied **BinaHub Personal Development Diagnosis Interface.png**,
`pe-guest-assessment.tsx`, `pe-email-result.tsx`, `pe-report.tsx`,
`pe-diagnosis.module.css`, the existing diagnosis shell and stylesheet, inherited
typography in `src/app/globals.css`, and the 14 desktop/mobile review captures.

## Overview

The individual journey carries the reference's guided composition through
context entry, questions, review, submission receipt, private access and report.
A narrow area guide accompanies the active task on desktop. The guide becomes a
compact three-area overview on small screens, keeping the form or current
question central. The report begins with the existing separate-method profile
chart and practical priorities, then exposes supporting detail progressively.

The shared public shell supplies the real BinaHub logo, white header, pale blue
curved ground, navy actions, small gold individual accent and Plus Jakarta Sans.
The extension changes route-local composition and presentation. The active
instrument, privacy purposes and email access behavior remain the authority for
content, including the current 18-question count and work relevance prompt.

## Colors

Inherited primary navy (`#0b2c6b`) anchors text, selected controls and actions.
Muted blue (`#516783`) supports hierarchy, with pale borders (`#e2eaf5`), white
task surfaces and the shell's cool ground (`#f8faff`). Gold (`#b77811`) on cream
(`#fff5df`) identifies the individual journey through the inherited icon tile.
These are observed route values, not changes to global tokens.

Area icons use blue (`#174c9f`) on pale blue (`#eef5ff`); the current area's icon
reverses to white on navy. Selected answer rows use pale blue (`#eff5ff`) with a
stronger border (`#4772b0`). Context notices, case scenarios and report priorities
use related pale blue fills to distinguish supporting material from the task.
The profile chart retains its existing distinct colors for the two methods.

## Typography

Plus Jakarta Sans is inherited from the app, with the existing Inter, system and
sans-serif fallbacks. Main titles use 700 weight with tight negative tracking;
task-card, section and question headings use 600. Body copy has open line spacing so
Indonesian instructions and answer options remain readable.

| Role | Desktop | At 479 px and below |
| --- | --- | --- |
| Context introduction | 32 px / 1.35 | 26 px / 1.35 |
| Active-task introduction | 26 px | 24 px |
| Question legend | 20 px / 1.65 | 18 px / 1.65 |
| Receipt title | 28 px / 1.4 | 25 px / 1.4 |
| Private-access introduction | 32 px / 1.4 | 26 px / 1.4 |
| Public report title | 28 px / 1.4 | 24 px / 1.4 |

The access introduction first reduces to 28 px at 767 px and below. Task card
titles are 18 px; report section headings are 20 px. Form labels use 13 px,
answer rows use 13 px, and helper/save text uses 11 px. Inputs use 14 px on
desktop and 16 px at 479 px and below. Supporting copy generally ranges from
12–14 px; the report retains its existing readable body hierarchy.

## Layout

The inherited white header is at least 64 px high, with a logo at 126 px wide
and a return-to-diagnosis link. The individual container is capped at 1024 px,
with 28 px horizontal padding. Context entry, questions and review use a 264 px
guide beside a fluid task surface, separated by an 18 px gap. The guide is sticky
at a 24 px top offset on desktop. The introduction sits above both columns.

At 767 px and below, the guide and access layout stack in one column. Guidance
loses sticky positioning; the three areas form equal columns. The active-task
guide retains area names and completion counts while hiding its repeated
introduction and privacy reminder. Context entry retains the guide introduction;
its area descriptions hide at 479 px and below. The repeated area chips hide
at 767 px and below. This compression does not remove the form's privacy
disclosure or required consent.

At 479 px and below, page padding becomes 18 px horizontally, cards use 19 px
horizontal padding, and relevance labels stack above full-width selects. The
report's chart/priority columns stack at 767 px and below. Receipt content is
centered within a 680 px surface; private access uses two balanced columns with
a 42 px gap before stacking. The report uses the 1024 px container with 30 px
internal horizontal padding, reducing to 21 px on small screens.

## Elevation & Depth

White task, receipt, access and report surfaces use a restrained ambient shadow
(`0 10px 38px #254d850c`). The area guide uses a fine border and translucent white
fill instead. Consultation and privacy controls below the report remain separate
surfaces, with the consultation using a lighter shadow. The shared curved ground
is decorative CSS and is excluded from the accessibility tree and pointer input.
No reference-image background or new raster decoration is shipped.

## Shapes

Main task, guide, access and report surfaces have 20 px corners; task and guide
corners reduce to 17 px on small screens. The receipt uses 22 px corners. Fields
use 10 px corners, answer rows use 11 px, and inherited primary buttons use
12 px. Icon tiles and native radio/checkbox controls repeat the existing shell's
soft geometry.

## Components

The shared shell continues to render `public/full-logo.png` directly without
image optimization. This existing repository asset is the only shipping raster;
the user-supplied reference is visual evidence and is not bundled. Icons are
existing Lucide SVG components.

The area guide uses the active definition for area names, descriptions and
completion counts. Context entry pairs labelled native fields with helper copy,
work-relevance selects, an expandable data-use explanation and required consent.
Fields are at least 44 px high. Primary actions inherit a 48 px minimum height,
navy gradient, clear disabled state and the shared hover treatment.

Questions place a count and native progress indicator above the area/method
label. A case scenario receives a tinted inset before the question. Full-row
radio labels are at least 53 px high; selected rows change border and fill while
retaining the native radio indicator. Back/next actions remain in a divided
footer, followed by an announced background-save status. Focus moves to the
current question or review heading when navigation changes the task.

Review groups completion by area and provides an explicit return to each area's
questions before final submission. Receipt content distinguishes acceptance from
email delivery, then provides email guidance and access help. Successful
submission moves focus to the receipt heading and the viewport to the document
top. Private access
uses an explicit open action, with link recovery and access information in native
disclosures. Opening a report moves focus to the result container.

Public report styling is opt-in through `presentation="reference"`; existing
legacy/admin callers retain their presentation and heading-level support. The
public report combines section links, the existing chart, a tinted priority
panel, practical steps, and native disclosures for tables, area detail and
method/version context. Consultant permission, optional evaluation, consultation
and deletion controls keep their existing distinct purposes and behavior.

Keyboard focus inherits the shell's visible 2 px outline and 4 px offset.
Reduced-motion preferences disable shell animations and transitions, including
the brief inherited action transitions. These are implementation observations;
the record does not claim a complete accessibility certification.

## Do's and Don'ts

- Do extend the inherited public shell and keep these measurements scoped to the
  guest individual journey.
- Do derive question counts, area content and relevance meaning from the active
  definition, and preserve CEO-owned questions, scales, scores and report content.
- Do keep background save, receipt, private access and email delivery states
  distinct in participant-facing copy.
- Do preserve the separate report methods and the treatment of missing evidence.
- Don't promote the reference's 12-question count, frequency prompt or broad
  security wording into product truth.
- Don't apply this route record to global tokens, admin, paid journeys or legacy
  account presentation without a separately authorized change.
