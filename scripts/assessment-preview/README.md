# Assessment Admin local preview

Run `npx vite --config scripts/assessment-preview/vite.config.ts` and open `http://127.0.0.1:4318`.

Uses the real AssessmentPanel with synthetic fixtures and in-memory action callbacks. No production API proxy, credentials, real email, or database writes. Documents deliberately cannot be fetched because the mock session is unauthenticated. This is not a public Next.js route and is not included in the application build.
