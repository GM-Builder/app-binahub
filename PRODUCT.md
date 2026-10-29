# BinaHub App

<!-- impeccable:product-schema 1 -->

## Platform

web

## Scope of this record

Confirmed product context from the user's instructions and the existing app,
recorded on 16 October 2026. This is not a replacement for CEO-authored
instruments, commercial terms, or the wider architecture documents.

## Users

- Admins manage acquisition, sales, assessments, proposals, and program operations.
- Individual participants complete a personal-development assessment and read
  their private results, often on a phone.
- Consultants review authorized assessment context to recommend development.

## Product Purpose

Connect diagnosis with relevant BinaHub development solutions while keeping
the participant journey and daily admin operations simple.

## Operating Context

- `app-binahub` is the Next.js web app on Hostinger; `binahub-api` is the sibling
  backend on Vercel. Business data is handled by the API, not privileged browser
  access to Supabase. Website and AMS are separate repositories.
- Public individual diagnosis currently uses email-based private result access,
  without an account/password requirement. Legacy account history remains separate.
- The current instrument package contains six PE competencies in total. The
  active free journey delivers PE-02/04/06, with 18 questions.

## Capabilities and Constraints

- CEO owns question text, answer credits, scoring changes, and commercial content.
- Individual scoring/reporting currently uses structured rules, not LLM calls.
  Self-report and situational-judgment scores stay separate; missing evidence
  is not a score of zero. Do not claim empirical validation from content review.
- Submitted reports are snapshots. Do not overwrite them when content changes
  or when a participant purchases another service.
- Relationship Management v4 has an admin-only40question trial and transient
  report preview. The owner confirms the bank's27self-report/13SJTcount and
  authorizes a provisional50:50combined MODULE score (29 October2026). Separate
  method totals remain visible. This does not authorize spreading scenario
  credits across tagged competencies: competency SJT weights and interpretation
  remain pending; public/paid RM delivery remains disabled.
- Consultant review, optional evaluation/export, and deletion are distinct
  purposes even when presented through one privacy entry.
- Paid preparation is internal only (app 0.38.0/API 0.37.0 + SQL 69): draft
  configuration and a transaction reader, not an activated payment journey.
  Gateway/merchant integration, scoped passwordless customer identity, checkout,
  paid delivery and additional reports remain unimplemented. Price, commercial
  report, access period, retakes, refund terms and answer reuse need decisions.

## Brand Commitments

Use professional, readable Indonesian for participant-facing copy. Keep internal
workflow, approval, and configuration language out of public messages. Public
catalog product titles retain the CEO's English titles.

## Evidence on Hand

- Current participant/report implementation: `src/components/pe-guest-assessment.tsx`,
  `src/components/pe-email-result.tsx`, and `src/components/pe-report.tsx`.
- Existing UX evidence and verification limits: `docs/individual-assessment-ux.md`.
- Private CEO source and scoring keys must not be copied into Git or public DTOs.

## Product Principles

- A normal customer task should not require an admin approval or environment change.
- Show immediate feedback, preserve work on failure, and distinguish receipt
  from backend completion and actual email delivery.
- Prove identity and scope before exposing personal results or purchases.
- Preserve the free journey when adding commercial features.
- Publish only capabilities and commercial promises that are genuinely ready.
