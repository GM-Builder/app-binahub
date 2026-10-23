# Dependency remediation — 23 October 2026

Scope: app-binahub only. This is a dependency/advisory review and build repair,
not a penetration test or verification of the deployed Hostinger environment.

## Reported advisories

- Next.js 16.3.8: GHSA-673q-mjm6-r5xr, GHSA-2464-fhr4-w9xw and
  GHSA-p3m5-59mp-jv5r. Updated to 16.4.2, beyond the patched floor 16.4.1.
  ESLint's Next configuration is kept at the matching framework version.
- Vite 8.1.0: GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw,
  GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw and GHSA-rq7h-c2jc-7f22.
  The 8.1 release line is constrained to >=8.1.6. Vite is an explicit development
  dependency because the repository's local UI verification scripts import it.
  The `$vite` npm override keeps the test/preview tools on that same compatible
  version rather than resolving a second, independent Vite peer tree.
- Vitest/@vitest/mocker 4.1.11: GHSA-qxg6-89mg-rqv8 and
  GHSA-xp26-3454-mjgp. Updated minimum to 4.1.12 without a major-version migration.

The lockfile records exact resolved versions. Compare advisories rather than
counts: Hostinger lists individual advisories; npm also counts affected parent
packages along dependency chains.

## Remaining upstream tooling advisory

`braces` <=3.0.3 has a deeply nested pattern stack-exhaustion advisory,
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The advisory lists no patched version and npm's latest release is 3.0.3 at review.
The development-only path is:

`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`

Do not use `npm audit fix --force`: npm proposes a breaking downgrade of the Next
lint configuration, not a demonstrated fix for this vulnerable glob dependency.
Do not conceal the advisory, fabricate a patched version, replace glob libraries
through an unverified alias, or remove lint rules just to clear a scanner count.

In the installed Next lint plugin, `get-root-dirs` calls `fast-glob` only when
`settings.next.rootDir` is configured. This repository leaves that setting unset;
the default is the ESLint working directory. No public application input is sent
to this lint setting. Keep lint configuration and root patterns trusted and do
not introduce an endpoint/job that lints arbitrary uploaded projects or patterns.
This limits the current exposure; it does **not** patch `braces` itself. Recheck
upstream and the dependency chain when a patch or supported replacement ships.

## Verification

After the lockfile update, both `npm ci` and a normal `npm install
--package-lock-only --ignore-scripts` succeeded without legacy-peer-deps or force.
`npm ls` resolves one shared Vite 8.1.6 and Vitest/mocker 4.1.12, with Next/lint
configuration 16.4.2. The ten reported advisory IDs are absent from the new audit.
`npm audit --omit=dev --json` reports **0** vulnerabilities. The full audit reports
**5 high package nodes**, all from the single unpatched `braces` advisory above.
Lint, TypeScript and **334 tests across 66 files** pass locally.
The production webpack build completes with **2 page-data workers** and **90/90
static pages**. Starting that build locally returns HTTP 200 for `/login`,
`/discovery` and `/insight/individual/result`; security headers are present, and
Discovery/private-result routes retain no-store, no-referrer and noindex headers.
The temporary local verification server was stopped after these checks. This
does not verify Hostinger's subsequent deployment or any live email workflow.

Run `npm ci`, `npm audit --json`, `npm audit --omit=dev --json`, `npm run lint`,
`npm run typecheck`, `npm run test:run` and `npm run build`. Inspect the production
build output for **two** page-data workers. The known remaining tooling advisory
must remain visible in the full audit; production-only results are separate.
No live assessment submissions, real email sends or production data changes are
needed for this dependency/build patch.
