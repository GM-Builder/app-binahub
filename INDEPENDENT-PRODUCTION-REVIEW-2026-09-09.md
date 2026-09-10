# Independent Production Review — 9 September 2026

## Executive status

**Local code gate: PASS. Database hardening: APPLIED. Production activation: HOLD.**

Both repositories build and pass their available automated checks. Migration 0044 is applied and verified in production, and the API/dashboard releases have been deployed from GitHub. The hold is not caused by a known failing code test. It remains because authenticated production E2E, provider smoke, secret rotation, a fresh monitoring decision, and an external observability sink still require production access or credentials.

Keep all automation in `dry_run` or `disabled` until the production completion checklist below is closed.

## Verified evidence

### `app-binahub`

- ESLint: passed.
- TypeScript: passed.
- Vitest: 21 files, 89 tests passed.
- Production build: passed, 81 routes.
- Playwright development gate: 38 passed on desktop/mobile Chromium; 4 authenticated-admin cases skipped because `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` were not present.
- Playwright production-artifact gate (`next start`): 38 anonymous/security checks passed on desktop/mobile Chromium.
- Playwright deployed-production gate: 40 anonymous/security, navigation, accessibility, and stylesheet checks passed on desktop/mobile Chromium; 4 credentialed-admin checks were skipped because credentials were intentionally not stored.
- `npm audit`: 0 known vulnerabilities.
- Next.js and `eslint-config-next`: 16.3.4.
- Server-side admin boundary now uses the Next.js 16 `proxy.ts` convention and fails closed before rendering the workspace.
- T-BOS requests use one explicit authenticated `apiFetch` client with request IDs and correct `FormData` handling.
- Image optimization is active and `sharp` is installed.
- Duplicate Vercel/Next security-header configuration was removed.
- Session-sensitive routes now emit `private, no-store` cache policy so a CDN cannot retain stale HTML that references deleted deployment chunks or bypasses a newer server guard.

### `binahub-api`

- ESLint: passed.
- TypeScript: passed.
- Vitest: 148 tests passed, 2 skipped.
- Production build: passed, 91 routes.
- `npm audit`: 0 known vulnerabilities.
- Next.js and `eslint-config-next`: 16.3.4.
- Follow-up and transformation workers claim the idempotency key before side effects.
- Pilot outbound is filtered by an exact per-release email allowlist.
- CodeCraft routing is implemented with one primary model, three model fallbacks, and OpenRouter as final provider fallback.
- Reasoning and vision paths are implemented separately.
- Follow-up prompts no longer send recipient email addresses to the AI provider.

### Production database after migration 0044

- Exact pilot audience table: present.
- RLS: enabled.
- Anonymous read/write: blocked.
- Authenticated direct writes: blocked.
- Atomic release-and-audience RPC: present.
- Release and runtime audience triggers: present.
- Transactional trigger test: a release without audience was rejected; the same transition with a temporary audience was accepted; rollback left zero test rows.
- PostgREST schema cache reload: requested.
- Production readiness: no failed `*_ready` checks and no table access-policy failures.
- Runtime controls: 4/4 remain `dry_run`; 0 pilot; 0 live.
- UAT: 12/12 passed.
- Open incidents: 3, none critical.
- Outstanding readiness issue: two old `go` decisions reference healthy, non-mock snapshots older than 24 hours. A fresh snapshot and decision are required before any new activation.

## Independent assessment of the Fable 5 audit

| Audit claim | Independent verdict | Current disposition |
|---|---|---|
| Production secrets were exposed | **Valid** | Local env files are gitignored, but secrets were exposed to external chat/audit context. Rotate them; never copy replacements into chat. |
| Historical RLS was wide open | **Stale for current production** | The supplied production-readiness result reports RLS enabled and anonymous/authenticated writes blocked. Historical migrations remain context, not a current production failure. |
| Admin RBAC was only client-side | **Partly valid; severity overstated** | The API already enforced authoritative role checks, so disabling browser JavaScript did not grant business-data access. A fail-closed server proxy has now been added to prevent protected UI rendering. |
| T-BOS calls lacked authentication and allowed profile spoofing | **Partly valid; exploit claim incorrect** | The global bridge previously injected auth, and the API derives identity authoritatively. The fragile implicit bridge dependency was replaced by explicit authenticated requests. |
| CSP/header configuration drifted | **Valid** | Duplicate `vercel.json` header configuration was removed and the API origin is derived from env. `unsafe-inline` remains an acknowledged CSP hardening item; removing it safely requires a nonce rollout, not a blind deletion. |
| There was no rate limiting | **Incorrect** | The API has persistent rate-limit storage and enforced rate limits on sensitive endpoints. A frontend rewrite is not the correct security boundary for API throttling. |
| Dashboard cache could leak admin A data to admin B | **Incorrect** | Both cache and in-flight request are keyed by authenticated user ID and cleared on auth failure. |
| `adminRequest` breaks `FormData` | **Valid latent bug** | Fixed: JSON content type is only applied to non-`FormData` payloads. |
| Three Supabase browser clients create token drift | **Valid technical debt** | Consolidated onto the SSR-aware browser client. |
| Observability is in-memory only | **Valid** | Still open because a Sentry DSN/log-sink decision and production configuration are required. |
| Images were unoptimized | **Valid** | Fixed and verified by production build. |
| E2E coverage was too thin | **Valid** | Desktop/mobile security and optional authenticated admin-route coverage were added. Credentialed cases remain to be executed. |
| Frontend does not use Zod everywhere | **True but not P0** | The API remains the authoritative validator. Client schemas are UX hardening, not the primary security boundary. |

## AI model routing

Default policy:

1. General: `claude-sonnet-5`.
2. CodeCraft fallback 1: `gpt-5.6-sol`.
3. CodeCraft fallback 2: `claude-opus-5`.
4. CodeCraft fallback 3: `qwen3.8-max`.
5. Final provider fallback: configured OpenRouter model.

Complex reasoning and vision prefer `claude-opus-5`, then retain the remaining configured fallbacks. HTTP 401/402/403 moves directly to the next provider; a model-level 429/5xx is allowed to try another CodeCraft model first.

AI is used for:

- assessment interpretation and recommendations;
- optional lead-score refinement;
- proposal narrative constrained by deterministic catalog/pricing data;
- inquiry and assessment follow-up copy only when an approved template fallback is explicitly permitted;
- extraction from user-supplied LinkedIn/profile text;
- project role planning and associate matching;
- associate invitation copy;
- the public Bina concierge/chat.

The following remain deterministic and do not delegate authority to AI: prices, approval decisions, suppression, audience membership, idempotency, runtime mode, release gates, outbound permission, and final promotion to lead. Vision infrastructure is ready but has no production UI consumer yet.

## Production completion checklist

1. Rotate every credential that was exposed outside the secret store: CodeCraft, OpenRouter, Supabase service role/database password, Resend, and any copied automation secret.
2. **Done:** apply and verify `binahub-api/supabase/migrations/0044_pilot_audience_and_run_integrity.sql` in Supabase production.
3. **Done:** deploy `binahub-api` and `app-binahub` from their GitHub `main` branches.
4. Put the replacement `CODECRAFT_API_KEY` in the API deployment secret store and run `npm run test:ai` without printing the key.
5. Run credentialed Playwright with `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` set only in the local process.
6. Re-run production readiness plus Phase 17/18 smoke gates.
7. **Partly done:** anonymous admin rejection and secret-free worker rejection are verified; exact pilot audience, duplicate idempotency response, and zero outbound in dry-run still require the credentialed Phase 19 gate.
8. Record a fresh production monitoring snapshot and a new human go/no-go decision; do not reuse the two stale decisions.
9. Configure a production error sink and alert destination, then verify a synthetic non-sensitive test event.
10. Resolve the three pilot incidents only after deployment evidence is attached.
11. Open a new change window only after steps 1–10 pass.

## Required external inputs

- Correct Vercel project/team link for `binahub-api` and `app-binahub`.
- Supabase production SQL execution or a pooler connection stored locally.
- Replacement CodeCraft/OpenRouter credentials stored locally or in Vercel, never posted in chat.
- Temporary E2E admin credentials in local process environment.
- Sentry DSN or an explicit choice of another durable error/log sink.
