---
name: BinaHub individual Self Diagnostic pricing
description: Shipped visual record for the individual package route, preserving the available free journey and five locked paid choices.
colors:
  pricing-ink: "#0b2c6b"
  pricing-text: "#52617a"
  pricing-line: "#dfe4ed"
  pricing-ice: "#e8f0fc"
  pricing-champagne: "#f6e7c5"
  pricing-white: "#fff"
  pricing-muted: "#f1f4f8"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "42px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  plan-title:
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  section-title:
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  category-title:
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  body:
    fontSize: "13px"
    lineHeight: 1.8
  action:
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.6
rounded:
  category: "14px"
  featured: "16px"
  pill: "999px"
spacing:
  detail: "10px"
  category-gap: "18px"
  featured-gap: "24px"
  page-gutter: "28px"
  section: "48px"
components:
  free-action:
    backgroundColor: "{colors.pricing-ink}"
    textColor: "{colors.pricing-white}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "12px 18px"
  paid-unavailable:
    backgroundColor: "{colors.pricing-muted}"
    textColor: "{colors.pricing-text}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
---

# Design System: Individual Self Diagnostic pricing

## Overview

**Creative North Star: "BinaHub navy/gold editorial extension"**

This record applies only to `/insight/individual/packages`. It captures the finished pricing surface in `src/components/individual-packages.tsx` and `src/components/individual-packages.module.css`, using the existing recommendation landing's editorial approach. The route retains BinaHub's logo, Jakarta typography and navy/ice/champagne relationship. The root `DESIGN.md` remains the app's architecture record; this document does not replace it or the app's global design sidecar.

The page introduces the available free start beside the complete package, then presents the four focused categories. Availability is stated before the comparison and repeated through the controls. `design-plans/individual-pricing.md` holds the six-block direction contract; `PRODUCT.md` supplies the durable requirements for readable Indonesian, original catalog titles and preservation of the free journey.

**Key Characteristics:**

- Cool-white canvas, restrained navy display type and fine separators.
- Free and complete plans lead; the four focused prices follow in a compact grid.
- One active free-entry action and five explicitly unavailable paid controls.

## Colors

### Primary

- **BinaHub Navy** (`pricing-ink`): heading, prices, primary action and the complete-plan gradient's first stop.

### Secondary

- **Champagne** (`pricing-champagne`): text-selection surface and complete-plan checkmarks.
- **Ice** (`pricing-ice`): available badge, complete-plan supporting text and its locked control.

### Neutral

- **White** (`pricing-white`): free/category cards and complete-plan inverse type.
- **Slate Blue** (`pricing-text`): supporting copy, footer and unavailable category controls.
- **Quiet Line** (`pricing-line`): card outlines and horizontal separators.
- **Muted Surface** (`pricing-muted`): unavailable focused-plan controls.

The page background is `linear-gradient(180deg, #f5f8ff 0, #fff 440px)`. The complete plan uses `linear-gradient(115deg, #0b2c6b 0, #1b4b8e 68%, #2f5eab 100%)`. These route treatments do not establish a new global palette.

## Typography

**Display and Body Font:** the existing app stack headed by Plus Jakarta Sans. No font asset or secondary family was added.

The heading uses the frontmatter's display role, balanced wrapping and a maximum width of 17ch; tablet reduces it to 36px and mobile to 32px/19ch. Introductory copy is 14px with 1.8 line-height and a 50ch limit, becoming 13px on mobile. Availability copy is 12px.

Featured plan titles use `plan-title` and become 20px on mobile. Featured prices use 42px, weight 500, line-height 1.15 and tabular numerals, becoming 38px on mobile; the free price separates a 24px `Rp` prefix. Focused prices use 27px with line-height 1.3 and tabular numerals. The category section heading becomes 23px on mobile. Supporting plan text uses `body`; labels, scope captions and footer text are 11–12px. Category names retain the owner's English wording.

## Layout

The inherited diagnosis shell supplies the existing logo header and diagnosis-return link. Route content is capped at 1144px with desktop padding of 56px 28px 28px. The intro is a 1.05:1 two-column grid with a 72px gap. Two equal-width featured panels begin 36px below it with a 24px gap and 30px 32px internal padding.

The category section begins after 48px. Its heading and copy share a baseline row, followed after 24px by four equal columns with 18px gaps. Category cards use 24px 22px padding. The footer follows after 40px, separated by a rule, and wraps its two text groups as needed.

At 768–1023px, the intro gap becomes 40px, featured padding becomes 28px, and categories use two columns. Through 767px, intro, featured plans and categories become one-column sequences in source order. Route padding becomes 36px 20px 20px; featured padding is 26px 24px, category padding is 24px, and section gaps reduce. There is no horizontal carousel or hidden plan content.

Local finish evidence is in `.impeccable/review/individual-pricing-desktop.png`, `individual-pricing-mobile.png`, `individual-pricing-desktop-viewport.png` and `individual-pricing-mobile-viewport.png`. Validation reported for the shipped surface: the two package unit tests and full 70-file/348-test suite, lint, the 91-route production build, desktop/mobile browser coverage from 320–1600px without API writes, and two full synthetic individual-flow tests. These are local checks, not deployment or paid-delivery evidence.

## Elevation & Depth

Pricing cards have no route-level shadow. White/cool-white layers, the complete-plan gradient, one-pixel outlines and separators provide depth. The inherited diagnosis shell remains outside this route's visual changes. No new raster or image-generation provenance is required for this code-led surface.

## Shapes

Featured panels use the `featured` radius; focused cards use `category`. Actions, unavailable controls and the availability badge use pill corners. Card outlines are one pixel; scope and footer divisions use fine horizontal rules. The layout keeps plan contents aligned through flex columns and pushes the featured controls toward the bottom of their panels.

## Components

### Free plan and action

The white free panel is labeled “Self Diagnostic gratis”, carries the “Tersedia” badge and shows `Rp 0`. Its listed areas are Self-Development, Adaptability and Pressure Management. The full-width “Mulai Self Diagnostic gratis” link is followed by “Tanpa membuat akun.” The route passes its existing filtered attribution through `personalEntryPath` to `/insight/individual`; the component default points to the same path.

The primary action uses the frontmatter treatment, a 12px icon gap and a 46px minimum height. Hover is `#10234b`; active is `#071b3d`. Only its background color transitions, for 160ms with `ease-out`.

### Paid plans and availability

The complete plan occupies the navy featured panel and lists the four category names as its scope. The focused choices follow in the grid. Prices use Indonesian IDR formatting without fractional digits; no period, discount, popularity claim or launch date is implied.

| Plan | Displayed price | Control |
| --- | --- | --- |
| Personal Effectiveness | Rp 59.000 | Coming soon |
| Relationship Management | Rp 89.000 | Coming soon |
| Leadership Effectiveness | Rp 69.000 | Coming soon |
| Work & Business Results | Rp 119.000 | Coming soon |
| Paket lengkap | Rp 299.000 | Coming soon |

All five controls are native disabled `button` elements with `type="button"`, a decorative lock SVG and a plan-specific accessible name prefixed by “Coming soon:”. Each references the visible availability sentence through `aria-describedby`. The controls have a 44px minimum height and a not-allowed cursor. The complete-plan version uses ice/navy; focused versions use muted/slate. There is no enabled purchase or checkout control on this surface.

**The Availability First Rule.** Preserve the visible sentence “Paket gratis tersedia sekarang. Paket berbayar belum dapat dibeli.” before the plans, the active free link and all five disabled paid controls together.

### Semantics, focus and footer

The inherited shell provides the main landmark. The route has one h1, labeled featured sections, a labeled paid section and semantic lists for scope and categories. Decorative check/lock/arrow SVGs are hidden from assistive technology. Route links and buttons use a 3px `#2f5eab` focus-visible outline with 5px offset; native disabled controls do not enter the tab order. `prefers-reduced-motion: reduce` removes the action transition.

The footer retains the non-clinical clarification and a visible underlined “Hubungi tim BinaHub” mail link to `admin@binahub.id` with a 44px minimum target height.

## Do's and Don'ts

### Do:

- **Do** preserve the exact owner plan names and prices and the free route's attribution behavior.
- **Do** keep the availability sentence, free “Tersedia” badge, no-account note and disabled paid controls visible.
- **Do** preserve source reading order, heading/list semantics, focus treatment and reduced-motion behavior.

### Don't:

- **Don't** introduce discounts, paid entitlement counts, report promises, payment periods or launch dates from this visual record.
- **Don't** activate checkout, change instruments, scoring, consent, results or the inherited shared shell as part of a pricing visual extension.
- **Don't** promote this route's composition into a whole-app design migration.

Not canonized or repaired: the architectural root `DESIGN.md`, global/shared-shell styling and pre-existing typography-detector advisory are outside this route record. No broader type rule or new visual-world decision is inferred from them.
