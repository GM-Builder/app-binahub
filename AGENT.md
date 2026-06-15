# AGENT.md - BinaHub App Platform

## Context

We are building `app.binahub.id`, the operational platform for BinaHub.
This app is separate from `binahub.id`, which remains the public company
profile and marketing website.

The long-term vision is a unified BinaHub operating platform that hosts
multiple service modules, including BinaInsight, BinaImpact, and future
BinaHub services. The immediate goal is not to build a full "superapp" at
once, but to build a clean modular foundation that can grow safely.

## Product Separation

### `binahub.id`

Public-facing company profile website:

- Homepage
- Service pages
- Marketing copy
- SEO content
- Case studies
- Public explanation of BinaHub services
- Public call-to-action buttons

Assessment logic, user dashboards, admin dashboards, facilitator workflows,
client data, scoring, and reports should not live here.

### `app.binahub.id`

Operational platform:

- Authentication
- Role-based dashboards
- Client workspace
- Admin workspace
- Facilitator workspace
- Assessment forms
- Scoring
- Results
- Reports
- Reviews
- Program progress
- Service modules

## Important Routing Decision

BinaInsight public explanation pages may stay inside `binahub.id`.

Example:

```txt
binahub.id/bina-insight
```

This page explains what BinaInsight is, who it is for, and why users should
take the assessment.

When the user clicks the main "Mulai" button from the BinaInsight page, the
button should send them to `app.binahub.id`.

Example:

```txt
https://app.binahub.id/client/binainsight/start
```

The actual assessment form, answer storage, scoring, and report generation
must live inside `app.binahub.id`.

Exception: BinaInsight assessment is allowed to be public in `app.binahub.id`
without login. This is a lead-generation and diagnostic entry flow.

All other operational workspaces should require role-based access:

```txt
/client       -> client users
/admin        -> admin users
/facilitator  -> facilitator users
/insight      -> public BinaInsight assessment
```

The app entry screen should be task-first:

```txt
Masuk sebagai Client
Masuk sebagai Admin
Masuk sebagai Fasilitator
Mulai BinaInsight Tanpa Login
```

Avoid long marketing explanations inside the app.

Navbar CTA buttons can also link to the app when the intent is login,
dashboard access, or starting an authenticated workflow.

## Architecture Principle

Build a modular monolith first.

Do not split into microservices at this stage. The team needs speed,
clarity, and a working end-to-end platform. Use a single Next.js app with
clear module boundaries.

Recommended structure:

```txt
root/
├── website-prod/
│   └── public company profile for binahub.id
│
└── app-binahub/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/
    │   ├── client/
    │   │   ├── dashboard/
    │   │   ├── binainsight/
    │   │   └── binaimpact/
    │   ├── admin/
    │   │   ├── dashboard/
    │   │   ├── organizations/
    │   │   ├── users/
    │   │   ├── assessments/
    │   │   └── reports/
    │   ├── facilitator/
    │   │   ├── dashboard/
    │   │   ├── reviews/
    │   │   └── clients/
    │   └── middleware.ts
    │
    ├── modules/
    │   ├── binainsight/
    │   │   ├── components/
    │   │   ├── forms/
    │   │   ├── scoring/
    │   │   ├── reports/
    │   │   ├── schemas/
    │   │   └── actions/
    │   │
    │   └── binaimpact/
    │       ├── components/
    │       ├── forms/
    │       ├── scoring/
    │       ├── reviews/
    │       ├── schemas/
    │       └── actions/
    │
    ├── lib/
    │   ├── auth/
    │   ├── supabase/
    │   ├── roles/
    │   ├── permissions/
    │   └── utils/
    │
    ├── components/
    │   ├── layout/
    │   ├── navigation/
    │   └── ui/
    │
    └── supabase/
        ├── migrations/
        └── seed/
```

## Roles

Start with three roles only:

```txt
admin
client
facilitator
```

Do not over-model roles too early. More specific roles such as
`super_admin`, `client_owner`, `assessor`, or `consultant` can be added when
there is a real workflow that requires them.

### Client

Can:

- Access client dashboard
- Start assigned assessments
- Fill BinaInsight assessment forms
- Fill BinaImpact forms
- View own results and reports
- Track program progress

### Admin

Can:

- Manage users
- Manage organizations
- View assessment progress
- View submitted results
- Assign services/modules
- Monitor facilitator activity
- Access global reports

Admin belongs to the app platform, not to a specific service module.

### Facilitator

Can:

- View assigned clients
- Review completed assessments
- Add notes
- Add score adjustments when allowed
- Track client progress

## Module Boundaries

### BinaInsight

In `app.binahub.id`, BinaInsight should contain only the operational parts:

- Assessment form
- Question schema
- Answer submission
- Scoring
- Result page
- Report generation
- Admin visibility

The public marketing page may remain in `binahub.id`.

### BinaImpact

BinaImpact starts as a small MVP module:

- 4 models
- Each model has Level 1 and Level 2
- Level 1 has 3 sections
- Level 2 has 3 sections:
  - Pre-test
  - Post-test
  - Facilitator assessment
- Each section has questions
- Client can answer
- Admin can monitor progress
- Facilitator can review completed assessments

Facilitators are evaluators. Their workspace must make it easy to review
client work and give scores/notes, especially for BinaImpact Level 2 section
3, which is the facilitator assessment section.

Use the smaller BinaImpact MVP scope as the first proof that the platform
architecture works.

## Database Principle

Use the existing Supabase project if it already powers BinaInsight, but audit
the schema before changing anything.

Before creating new tables:

1. List existing tables.
2. Identify whether `profiles`, `users`, `organizations`, or `companies`
   already exist.
3. Reuse existing shared tables where reasonable.
4. Avoid renaming or deleting existing BinaInsight tables.
5. Prefix module-specific BinaImpact tables with `impact_`.
6. Prefix module-specific BinaInsight tables with `insight_` if new tables
   are needed.

Shared tables should represent platform-level concepts:

```txt
profiles
organizations
roles
service_assignments
```

Module tables should represent service-specific workflows:

```txt
insight_questions
insight_responses
insight_scores

impact_models
impact_levels
impact_sections
impact_questions
impact_responses
impact_scores
impact_reviews
```

## Authentication

Use Supabase Auth unless the project already standardizes on another auth
provider.

After login, redirect based on `profiles.role`:

```txt
admin       -> /admin/dashboard
client      -> /client/dashboard
facilitator -> /facilitator/dashboard
```

Middleware should protect role-specific routes.

## Implementation Rules

- Keep `binahub.id` clean as a public website.
- Put authenticated workflows in `app.binahub.id`.
- Do not build all 8 services at once.
- Build shared platform foundations before expanding modules.
- Do not place admin dashboard inside BinaInsight.
- Do not duplicate auth logic per module.
- Prefer reusable assessment patterns, but do not over-engineer a generic
  assessment engine before BinaInsight and BinaImpact are working.
- Use simple scoring first, then refine formulas later.
- Seed realistic demo data early so dashboards are never empty.

## Recommended Stack

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase Postgres
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Recharts for charts
- Vercel for deployment

## Definition of Done for Foundation

The platform foundation is considered ready when:

- `app-binahub` exists separately from `website-prod`
- Login works
- User role is stored in database
- Role-based redirect works
- `/client`, `/admin`, and `/facilitator` dashboards exist
- At least one module can be accessed from the client dashboard
- Admin can see client progress
- Data is persisted in Supabase

## Short-Term Priority

The first implementation phase should focus on:

1. Creating the separate `app-binahub` project.
2. Moving BinaInsight assessment form logic into the app.
3. Keeping the BinaInsight marketing page in `website-prod`.
4. Building BinaImpact MVP as a module.
5. Creating admin and facilitator dashboards inside the app.
