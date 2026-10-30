# PETA — implementation and activation

Updated 29 October 2026. PETA is a separate invitation-only behavioral-preference
pilot, **not** a PE/RM competency package, clinical diagnosis, HR selection tool,
or psychometrically validated product. Nothing in this release activates payment.

## Access and daily use

1. Admin opens **Program & Produk → PETA** (`/admin/peta`). The current release
   limits each admin to the workspaces they create; it is not a global client list.
2. Create a workspace with a written privacy-notice reference. Confirm content
   usage rights, pilot status and the owner-approved one-year retention policy.
   Optionally assign the current admin account as its reviewing consultant.
3. Create an invitation using a random participant code, not a name, employee
   number, email address or phone number. Copy the link once and send privately
   using an agreed channel. Automatic email delivery is not part of this release.
4. The participant sees the notice, gives required processing consent and may
   separately allow the assigned consultant to read their report. Neither box is
   preselected. Declining consultant access does not prevent participation.
5. Practise once, complete all 24 situations, review and submit. Each situation
   needs two different choices. Autosave reports actual completion or failure;
   navigation waits for acknowledgement, and failed saves preserve local choices.
6. The participant reads their own report. A consultant can read it only with
   the participant's separate permission. There is no automatic company access,
   team ranking, group report, AI call or catalog recommendation.

The public `/peta` page explains the product but cannot start an uninvited session.
A separate informational link is present on the individual package page; PETA
is not sold as part of the existing paid packages. No password/account is needed.

## Storage, access and recovery

- Answers and results expire **one calendar year from initial consent/session
  creation**, following the owner's explicit instruction. Recovery never resets it.
- Initial invitation: one use, valid seven days. Successful start exchanges it for
  HttpOnly, Secure-in-production, SameSite=Strict cookies. Tokens are hashed in DB.
- Session: eight hours maximum, with a 30-minute inactivity timeout. A submitted
  result can be revisited while that session remains valid.
- A workspace owner can issue a fresh 30-minute recovery invitation **after
  verifying the participant through the previously agreed private channel**.
  Merely knowing a participant code is not identity verification. Recovery
  invalidates previous session credentials; it does not alter final answers.
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
with the CEO's exact order/text. Public DTOs contain only statement content and
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

1. Apply **SQL 76** (`0076_peta_invitation_pilot.sql`).
2. Apply the locally prepared, ignored **SQL 76B** encrypted source file.
3. Set the matching `PETA_ENCRYPTION_KEY` privately on API hosting. Do not paste it
   in chat, frontend variables, GitHub, logs or browser source.
4. Deploy API and app; verify the admin source gate and same-origin cookie flow.
5. API0.45.1 provides a daily Vercel Cron at19UTC/02WIB for PETA only. Set the
   API Production `CRON_SECRET` (at least32characters), deploy, confirm Cron Jobs
   are enabled and verify an actual invocation/log. No new SQL is needed for
   this scheduler after SQL76. See the API guide for retry/backlog monitoring.
6. Approve privacy/content
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
