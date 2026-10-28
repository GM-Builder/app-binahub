# Organization program recommendation entry

## Implemented

The public website hero has two messages on the same background and orbit artwork.
Program recommendations lead to /id/rekomendasi-program/ (or /en/...). The BinaHub
growth message retains diagnosis and perspective CTAs. The hero changes messages,
not background artwork. Labels select a message manually and pause automatic
rotation; play/pause is available. Eight-second rotation starts after the intro.
Hover, keyboard interaction, hidden pages and offscreen state pause/stop rotation;
reduced-motion users use manual selectors. Inactive panels are inert, hidden from
assistive technology and share a grid cell to keep layout stable.

The dedicated landing explains the organization service, report contents and
process, then hands off to app.binahub.id/discovery. The report outline is labeled
illustrative; it is not a real recommendation or promise of a particular product.
Canonical, language alternates, sitemap and social metadata are provided.

Five paths stay distinct: program recommendation, team/org diagnosis, individual
Self Diagnostic, catalog and inquiry. No diagnosis path has been removed.
Internal/app handoffs retain whitelisted campaign and opaque journey parameters;
contact fields and private tokens are not copied by the new handoff helper.

Free individual reports keep immediate practical steps, without the one-month
return prompt. Paid retake/comparison and resilient paid delivery remain future
work, specified in paid-diagnostic-delivery-readiness.md. Checkout is not active.

## Checks and limits

- Website: npm run quality:public; npm run build; node tools/test-program-entry.mjs.
- App: full unit regression, production build and existing individual browser flow.
- Cross-repo browser QA: build website-prod first, then run
  node scripts/test-program-website-ui.mjs from app-binahub. Requires the sibling
  website checkout and app's existing Playwright installation. Uses loopback only,
  synthetic handoffs and blocked API writes; captures go to ignored review output.
- Timer checks use real browser time rather than an emulated clock. No promise
  of live deployment, production email delivery or payment readiness follows.

Verified 2026-10-28: website lint/typecheck/build and handoff tests passed; app
347 unit tests, lint/build and the two existing individual browser scenarios
passed. Cross-repo browser checks passed for autoplay, pause/resume, hover,
keyboard focus/activation, offscreen pause, reduced motion, stable panel height,
desktop/mobile, 320–1600px overflow, ID/EN metadata and synthetic tracked handoff.
Visual finish verdict: ship for the landing, free report and both hero messages.
The listed headline contrast correction is #AD7415 on white (3.97:1 large text);
the illustration uses its incumbent colors. No new shipping raster was generated.

Existing dirty website catalog, package/version and changelog edits are separate
from this release and are not part of the program-entry commit. Root DESIGN.md
is absent in the website repository; this is pre-existing documentation drift.
The new surface extends existing tokens and does not replace the global system.
