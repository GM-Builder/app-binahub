# Public diagnosis — scoped design record

Observed on 25 October 2026 for `/diagnose` and `/discovery`, including all five
discovery stages. This records the user-confirmed reference extension; it is not a
repository-wide visual canon. Root `DESIGN.md` remains the incumbent architecture
record. Behavioral boundaries and verification evidence are in
[`diagnosis-reference-redesign.md`](diagnosis-reference-redesign.md).

Sources: `diagnosis-choice.tsx`, `diagnosis-shell.tsx`, `diagnosis.module.css`,
`spin-discovery.tsx`, inherited typography in `src/app/globals.css`, the three
supplied references, and the eight desktop/mobile review captures.

## Overview

The public journey uses a calm, guided service layout: a compact logo header,
balanced diagnosis choices, and a consistent welcome/form shell. It retains the
existing BinaHub navy/gold identity and Plus Jakarta Sans. The reference extension
adds pale blue curved ground, white task surfaces, connected stages and a tinted
guidance panel. These compositions apply only to the routes above.

## Colors

Existing primary navy (`#0b2c6b`) anchors headings, controls and focus context.
Route-local supporting values are muted blue (`#516783`), pale border
(`#e2eaf5`), white surfaces, and a cool ground (`#f8faff`). Primary buttons use a
navy gradient (`#103c91` to `#092c6d`). Gold is a small identity accent: the
individual icon uses gold (`#b77811`) on cream (`#fff5df`). Guidance and selected
answers use pale blue rather than a competing accent. These observed values do
not redefine global tokens.

## Typography

The inherited family is Plus Jakarta Sans with the existing sans-serif fallbacks.
Headings use weights of 600–700 and tight tracking; body copy remains open and
readable. The main title sizes are:

| Surface | Desktop | At 719 px and below |
| --- | --- | --- |
| Diagnosis choice | 34 px | 28 px |
| Discovery welcome | 38 px | 28 px |
| Active discovery form | 30 px | 26 px |

Body and supporting copy range from 12–15 px; field labels are 14 px. Inputs
increase from 14 px to 16 px on small screens. The small uppercase page label is
10 px with `.12em` tracking. This is an observed role scale, not a new global type
scale.

## Layout

The white header is at least 64 px high. Choice content is capped at 944 px and
discovery content at 1024 px, with 28 px horizontal padding on desktop and 20 px
at 719 px and below. Choice cards use two equal columns with an 18 px gap, then
stack at that breakpoint. Desktop forms use a 222 px guidance column, a fluid
field column and a 30 px gap.

At 767 px and below, guidance moves above the fields and loses sticky positioning.
At 719 px and below, the repeated form introduction and secondary sidebar privacy
reminder are hidden; the welcome privacy notice and final consent remain visible.
Contact fields become one column. The five informational stages remain visible,
with circles reducing from 34 px to 28 px. Field groups keep a 23 px vertical gap.

## Elevation & Depth

Choice cards rely on borders. Welcome, form and status surfaces use a restrained
ambient shadow (`0 12px 46px #254d8510`); tinted guidance creates the internal
hierarchy. The primary button adds a small hover shadow. The curved ground is
decorative CSS, excluded from the accessibility tree and pointer interaction.

## Shapes

Choice cards have 20 px corners; discovery surfaces have 24 px corners, reducing
to 20 px on small screens. Inputs and answer rows use 11 px corners; primary
buttons use 12 px. Icon tiles and circular step markers repeat the reference's
soft geometry without introducing a new asset family.

## Components

The shared header reuses `public/full-logo.png` at 126 px wide, reducing to 114 px
on small screens; it is served directly without image optimization. No new raster
asset or reference-image background is shipped. Choice cards distinguish team and
individual entry, while separate rows distinguish results, device-local drafts
and legacy account history.

Native form controls retain labelled fields and associated helper/error text.
The final arithmetic input takes its accessible name from the visible label,
including the challenge. Primary actions are at least 48 px high and fields at
least 46 px. Keyboard focus is a visible 2 px outline with a 4 px offset. Brief
160 ms state transitions are disabled by the reduced-motion preference. Progress
shows current/completed stages and cannot skip validation.

## Do's and Don'ts

- Do preserve CEO questions, branching, consent, attribution and availability
  behavior when extending these route components.
- Do reuse the shared shell and measured responsive behavior for this journey.
- Don't treat the reference's combined history/draft wording or privacy claims as
  authority over the product's actual access and data-handling behavior.
- Don't apply this route record to admin, reports or global design configuration
  without a separately authorized change.
