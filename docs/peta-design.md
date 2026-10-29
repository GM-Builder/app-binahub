---
name: BinaHub PETA pilot
description: Surface design record for the invitation-only PETA journey and its administration.
colors:
  navy: "#0b2c6b"
  text-secondary: "#405779"
  white: "#ffffff"
  panel: "#ffffffeb"
  ice: "#eef4fc"
  border: "#dce4ef"
  control-border: "#c6d4e7"
  comparison-bar: "#647ca5"
  focus: "#2e66c9"
typography:
  headline:
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontSize: "14px"
    lineHeight: 1.8
  action:
    fontSize: "13px"
    fontWeight: 600
  metadata:
    fontSize: "12px"
rounded:
  field: "10px"
  notice: "12px"
  panel: "16px"
  pill: "999px"
spacing:
  action-gap: "12px"
  section-gap: "24px"
  panel-padding: "28px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
---

# Design System: BinaHub PETA pilot

## Overview

This is a record of the implemented PETA surface, checked on 29 October 2026.
It applies to `/peta`, `/peta/mulai`, `/peta/hasil`, and the content of `/admin/peta`.
It extends the existing BinaHub interface: the participant journey uses
`DiagnosisShell` in its editorial mode, while administration uses `AdminShell`.
There is no new visual identity or global token change.

The interface gives one situation and two choices room to be read. The journey
progresses from the invitation notice and consent through practice, 24 situations,
review, and a report. The report widens to compare the two charts and their shared
table. Operations remain in the existing admin workspace.

Source evidence: `src/app/globals.css`, `src/components/diagnosis.module.css`,
`src/components/diagnosis-shell.tsx`, `src/components/admin-shell.tsx`,
`src/components/peta.module.css`, the three `peta-*.tsx` components, and the PETA
route files. Product and activation boundaries are recorded in `PRODUCT.md` and
`docs/peta-implementation.md`.

Visual evidence: all twelve synthetic captures in `.impeccable/review/`, named
`peta-{welcome,consent,question,review,result,admin}-{desktop,mobile}.png`.
Participant captures show the inherited shell; admin captures show the isolated
preview content, so the actual admin shell is evidenced by its source. These
captures establish layout and presentation, not deployed authorization or
psychometric validity.

The root `DESIGN.md` is an incumbent system-architecture document, not a visual
token record. It is preserved. No project-wide `.impeccable/design.json` is created
by this scoped extension. Existing admin-shell eyebrows and uppercase navigation
labels are inherited drift, not PETA patterns to reproduce or canonize here.

## Colors

The frontmatter records PETA's reused local values; global variables remain owned
by the incumbent stylesheets. Navy carries text, primary actions, selected native
controls, positive NET bars, and MOST bars. The secondary text color carries
explanation, metadata, and placeholders.

White panels sit over the diagnosis shell's existing ice and champagne radial
background. Ice notices group important reading without introducing another
accent. Fine borders separate containers and rows. The comparison-bar color
distinguishes negative NET bars and LEAST bars; nearby labels and the table explain
the meaning, so the report does not depend on color alone.

**The Relative Counts Rule.** Bar color expresses the two count series or the sign
of their difference. It does not imply good, bad, competent, or deficient.

## Typography

The inherited Plus Jakarta Sans family and fallback stack serve every role. There
is no separate display face. Headings use restrained weight and tight tracking;
body text uses a generous line height for Indonesian statements and notices.

The frontmatter headline is the participant desktop heading. At the mobile
breakpoint it reduces to (30px). Introductory text uses (15px) with a measure of
(68ch maximum); panel and report prose use the body role. Chart captions use
(16px, weight 600), dimension titles use (15px, weight 600), and small actions and
consent text use (13px). Metadata and help use the metadata role. Report table
numbers use tabular numerals. Admin text inputs become (16px) on mobile.

## Layout

The participant page is centered within (1144px maximum), with desktop padding
of (48px 28px 56px). The introduction and active task share a (760px maximum)
column. The completed report expands to (1040px maximum), with its heading and
notice held to the task width. The established logo and return link remain in
the compact diagnosis header.

At (767px and below), page padding becomes (28px 20px 40px); panel padding becomes
(22px 18px). Question statements retain their own row, alongside both choice
columns. The choice columns narrow from (104px) to (64px), while the label targets
remain at least (44px by 44px). Primary actions can expand into the available
mobile action row.

Charts and admin setup panels use two columns on desktop with the section gap;
both stack on mobile. Dimension explanations retain two columns. The report table
has a horizontal overflow wrapper and smaller mobile cell padding; all exact
counts remain available in text. The 24-item review remains a complete scrolling
list with one change action per situation.

**The One Situation Rule.** Keep a single active situation in the task column;
use the explicit review step to revisit all 24 situations.

## Elevation & Depth

PETA adds no box shadows. Its depth comes from translucent white panels, fine
borders, and the inherited background. No decorative raster or new illustration
is introduced. The existing BinaHub logo is reused. Button background transitions
last (160ms, ease-out); reduced-motion behavior comes from the global stylesheet.

## Shapes

The radius roles in frontmatter distinguish fields, notices, panels, and pill
actions. Panels and secondary controls have a fine (1px) border. Native radios
and checkboxes retain their familiar silhouettes and use navy for their accent.
Chart bars have only a small corner rounding. A zero count or NET difference has
exactly zero bar width, while its printed value remains visible.

## Components

### Actions and fields

Primary actions use the navy/white pairing; secondary actions use white with a
control border. Both have a (46px minimum) height. Text actions are underlined with
a (4px) underline offset. Disabled actions reduce opacity and use the disabled
cursor. PETA controls have an explicit
focus outline (2px) in the focus color, usually offset by (4px); admin text fields
use a (3px) offset. Admin fields have a (44px minimum) height and visible labels;
placeholders use the same secondary text color at full opacity.

### Consent and situations

Required processing consent and optional consultant permission are separate,
initially unchecked controls. Practice is visibly separate from the counted
questions. Each question uses two native radio groups with full statement text
in accessible labels. Selecting a statement in one group disables that statement
in the other. Completion and save status are expressed in text as well as through
the progress element; save errors provide retry actions without discarding the
local choices.

### Review and report

The review shows all 24 situations, completion state, and an explicit confirmation
before final submission. It reveals no provisional dimension or type. The report
opens with the pilot limitation, preserves ties in prose, and shows fixed axes
of (−24 to +24) for NET and (0 to 24) for MOST/LEAST. Both charts are named SVG
figures and point to the same accessible table. Reflection prompts and the actual
retention date follow the counts.

**The Exact Zero Rule.** A zero stays empty on the axis and readable as a number;
never add a minimum-width bar to make it visible.

### Administration

Setup and invitation forms precede the participant list. The list shows code,
completion, retention, instrument version, consent version/date, and consultant
permission. Report access is offered only when the response grants it. Invitation
history and access/action history use expandable sections. Audit rows contain
event, time, and relevant code, without answers, result values, or tokens. A newly
created private link is a wrapped, selectable block with explicit copy feedback.

## Do's and Don'ts

- Do inherit the existing BinaHub shell and typography when extending this pilot.
- Do keep complete statements beside both radio groups on narrow screens.
- Do preserve visible labels, native semantics, focus outlines, and touch targets.
- Do show chart counts in the shared table, including zeros and signed NET values.
- Do state pilot status, personal result access, optional consultant permission,
  and the one-year retention period in readable participant language.
- Don't promote this task's column layout or chart palette into a global redesign.
- Don't turn relative preferences into ability bands, rankings, percentages, or
  a forced permanent personality label.
- Don't inherit the admin shell's pre-existing eyebrow treatment as a new PETA
  visual rule.
