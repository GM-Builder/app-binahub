# Individual assessment UX — 0.36.1

## Scope and design contract

Public diagnosis uses `PEGuestAssessment`; email results use `PEEmailResult`.
The shared `PEResult` also improves the report shown to authorized admins and
legacy account holders. The legacy authenticated question-entry workflow is
not replaced by this change.

Mode: Read for the report, Operate for question entry and privacy controls.
Preserve the incumbent navy `#0B2C6B`, Plus Jakarta Sans, cool neutral ground,
white surfaces and restrained borders. This is a local surface redesign, not
a new brand system. The repository's existing `DESIGN.md` describes system
architecture; it is preserved rather than overwritten as a UI style guide.

Reading order: personal context/completeness → practical development steps →
separate method scores and expandable interpretation → methodology/limits/help →
one collapsed privacy entry. Desktop starts showing practical steps in the
first viewport; mobile reflows the document without shrinking typography.
Use native links, details, form controls and visible keyboard focus. Avoid
ornamental charts, mastery percentages, combined competency scores and nested
card stacks. Empty priorities and insufficient evidence remain explicit.

## What the CEO package requires

Reviewed local source package: `BinaInsights_Online_Assessment_Developer_Pack_v1`.
Private source files, question banks and scoring keys must not be committed.

- Developer Handoff Spec sections 3 and 8: safe autosave/resume, progress,
  duplicate-submit prevention, server-side scoring, mobile/keyboard access.
- Section 6: executive summary, separate evidence methods, contextual actions
  and limitations. Presentational order follows the user's explicit approval
  to put summary and practical steps before score details.
- Sections 8 and 9: purpose/access control, privacy notice, retention/deletion
  mechanism, authorized report recipients and recorded consent versions.
- Section 10: evaluate report usefulness and pilot quality. It does not mandate
  a participant button named “Simpan umpan balik”, these exact ratings, or the
  previous three-button layout.
- JSON `report_rules.privacy`, workbook README A15/B15 and Report_Rules A8:C8
  reinforce access, purpose, retention/deletion and contact/process requirements.

Thus the safeguards are retained, but their names, layout, and consolidation
are implementation choices. This is an implementation audit, not a claim of
completed empirical validation or legal certification.

## What uses AI

No LLM call is made to select an answer, score this individual instrument, or
construct its current report narrative. The API scores responses using the CEO
rules and builds a stored report from structured rules/templates and context.
Changing an AI provider does not change these scores. Do not add AI-generated
keys, questions, scores or recommendations as part of a UI optimization.

## Answer persistence invariants

`PEGuestSyncQueue` separates immediate interaction from network persistence:

1. Update in-memory answers immediately; Next never waits for autosave.
2. Serialize existing encrypted IndexedDB writes. No plaintext fallback.
3. Debounce normal sync by 350 ms and allow only one in-flight writer.
4. PATCH the known revision directly. GET only for restore or conflict recovery;
   a missing server draft can be recreated using the existing idempotent start.
5. Merge disjoint changes, but do not silently replace conflicting tab answers.
6. An older server acknowledgement cannot replace newer local selections.
7. Retry through the online event, a subsequent answer, or the visible retry
   control. This is not an unconditional timer-based retry loop.
8. Final submit waits for pending local/background work, freezes answer edits,
   retains its submission key on uncertain failure and confirms receipt only
   after the server responds. Do not claim email delivery before the backend
   delivers it. Clear the encrypted local draft after successful submission.
9. If local storage fails, warn that closing the page can lose pending answers;
   warn before unload while a local write is pending or unsaved changes have no
   usable local store. Seven-day expiry and existing secure API access remain.

## One entry, distinct privacy actions

“Privasi & data” contains:

- Consultant review permission: off stops team review; it does not delete the
  participant's report or implicitly withdraw/grant evaluation consent.
- Optional evaluation/export permission and paired optional clarity/usefulness
  ratings. Share-only changes do not upgrade legacy statistics consent to the
  newer export permission. Legacy statistics-only consent is shown checked with
  its narrower scope and can be withdrawn using the same Save action; the
  broader export option is only offered after that withdrawal is saved.
  Changes take effect after “Simpan pilihan”.
- Delete answers/results: a separate explicit confirmation, not a side effect
  of Save. Explain active-system deletion and that previously downloaded or
  exported copies are not automatically recalled.

Permissions and deletion use existing authenticated/guest API endpoints.
No access-control or retention policy is weakened by collapsing the controls.

## Verification and deployment

- Vitest: 56 files / 292 tests passed, including delayed saves, fast revisions,
  offline/lost acknowledgement, conflicts, idempotent final submit, disposal,
  separate permissions, errors and delete confirmation.
- Production webpack build passed. TypeScript and targeted ESLint passed.
- Browser: synthetic local component preview at 1440×1000 and 390×844; separate
  scores remain readable, page width stays within viewport, native disclosures
  work. With a deliberately slow mock PATCH, Next opened question two while
  the saving status was still visible. This is not production delivery testing.
- UI detector on changed report/privacy/guest/result components: no findings.
- Preview files/screenshots remain ignored in `.codex_tmp`; no real email,
  assessment data, paid model calls or production SQL were used.
- Deploy app 0.36.1 normally. No new SQL, environment variable or API version
  is required for this patch; existing individual-feature prerequisites remain.
