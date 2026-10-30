# PETA reporting: current access and proposed extension

30 October 2026. User asks how admin/facilitators can review participants and
produce individual/group reports like T-BOS. This file is a plan, not an activated
permission change, group analysis, report builder or PDF export.

## Available now

- Open Admin → PETA (`/admin/peta`), choose the configured program and inspect
  participant progress. The list is owner-scoped and bounded to100recent sessions.
- A completed participant result offers **Buka hasil berizin** only when that
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
SQL76 peta_admin_dashboard/peta_admin_action and SQL77 program-bound wrappers.
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
