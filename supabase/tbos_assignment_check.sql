-- Replace the UUID below with the facilitator profile ID.
-- This returns all assigned teams in one result set.
select
  ft.profile_id,
  p.full_name as facilitator_name,
  p.role,
  ft.team_id,
  t.name as team_name,
  t.batch,
  count(tm.id) as member_count,
  max(tm.member_name) filter (where tm.is_captain) as captain_name
from public.tbos_facilitator_teams ft
join public.profiles p on p.id = ft.profile_id
join public.tbos_teams t on t.id = ft.team_id
left join public.tbos_team_members tm on tm.team_id = t.id
where ft.profile_id = '00000000-0000-0000-0000-000000000000'::uuid
group by ft.profile_id, p.full_name, p.role, ft.team_id, t.name, t.batch
order by t.batch, t.name;
