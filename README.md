# BinaHub App

Operational platform for `app.binahub.id`.

`binahub.id` remains the public company profile website. This app owns
authenticated workflows such as client dashboards, admin dashboards,
facilitator reviews, BinaInsight forms, BinaImpact assessments, scoring, and
reports.

## Current Foundation

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase client helpers
- Role shells for `client`, `admin`, and `facilitator`
- BinaInsight module placeholder
- BinaImpact MVP module placeholder
- Supabase migration and seed files

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and fill Supabase values after the
existing Supabase project has been audited:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Supabase

Before applying migrations to an existing project, audit the current schema.
Reuse existing `profiles` and `organizations` tables if they already exist.
Do not rename or delete existing BinaInsight tables.

Migration files live in `supabase/migrations`.
Seed files live in `supabase/seed`.

## Product Split

Recommended BinaInsight flow:

```txt
binahub.id/bina-insight
  -> public explanation and CTA

app.binahub.id/client/binainsight/start
  -> authenticated assessment workflow
```

## Next Steps

- Connect Supabase Auth.
- Replace demo role links with real login.
- Migrate BinaInsight form logic.
- Implement BinaImpact database-driven form flow.
- Add admin progress and facilitator review persistence.
