# Public diagnosis and organization discovery — 25 October 2026

## Scope and visual authority

User-supplied references: **BinaHub Diagnosis Dashboard Interface.png**,
**BinaHub Organization Development Onboarding.png**, and
**BinaHub Organization Development Form.png**. The user confirmed this direction
for `/diagnose`, the `/discovery` welcome screen, and all five discovery stages.
The reference images remain external inputs; they are not shipped backgrounds.

The existing BinaHub navy/gold identity and logo are retained. Implementation uses
a shared header and pale blue curved ground, white task surfaces, balanced choice
cards, separate return-participant links, connected numbered stages, and a tinted
guidance panel beside the form. Mobile collapses the guidance above the fields
and removes the repeated introductory paragraph from active question screens.

The result, local draft and legacy account-history links have distinct labels;
the reference's combined history/draft wording is not copied where it would imply
guest drafts require an account or all reports are recoverable from one route.
Progress indicates position but cannot bypass required fields or confirmation.

## Behavioral boundaries

- CEO question labels, answer options, branching and validation are unchanged.
- No changes to API endpoints, database, instrument, scoring, AI/provider, report
  contents, marketing defaults or delivery workers.
- Processing consent remains unchecked and required. Marketing is independently
  optional. The privacy notice and indefinite SPIN retention wording are preserved.
- Existing debounce and serialized saves remain nonblocking. Confirmation and
  final submission keep their existing locking/idempotency safeguards.
- The existing logo is served directly rather than through an image optimization
  URL; no new logo, image-generation asset or third-party UI library is added.
- CSS is module-scoped, with visible keyboard focus, labelled inputs, associated
  helper/error text, a noninteractive accessible progress list and reduced-motion
  support. The diagnostic selection retains its availability and retry gates.
- The final arithmetic field uses its visible label, including the challenge,
  as its accessible name.

## Verification evidence

`npm run build` succeeds: **90/90 static pages**, **two workers**, TypeScript on.
`npm run test:run -- --maxWorkers=2` passes **335 tests / 66 files**.
The UI detector ran once on the four implementation files and returned `[]`.

Run `node scripts/test-diagnosis-ui.mjs` after building for the production-build
browser suite. Two tests pass: Chromium desktop and mobile. It starts a temporary
loopback-only Next server and closes it when finished. Every API request is mocked;
no real submission, production database change or email delivery occurs.

The suite verifies choice links and attribution, logo loading, keyboard order,
consent, all five stages, visible conditional questions, back-navigation retaining
answers, enabled navigation while a save is delayed, and one final request after a
double click. It asserts no horizontal overflow at **320, 390, 768, 1280, 1440 and
1600 px** and no browser JavaScript errors. It does not verify backend processing,
live mail delivery, Hostinger deployment, every answer combination or every device.

Current rendered captures, intentionally ignored by Git:

- `.impeccable/review/diagnosis-reference-choice-desktop.png`
- `.impeccable/review/diagnosis-reference-onboarding-desktop.png`
- `.impeccable/review/diagnosis-reference-form-desktop.png`
- `.impeccable/review/diagnosis-reference-final-desktop.png`
- The four equivalent `-mobile.png` files.

All eight capture files were opened and checked. Desktop is 1440 × 1000, mobile
390 × 844; each image is full page from the document top. These show choice,
welcome, first context group and final contact screen, not a screenshot of every
conditional group. Other stages are traversed by the browser test and share the
same form components. Loading, paused and retry behavior also remain covered by
component tests.

The separate finish review identified one material accessibility fix: the final
verification field must announce its arithmetic challenge rather than a generic
answer label. This was corrected using its native visible label. After the fix,
the production build, targeted ESLint and both browser tests passed again
(2/2, 18.0 seconds), with all eight captures refreshed and opened. The bounded
re-review marked that fix resolved, no remaining material fixes, disposition
`ship`. This is a route-scoped UI verdict, not a production/backend certification.

## Design records

The current surface direction is in
`.impeccable/surfaces/public-diagnosis-reference.md`. Observed palette, typography,
spacing, component states and responsive breakpoints are recorded in
[`diagnosis-reference-design.md`](diagnosis-reference-design.md), scoped only to
these routes. Existing root `DESIGN.md`
contains architecture rather than a visual token canon; it is preserved. This
scoped reference refresh does not silently replace repository-wide architecture,
admin/report styling or global design configuration. Existing design-tooling
drift is preserved; this task does not regenerate root tokens or
`.impeccable/design.json`.
