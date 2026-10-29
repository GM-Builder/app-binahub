# Diagnosis editorial refresh

29 October 2026, app 0.47.0. Mode: Operate on choice/onboarding; Persuade on
individual package comparison. User explicitly pins the existing recommendation
landing as visual authority. This is an ordinary extension of the existing
system; root architecture and global design tokens remain unchanged.

## Implemented composition

The editorial DiagnosisShell variant applies only to choice, individual packages
and the public PE guest journey. SPIN keeps its current shell. White/ice and a
champagne radial wash replace the old curved waves only on those opted-in routes.
Jakarta/navy stay inherited. Choice uses a heading/lead opposite the existing
needs sculpture, a recommendation CTA and two restrained choice surfaces.
Mobile uses a 76 px side artwork accent and keeps the primary actions full-width.

Individual packages reuse the competency sculpture and its original provenance.
The returning participant block lives within the individual package page, with
separate links for result, device draft and legacy account history. Choice
contains only a contextual link inside the individual article. Do not place
individual account/recovery tools among the organization choices again.

Display sizes: choice 32–44 px fluid / 28 px mobile; pricing 42 px / 32 px;
onboarding 40 px / 30 px. Navy pill actions retain 44–48 px minimum targets.
Choice and package radii are 16 px;
onboarding keeps the native form and static sidebar. Mobile categories use two
columns rather than four vertically repeated full-width cards. Package prices,
free destination, query attribution, readiness/retry and all paid locks remain.

The two WebP sculptures are copied without editing from the existing website
assets into `public/diagnosis`, each with its exact original provenance sidecar.
No new image generation, font, factual claim or client record is introduced.

The companion website refinement, version 0.2.43, enlarges mobile hero cards to
`min(76vw, 310px)`. The fourth state displays only the existing transparent 3D
logo, without a card face, label, rim, shadow, blur or rear stack. The first three
states retain their colored glass cards. This is homepage-scoped; tablet/desktop
composition, carousel behavior, destinations and the liquid field remain.

## RM and PE boundaries

Admin RM trial uses the question-only server DTO: 27 SR + 13 SJT in source order.
All 40 responses are required for final internal preview, checked again server-side.
Back/edit preserve current-page answers; a request error keeps the review open.
Report focus moves to its heading. No participant storage, checkout or email.

Owner approves a provisional RM module composite of 50:50. Overall SR requires
all 27 responses; overall SJT requires all 13 and uses private server option
credits. Either missing
method makes composite unavailable; a true zero remains zero. These totals do
not infer competency-level SJT weights from source tags. The report explicitly
distinguishes module totals from the nine competency rows. No proficiency bands
or final priority claims are invented. Private source snapshot is unchanged.

The shared PE report already supports combined 50:50 bars and separate method
details. Its label now makes the weights explicit. Paid PE sources/scoring are
prepared internally, but a public paid attempt/report/payment flow is not active.

## Final local QA and review

The main agent confirmed the following results for the current revision:

- App unit tests: 21 passed across six suites. The initial sandbox temporary-file
  rename failure was environmental; the successful rerun reported no code failure.
- Public diagnosis browser checks: six passed. RM/SPIN browser checks: ten passed.
  The full website browser regression also passed.
- Production builds passed: app 92 routes, API 125 routes and website 45 routes.
  Website `quality:public`, including public ESLint and TypeScript, passed.
  Changed-file app/API ESLint passed.
- API verification includes the earlier selected 37-test run and the current
  five RM tests. Unit and browser checks use synthetic data; source-validation
  tests additionally verify the private RM import without exposing its contents.

The main agent and fresh finish reviewer opened all 12 required captures under
`.impeccable/review/`: choice desktop/mobile, packages desktop/mobile, individual
onboarding desktop/mobile, mobile hero states 0 and 3, RM self-report desktop,
RM SJT mobile, and RM module report desktop/mobile. The current source and scoped
contracts were compared with this evidence. No separate quality-bar card or
generated page comp was supplied: this is the user-pinned, code-led extension.
All five required finish sections were checked. Final disposition: `ship`, with
no material fixes.

The single app detector run returned no findings. The website run returned 12
inherited palette/type advisories and no primary finding. These observations do
not authorize global token changes or drift repair. Both root `DESIGN.md` records
and existing `.impeccable/design.json` files are preserved; this route-scoped
record does not turn homepage materials or decorative type into global rules.

These results establish local behavior and scoped finish. They do not establish
live deployment, production database access, actual email delivery, an end-to-end
paid journey, payment processing, Safari behavior or physical-device performance.
Public/paid RM delivery and participant data storage remain disabled. Paid PE is
not available end to end.
