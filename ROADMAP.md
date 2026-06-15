# ROADMAP.md - BinaHub App Platform

## North Star

`app.binahub.id` becomes the operational platform for BinaHub services.
`binahub.id` remains the public company profile and marketing website.

The platform should eventually host multiple services, but the first goal is
to create a stable foundation and ship useful modules gradually.

## Phase 0 - Repository Separation and Planning

Goal: separate public website responsibilities from operational app
responsibilities.

Tasks:

- Create new folder/repository for `app-binahub`, placed beside
  `website-prod`.
- Keep `website-prod` focused on public pages.
- Document which BinaInsight parts stay in company profile and which parts
  move to the app.
- Audit existing Supabase schema before making changes.
- Confirm deployment target for `app.binahub.id`.

Expected result:

- Clear separation between `binahub.id` and `app.binahub.id`.
- Team agrees that BinaInsight public page can stay in company profile, while
  assessment workflow moves to the app.

## Phase 1 - App Foundation

Goal: create the minimum platform foundation shared by all future modules.

Tasks:

- Set up Next.js App Router project.
- Configure TypeScript, Tailwind CSS, and shadcn/ui.
- Configure Supabase client/server helpers.
- Implement login.
- Create or reuse `profiles` table.
- Create or reuse `organizations` table.
- Add role field with three initial roles:
  - `admin`
  - `client`
  - `facilitator`
- Implement role-based redirects.
- Create route shells:
  - `/client/dashboard`
  - `/admin/dashboard`
  - `/facilitator/dashboard`
- Add shared app layout and navigation.

Expected result:

- Users can log in and land in the correct dashboard based on role.
- App has a clean structure for future modules.

## Phase 2 - BinaInsight Migration

Goal: move BinaInsight operational workflow into `app.binahub.id` without
breaking the existing public BinaInsight page.

Tasks:

- Keep BinaInsight marketing/explanation page in `website-prod`.
- Change the "Mulai" CTA button to open the app route.
- Create BinaInsight routes in app:
  - `/client/binainsight/start`
  - `/client/binainsight/assessment`
  - `/client/binainsight/results`
- Move or rebuild BinaInsight form inside the app.
- Move scoring logic into `modules/binainsight/scoring`.
- Persist answers in Supabase.
- Show result page inside the app.
- Let admin view submitted BinaInsight results.

Expected result:

- Public users discover BinaInsight on `binahub.id`.
- Actual test/assessment happens on `app.binahub.id`.
- BinaInsight is no longer operationally dependent on company profile code.

## Phase 3 - BinaImpact MVP

Goal: build the first small BinaImpact module as a demo-ready operational
workflow.

Scope:

- 4 BinaImpact models.
- Each model has Level 1 and Level 2.
- Each level has 3 sections.
- Each section has questions.

Tasks:

- Create BinaImpact database tables with `impact_` prefix.
- Seed 4 models.
- Seed levels, sections, and placeholder questions.
- Build client form flow:
  - choose model
  - answer Level 1
  - answer Level 2
  - see results
- Calculate section and level scores.
- Build admin progress dashboard.
- Build facilitator review list.
- Build facilitator review detail page with notes and optional adjustment.
- Seed one full demo flow.

Expected result:

- Client can complete a BinaImpact assessment.
- Facilitator can review it.
- Admin can monitor progress.
- Demo can be shown end-to-end.

## Phase 4 - Unified Service Hub

Goal: make `app.binahub.id` feel like one BinaHub platform, not separate
screens stitched together.

Tasks:

- Create client service dashboard showing available services.
- Add service assignment table.
- Show locked/unavailable services if client does not have access.
- Add progress cards per service.
- Add shared report center.
- Normalize shared UI patterns across BinaInsight and BinaImpact.

Expected result:

- Client sees BinaHub services from one dashboard.
- Admin can control who gets access to which service.
- Modules feel connected through one platform experience.

## Phase 5 - Admin and Facilitator Expansion

Goal: strengthen operational workflows.

Tasks:

- Organization management.
- User management.
- Client detail page.
- Facilitator assignment.
- Assessment status tracking.
- Review status tracking.
- Export report data.
- Internal notes.

Expected result:

- Admin can operate the platform without developer help.
- Facilitator has a clear workspace for assessment review.

## Phase 6 - Reports and Automation

Goal: turn assessment data into useful deliverables.

Tasks:

- Generate PDF reports.
- Add report templates.
- Add AI-assisted summaries if needed.
- Add email notification.
- Add background jobs for heavy report generation.
- Add audit logs for sensitive actions.

Expected result:

- BinaHub can deliver reports consistently from the app.
- Manual operational work is reduced.

## Phase 7 - Additional Service Modules

Goal: add the remaining BinaHub services gradually.

Tasks:

- Define each service as a module.
- Reuse shared auth, organization, role, dashboard, and reporting patterns.
- Add service-specific data models only when needed.
- Avoid building generic abstractions before at least two or three modules
  prove the same pattern.

Expected result:

- BinaHub can add services without rewriting the platform.

## Suggested Build Order

Recommended sequence:

```txt
1. app-binahub foundation
2. auth and roles
3. basic dashboards
4. BinaInsight assessment migration
5. BinaImpact MVP
6. admin progress dashboard
7. facilitator review workflow
8. service hub
9. reports
10. future modules
```

## Key Product Decision

BinaInsight page strategy:

```txt
binahub.id/bina-insight
```

Used for:

- explanation
- marketing
- SEO
- service positioning
- CTA

```txt
app.binahub.id/client/binainsight/start
```

Used for:

- login/authentication
- actual assessment form
- answer submission
- scoring
- results
- report

This is the recommended split.

## Risk Notes

- Do not let BinaImpact MVP force a messy platform foundation.
- Do not overbuild a universal assessment engine too early.
- Do not keep adding operational code to `website-prod`.
- Do not duplicate dashboards per service.
- Do not let admin become tied to a single module.

## Success Criteria for First Milestone

The first milestone is successful when:

- `app.binahub.id` exists as a separate app.
- Client, admin, and facilitator roles work.
- BinaInsight form runs from the app.
- BinaInsight public page can link into the app.
- BinaImpact MVP can be demonstrated end-to-end.
- Data is stored in Supabase.

