# Paid individual Self Diagnostic — release gate

User approved 28 October 2026: program recommendation, team/org diagnosis,
individual Self Diagnostic, catalog and inquiry remain distinct entry paths.
Free results focus on immediate practice. Longitudinal reflection is reserved
for a future paid capability, not promised by the 48-hour free result.

## Status

Payments remain locked Coming soon. This document is a release specification,
not evidence that paid delivery, recovery, retakes or comparisons are implemented.

Already present: deterministic method scoring, temporary 50:50 display score,
server-side behavior wording, routed providers including configured OpenRouter,
timeouts, schema/anchor-copy validation, snapshot queue and email recovery worker.

Current free behavior wording can fall back to generic public suggestions and
freeze a usable report. That is not an acceptable silent substitute for a paid
personalized report. A successful free report is not proof of paid readiness.

## Required before checkout can activate

- Persist verified payment separately from report generation. Deduplicate webhook,
  order, entitlement, generation and email actions. A retry must never charge again.
- Store paid generation status durably: queued, processing, retry_wait,
  needs_review, ready. Preserve evidence of each attempt without logging private
  prompts or generated prose. Expose an actionable status to admin/customer.
- Retry transient errors with bounded backoff; route to other configured and
  approved providers. Respect auth/billing failures rather than looping forever.
- A paid strict mode must require valid behavior guidance for every entitled,
  evidence-supported competency. Reject empty, partial, copied or invented output.
  It must not accept the free generic fallback as successful paid completion.
- Reconcile numeric scores independently of AI. AI may phrase behavior guidance,
  not change credits, scores, competencies, products, prices or validation claims.
- If providers stay unavailable, retain the job as pending/needs_review; alert
  admin, enable safe manual completion and tell the customer what happens next.
  Do not email a generic report marked premium complete. Do not require resubmission.
- Start paid result availability when the report is ready, not while generation
  is blocked. Preserve the free 48-hour policy separately.
- Define the promised completion window, manual ownership, refund handling and
  incident communication before making a paid commercial promise.
- Simulate provider outage, auth/billing errors, rate limit, malformed/partial
  output, worker crash/redeploy, duplicate webhook and duplicate email retry.
  Test one verified sandbox order end-to-end before production checkout.

## Future paid development journey

Proposed capabilities only: saved report access, practical development plan,
participant notes, optional reminders and a subsequent Self Diagnostic.
CEO must define retake interval/entitlement and interpretation of repeat scores.
Do not call a score increase proven competency improvement or empirical validation.
Retention, access period and reminder consent are not decided by this document.

## Current scope completed separately

Public recommendation landing/hero and all five entry paths; immediate practice
in free report; no payment activation, new cron, provider spend, live email,
production database migration or instrumentation of participants in these checks.
