# PETA reports and private PDF export

## Implemented - 1 November2026 - app0.51.0 / API0.47.0 / SQL80

The owner chooses **internal admin group reports first**. This supersedes the
MVP-off group plan below; it does not authorize anonymous employer reporting,
company access, automatic sharing, facilitator notes or a new consent policy.
SQL79's shared access for all verified BinaHub admins remains in effect.

### Where to find it

- Participant result → **Unduh PDF individu**.
- Admin → PETA → choose program → **Lihat hasil peserta** → **Unduh PDF individu**.
- Admin → PETA → choose exactly one program → **Laporan grup** →
  **Siapkan laporan grup** → inspect coverage → **Unduh PDF grup**.
- Finished/disabled programs and old standalone pilot spaces remain available
  through **Riwayat program**. Different programs are never combined.

Individual PDF contains the same deterministic narrative, two fixed-scale
NET (-24..+24) and paired MOST/LEAST (0..24) vector charts, exact figures,
dimension explanations and three reflection prompts. Identity is server-provided.
No technical version/ID, storage/contact footer, quality flags, keys or raw answers.

Group PDF contains coverage/exclusions, counts of highest within-person NET
dimensions, tie/all-four-balanced counts, discussion prompts and an alphabetical
named MOST/LEAST/NET matrix. Two/three-way ties count in each related dimension;
all-four-balanced patterns are separate. Totals need not equal included people.
This is not a normative score, team type, ability measurement or ranking.

### Inclusion and export boundaries

SQL80 reads all records in one workspace, independent of dashboard pagination,
search and status filters. Include only submitted results within original
retention, optional review consent true, and a non-null snapshotted reviewer.
Count unfinished, restricted and revoked/expired/unavailable records without
returning their scores/names. Never rewrite declined consent. Zero eligible
results has an empty state and no PDF. >500 eligible results is explicitly
rejected, never silently truncated. History does not extend retention.

This is a named **internal** report, not anonymized. BinaHub review permission
does not imply permission to send it to an employer. External reporting still
requires policy, minimum group size and small-group/filter privacy safeguards.

Every export rechecks scoped participant credentials/live program identity or
the verified admin role and current result permission. SQL functions remain
service-role only. Bodies contain only session/workspace IDs, not caller scores
or actor identity. Schemas strip private fields. Attachments are no-store,
noindex and nosniff; filenames have no names/tokens. Separate20/hour export
budget per credential/admin. Audit events record requests, not proof of browser
file saving. No AI, email, public link or durable server PDF store is used.

Downloaded copies remain on the device and cannot be revoked or erased by the
retention worker; admins must manage confidential copies under their policy.
Original one-year database retention is unchanged.

Apply `binahub-api/supabase/migrations/0080_peta_pdf_reports.sql` after SQL79,
then deploy API0.47.0 before app0.51.0. Owner confirms SQL80 applied on
1 November2026. No new environment variable or scheduler is required.
Validation uses synthetic data only, not production participants or CEO keys.

Verification:88 API PETA tests,47 scoped frontend tests and two desktop/mobile
browser cases passed. SQL80 is exercised twice for idempotency in local PGlite;
tests cover shared admins, declined consent, revocation/expiry, history, coverage
beyond20 rows, >500 rejection, fresh program identity, malformed stored reports
and no private fields. The 37-member PDF layout test checks repeated headers,
participant presence and row bounds; every numbered footer has actual text lines.
Two synthetic PDFs and four web captures were opened for visual review. Scoped
lint/type checks and production builds are release checks, not an independent
pentest, live deployment proof or psychometric validation. API lint retains one
pre-existing unused `ProposalPDF` warning in `pdf-service.tsx`; no error.

## Historical plan - superseded by the implemented increment above

Updated31 October2026 (app0.50.1 / API0.46.3 / SQL78). User asks how admin/facilitators can review participants and
produce individual/group reports like T-BOS. This file is a plan, not an activated
permission change, group analysis, report builder or PDF export.

## Available now

- Open Admin → PETA (`/admin/peta`), choose a PETA-enabled active program and inspect
  participant progress. Finished/disabled programs remain in **Riwayat program**.
  The list is owner-scoped, with server-side search/filter/counts and20-row pages;
  old participants are no longer hidden by a global latest100 cut-off.
- A completed participant result offers **Lihat hasil peserta** only when that
  participant granted separate review permission and the current account is the
  snapshotted reviewing consultant. Creating/selecting a program does not itself
  grant private-result access. Changing setup does not retroactively rewrite it.
- The same two-chart/exact-count/reflection report is rendered for participant
  and authorized admin review. The storage/contact sentence is no longer shown
  in that report; retention and pre-start disclosure remain unchanged.
- PETA staff endpoints currently require admin authentication. No dedicated PETA
  facilitator dashboard, group report, report editor or PDF generation is shipped.
  The existing general facilitator report screen is not a PETA integration.

Evidence: app peta-admin.tsx / peta-report.tsx; API peta/http.ts admin guard;
SQL76 peta_admin_dashboard/peta_admin_action, SQL77 program-bound wrappers and
SQL78 peta_management_dashboard. Ending a program closes participant access,
not the assigned admin's permitted historical result within original retention.
API is source-inspected, not covered by the app graph. No production data inspected.

## Proposed route through the program

Program → PETA → Overview / Participants / Group summary / Reports.
Reuse the existing program, participant identity and facilitator assignments.
Do not create a second program or open every program's results to every staff user.

1. Overview: real invited/started/completed counts and reviewable-result counts,
   with server pagination/filtering rather than silently counting only the latest100.
   Register the intended participant denominator; missing response is not a score.
2. Participants: search by name, filter team/status, open the authorized exact
   MOST/LEAST/NET report; preserve ties and private mapping keys.
3. Individual report: immutable source-result snapshot plus separately authored
   facilitator notes and discussion/action steps; preview and versioned PDF export.
   Notes never change original choices or pretend to be new validated score bands.
4. Group summary: descriptive patterns only from eligible, separately authorized
   records. No ability ranking or claim that PETA measures team competence; do not
   force a single type or use an average NET as a team ability score.
5. Reports: select program and permitted scope (participant/group), preview,
   record author/source versions and authorized recipient, then export. Sending
   externally requires an explicit action, not an automatic share with the company.

## Decisions needed before activation

- Assigned facilitators may view only the programs/records covered by their
  assignment and participant permission; define whether notes/export are allowed.
- Existing consent snapshots name the current reviewing consultant, not all
  facilitators. Do not silently expand old permissions. Any new reviewer policy
  requires an explicit participant permission/update workflow.
- The CEO pack product/release-decisions.md marks group reporting off for MVP,
  subject to justified anonymization and a minimum group size, and PDF as Phase2.
  Confirm group audience, aggregation method, minimum size and permission before
  releasing group output. Small groups must not leak identifiable individual rows
  through the supposedly anonymous summary or filters.
- A named participant matrix is a private staff view, not an anonymous group
  report. Protect downloads/audit logs and reflect access revocation/retention.

Recommended implementation order: assigned reviewer access → program overview +
participant list → individual PDF/notes → governed group summary/PDF. Keep all
unapproved group features off; do not repurpose T-BOS competency scores for PETA.
