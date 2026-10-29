# Relationship Management preparation — scoped design record

Recorded 29 October 2026 for the internal admin surface at
`/admin/assessments/individual/relationship-management`.
Sources: `src/components/rm-preparation.tsx`, its route page and the existing
`AdminShell`; product boundaries come from `PRODUCT.md` and the authorized
implementation scope. This extends the existing admin identity, not the public
individual journey. Root `DESIGN.md` remains the architecture record; no global
visual sidecar or token migration is introduced.

## Overview

This workspace lets an authorized admin inspect the supplied CEO instrument and
try a synthetic report presentation. The loaded RM source has nine competencies,
27 self-report items and 13 situational-judgment cases. It is internal preparation:
responses in this workspace are not persisted, emailed or treated as participant
results. RM weights remain unapproved; SJT and combined scores are not enabled.
The page exposes no checkout, sale, public access or report delivery action.

Readiness comes first, followed by a native disclosure for source review and
temporary responses, an optional preview, and the CEO report-section outline.
The source's private question and key content must not be copied into design
documentation. The local private SQL 75 instrument payload is separate from the
public schema/importer; this record does not reproduce it or establish deployment.

Import provenance is the CEO files
`BinaInsights_Laporan_Relationship_Management_v4.docx` and
`BinaInsights_Relationship_Management_Bank_Soal_V4.xlsx`, with their source hashes
retained by the import workflow. The DOCX still describes itself as
“Prototipe Revisi v2” and mentions 24 self-report items, while the current bank
contains 27. A v4 filename/import identifier is not final instrument approval.
The private installer is
`../binahub-api/private/relationship-management-v4/SQL75_RM_COMPLETE.private.sql`;
its contents stay local/private. Candidate-alignment source data preserves
Core/Secondary qualification and conditions; this record does not turn those
conditional references into unconditional recommendations. The PE 50:50 method
weight does not establish an RM weight.

## Colors

Inherited navy (`#0B2C6B`) anchors the surface and controls. White panels and slate
borders/text carry the existing admin visual vocabulary; muted slate explains
readiness and limits. Errors use an amber surface and dark amber text. No new
palette, decorative illustration or status-color scale is introduced.

## Typography

The page inherits the app's sans family. Section headings are 20px/600;
instructions, readiness details, source controls and table cells use the existing
14px body treatment. Longer instructions and choices use 28px line height.
Question legends and table row labels use medium weight. This hierarchy serves
internal source inspection; it does not define new global typography tokens.

## Layout

The content follows `AdminShell` in a single vertical sequence with 24px section
gaps. The introductory boundary statement is capped at `max-w-3xl`. Readiness,
question review and preview are white bordered panels with 24px padding. Source
review groups have 24px gaps; self-report selects fill their available width.
Cases use full-row native radio choices. The preview table keeps a 560px minimum
width within a local horizontal scroll wrapper, preserving readable columns on
small screens without widening the page. The report-section outline follows the
preview/source-review area rather than becoming another control panel.

## Elevation & Depth

This surface uses white/slate layering and fine borders without a new shadow or
glass treatment. It introduces no raster assets or motion-led presentation.
The existing preview button uses a small loading spinner while calculating.

## Shapes

Main panels use 12px corners. Native selects and outlined actions use 8px corners;
case options use the existing softly rounded bordered-row treatment. These are
ordinary admin patterns, not a new card language for public pages.

## Components

The return link leads to the individual assessment admin workspace. Outlined
actions are at least 44px high, use slate borders/navy text and a pale hover
surface, show disabled opacity, and define a visible focus outline. Source
review uses native `details`/`summary`; its summary and answer controls preserve
44px minimum interaction height.

The readiness panel distinguishes a loaded source from a missing private source,
shows the returned version/counts, and lists outstanding preparation. The source
bank is displayed only when its definition is available. Native selects provide
self-report choices; cases retain grouped radio controls. Changing a response
clears the previous preview, so an old preview is not presented as current.

Preview requests are explicitly initiated and use only the current temporary
responses. The preview distinguishes an available self-report value from
“Data belum cukup”; every case-score cell says “Menunggu bobot”. It has no
combined score. A three-column table presents competency, self-report and SJT
status, followed by an ordered 30-day action outline. The UI communicates its
synthetic/internal status rather than presenting a delivered customer report.

Loading uses an announced status. A failed authenticated request shows an alert
and a retry action; the page makes no success or persistence claim on failure.
Source access and preview remain inside the existing authenticated admin boundary.

## Do's and Don'ts

- Do preserve the internal, temporary-preview notice, source readiness and
  unapproved-weight state in every extension of this workspace.
- Do retain the CEO instrument content and report outline without copying private
  questions or keys into Git, public endpoints, screenshots or documentation.
  The admin-only question DTO explicitly omits keys, credits, rationales and anchors.
- Do keep self-report availability distinct from pending SJT weights and missing
  evidence; do not show a missing score as zero.
- Do keep the existing free PE participant journey separate from RM preparation.
- Don't infer validated scoring, approved weights, public readiness, sale or
  delivery from a successful synthetic preview or build.

Local verification reported by the implementation session: nine targeted app
tests, ten targeted API tests and 29 regression tests passed; builds produced
92 app routes, 125 API routes and 45 website routes. Browser confirmation and
fresh finish-review evidence are recorded separately; these counts do not prove
production source installation, live participant access, delivery or deployment.

Not canonized or repaired: the existing root architecture document and absent
global visual sidecar are preserved. Instrument approval, scoring validation,
sales and public delivery remain product dependencies outside this design record.
The source-version/count mismatch and RM-specific weighting remain unresolved
source/approval questions, not reusable visual or scoring rules.

Current confirmation: nine app tests, ten targeted API tests,29regression tests,
two individual journeys and eight SPIN/RM browser cases passed locally. Fresh
RM review captures include the table-scroll hint and keyboard-accessible region.
Parent and finish reviewer opened both; disposition `ship`. These captures use
synthetic question content, not the CEO bank. DB installation and public delivery
were not tested. No claims of psychometric validation, live deployment or sales.
