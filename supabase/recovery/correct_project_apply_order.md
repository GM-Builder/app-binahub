# T-BOS Correct-Project Recovery

Use the Supabase project referenced by the production `api.binahub.id`
`NEXT_PUBLIC_SUPABASE_URL`. Confirm the project reference in the URL before
running any SQL.

First run `supabase/recovery/correct_project_preflight.sql`. Continue only when
`known_production_team_exists` is `true`.

Then run these files one at a time, in order:

1. `supabase/migrations/0012_reconcile_tbos_schema.sql`
2. `supabase/migrations/0013_tbos_transactional_operations.sql`
3. `supabase/migrations/0014_tbos_transactional_mutations.sql`
4. `supabase/migrations/0015_tbos_observation_member_snapshots.sql`
5. `supabase/migrations/0016_tbos_postgrest_schema_recovery.sql`
6. `supabase/tbos_health_check.sql`
7. `supabase/tbos_runtime_diagnostic.sql`

Expected health-check values:

- `missions = 5`
- `dimensions = 8`
- `levels = 40`
- `mission_dimension_mappings = 16`
- all table/column/relationship/RPC readiness fields are `true`
- `observation_members_rls_enabled = true`
- `observation_members_service_role_ready = true`
- `observation_members_authenticated_blocked = true`

Existing teams and facilitator assignments should be preserved by 0012. Do not
reassign facilitators until the health check has completed. Then verify the
specific facilitator using `supabase/tbos_assignment_check.sql`.
