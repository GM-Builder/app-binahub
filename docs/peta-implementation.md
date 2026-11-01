# PETA — implementation and activation

Updated 31 October 2026 (app0.50.3 / API0.46.4 prepared; SQL79 required before API deployment). PETA is an invitation-only behavioral-preference
pilot, **not** a PE/RM competency package, clinical diagnosis, HR selection tool,
or psychometrically validated product. Nothing in this release activates payment.

## Access and daily use

Pre-start copy update, 1 November 2026 (app0.50.4): the full PETA introduction,
24-situation/four-statement format, complete five-step guide and initial unscored
practice explanation are shown together. The explicit column1 most/column2 least
instructions are additions within the guide, not replacements for it. Duplicated
purpose copy is merged; the CEO disclaimer appears once. Privacy disclosure,
optional review consent and required processing consent are unchanged. No API,
SQL or environment update is needed for this frontend-only increment.

1. Admin creates/selects an existing program and enables its **PETA** module in
   the program settings. Other module selections remain unchanged.
2. Open **Program & Produk → PETA** (`/admin/peta`, optionally with `program_id`).
   Select the program and record the internal privacy reference, content rights
   and pilot acceptance. Optionally enable review by the BinaHub admin team.
   All verified admins manage the same PETA workspaces and progress; the creator
   is provenance, not the access boundary. Report access still requires consent.
3. Share the existing program QR/link/code using the reused `ProgramShareCard`:
   copy, native share and QR PNG download are the same as other program modules.
   Participants register with their name or return using their personal
   participant code, then open PETA from `/client/program`. A shared program code
   never grants another person's session or report. No new email automation.
4. The participant reads plain instructions and the result disclaimer. A visible
   disclosure opens data use, identity linkage, private result access and one-year
   storage. Internal reference/version IDs are not rendered. The participant
   gives required processing consent and may
   separately allow the BinaHub admin team to read their report. Neither box is
   preselected. Declining consultant access does not prevent participation.
5. Practise once, complete all 24 situations, review and submit. Each situation
   needs two different choices. Its context appears inside the question card,
   before the four statements. Review lists each context and the full text of
   both selected statements, never only a completion badge. Next/Back move immediately with a finite200ms
   transition (instant with reduced motion). A serial in-memory queue saves in
   the background, preserves revisions/latest edits and reports actual status.
   Failed saves preserve choices and offer retry or confirmed reload; tab
   conflicts are not silently overwritten. Final submission waits for all saves.
6. The participant reads their own report. An admin can read it only with
   the participant's separate permission. There is no automatic company access,
   team ranking, group report, AI call or catalog recommendation.
   The owner-approved result notice is “Hasil merupakan kecenderungan
   pribadi/tabiat, bukan ukuran kemampuan/kompetensi.” One deterministic paragraph
   describes the relative pattern, including tied/close scores, without a permanent
   type or ability claim. Report headers show the completion date, not technical
   version strings or generated participant IDs. Audit metadata remains stored.

The public `/peta` page explains the product but cannot start an uninvited session.
New participation uses `/client/program/peta` inside the existing program access
flow, without a separate PETA password. PETA is not an individual paid package.
Old standalone pilot links/sessions remain supported; their records are not
automatically linked to a guessed program, and no real program is modified here.

## Storage, access and recovery

- Admin opens **Program aktif** for PETA-enabled programs with active/in-progress
  status whose end date has not passed. **Riwayat program** retains PETA
  workspaces for finished/disabled programs and legacy pilots. A direct link to
  an ended program opens history. Ending a program does not erase its responses.
- Participant history uses server-side search/status filters and 20-row pages,
  not a global latest-100 cut-off. Counts cover all responses in the selected
  program scope, not every registered program member. Audit/invitation lists
  remain limited to the latest100 events; they are not the response history.
- Reading historical results still requires a verified admin, participant
  permission, final submission and unexpired retention. It does not reopen
  participant entry or reset the one-year retention. PETA-configured programs
  cannot be hard-deleted through the program API; archive them instead.
- Explicit program status edits now set manual mode and survive date
  reconciliation. Other automatic programs retain their existing date rules.
  Manual status does not override the participant access end date.

- Answers and results expire **one calendar year from initial consent/session
  creation**, following the owner's explicit instruction. Recovery never resets it.
- Program access requires a verified current participant session, live membership,
  active personal access, enabled/configured PETA and the program's existing
  status/date gates. Every PETA read/save/result also checks this identity; a
  PETA cookie alone is not enough for a program-bound record. Returning through
  personal program access resumes the same session without resetting consent,
  retention, consultant permission or final answers.
- Legacy initial invitation: one use, valid seven days. Successful start exchanges it for
  HttpOnly, Secure-in-production, SameSite=Strict cookies. Tokens are hashed in DB.
- Session: eight hours maximum, with a 30-minute inactivity timeout. A submitted
  result can be revisited while that session remains valid.
- Legacy recovery: a verified admin can issue a fresh 30-minute recovery invitation **after
  verifying the participant through the previously agreed private channel**.
  Merely knowing a participant code is not identity verification. Recovery
  invalidates previous session credentials; it does not alter final answers.
- Program participants use existing personal program-code management instead of
  a second PETA recovery link. Revoked/expired PETA cannot be reopened by signing
  in again. SQL77 uses restrictive relationships: deleting a referenced program,
  participant or access row requires an explicit data-handling decision, not an
  automatic cascade of private PETA records.
- Admin actions support invitation/session revocation and verified data erasure.
  Revocation denies access; erasure removes this PETA session's data. Neither is a
  cleanup of PE, RM, SPIN, TBOS or other operational data.
- Access checks deny expired data even if the cleanup worker is not running.
  Physical deletion requires the API retention worker to be scheduled; backups
  require a separately enforced operator policy. Do not promise instant backup
  deletion from this application code.
- No answers or raw invitation links are written to localStorage. Unsaved changes
  still need a successful server acknowledgement before closing the page.

## Scoring and private source

The immutable source is `PETA-DISC-FC24@1.0.0-pilot`: 24 contexts and 96 statements
with the CEO's order/text. The owner approved one display-only correction on
31 October 2026: situation14 uses “antar tim”, not “antartim”. The API's validated
public DTO applies it without rewriting the sealed source, source hash, option
IDs, choices or scoring. Public DTOs contain only statement content and
the participant's choices; dimension mappings stay server-side and encrypted at
rest in the source table. Source hashes, key fingerprints and version are pinned.

For each D/I/S/C dimension, MOST and LEAST are separate counts (0–24), and NET
is their difference (-24–24). Both count totals are 24 and the NET total is zero.
All tied highest dimensions remain tied. A gap of at most two points is described
as close for presentation, not treated as a validated diagnostic threshold.
There is no PE/RM 50:50 formula, percentile, ability band or forced single type.
Reports use two fixed-axis charts plus the same figures in an accessible table.
Quality indicators are stored privately for later authorized research review;
they are not displayed to participants or used to invalidate answers.

## Deployment prerequisites — not executed by this implementation

See the API repo's `docs/peta-activation.md` for the exact sequence:

For an installation with SQL78 already applied, run only
`binahub-api/supabase/migrations/0079_peta_admin_team_access.sql`, then deploy
API0.46.4 before app0.50.3. It adds backend-only team RPCs and changes no stored
answers, consent flags, results, identities or retention dates. There is no new
environment variable. Existing declined consent remains declined. Do not repeat
the older installation steps below on an already configured instance.

1. Apply **SQL 76** (`0076_peta_invitation_pilot.sql`).
2. Apply the locally prepared, ignored **SQL 76B** encrypted source file.
3. Set the matching `PETA_ENCRYPTION_KEY` privately on API hosting. Do not paste it
   in chat, frontend variables, GitHub, logs or browser source.
4. Apply **SQL77** (`0077_peta_program_module.sql`) before deploying **API0.46.0**,
   then **app0.49.0**. It adds bindings/functions and the module key, but enables
   no program and relinks/deletes no legacy record. SQL76/76B need not be rerun
   if installed. No new environment variable: retain the matching encryption key
   and existing cron secret.
5. Apply **SQL78** (`0078_peta_history_program_status.sql`) before API0.46.3,
   followed by app0.50.1. Owner reported successful execution on31 October2026;
   this is not an independent production schema verification. It adds manual
   status mode and a backend-only paginated dashboard; no operational data,
   result permission, source, retention or existing program status is changed.
   Do not replay SQL76/76B/77 or add new env variables for this patch.
6. Verify the admin source gate and real same-origin cookie/bearer flow. API0.45.2+
   provides an owner-approved monthly Vercel Cron on the first day
   at 00:00 UTC / 07:00 WIB for PETA only. Set the
   API Production `CRON_SECRET` (at least32characters), deploy, confirm Cron Jobs
   are enabled and verify an actual invocation/log. SQL77 is a program integration,
   not a scheduler change. See the API guide for retry/backlog monitoring.
   Access still expires at one year; physical deletion normally waits up to
   31 days for the next successful monthly run. An offline secret generator is
   available in the API repo; its private output must not be uploaded.
7. Approve privacy/content
   rights and complete the pre-live security/UX checklist before real invitations.

SQL 75 is the separate Relationship Management source and does not install PETA.
This task does not run production SQL, create real invitations or send emails.

## Verification and remaining release gates

Local coverage: real SQL in PGlite with synthetic sources; API boundary tests;
private offline comparison with all three CEO golden vectors; component tests;
desktop/mobile browser flow using synthetic data; production builds. Private tests
and source exports stay ignored. Browser mocks are not proof of a deployed API,
live delivery, production role setup, scheduler operation or security certification.

Before live pilot: verify production SQL/RLS/grants, key configuration, cross-host
cookie rewriting, actual admin identity/ownership, recovery verification procedure,
retention and backup policy, content rights, privacy notice and an authorized
production-equivalent security review. Public validated release remains outside
this pilot; group analytics, PDF, company access and automated recommendations
are not silently added.
