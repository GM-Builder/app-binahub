insert into impact_models (code, name, description, order_index)
values
  ('model-a', 'Model A', 'Placeholder model for BinaImpact MVP.', 1),
  ('model-b', 'Model B', 'Placeholder model for BinaImpact MVP.', 2),
  ('model-c', 'Model C', 'Placeholder model for BinaImpact MVP.', 3),
  ('model-d', 'Model D', 'Placeholder model for BinaImpact MVP.', 4)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  order_index = excluded.order_index;

insert into impact_levels (model_id, level_number, name)
select id, 1, 'Level 1' from impact_models
on conflict (model_id, level_number) do nothing;

insert into impact_levels (model_id, level_number, name)
select id, 2, 'Level 2' from impact_models
on conflict (model_id, level_number) do nothing;

insert into impact_sections (level_id, name, order_index)
select impact_levels.id, section_name, order_index
from impact_levels
cross join (
  values
    ('Bagian 1', 1),
    ('Bagian 2', 2),
    ('Bagian 3', 3)
) as sections(section_name, order_index)
where not exists (
  select 1
  from impact_sections
  where impact_sections.level_id = impact_levels.id
    and impact_sections.order_index = sections.order_index
);

insert into impact_questions (section_id, text, question_type, scale_min, scale_max, order_index)
select
  impact_sections.id,
  'Placeholder question ' || question_number || ' for ' || impact_sections.name,
  'scale',
  1,
  5,
  question_number
from impact_sections
cross join generate_series(1, 3) as question_number
where not exists (
  select 1
  from impact_questions
  where impact_questions.section_id = impact_sections.id
    and impact_questions.order_index = question_number
);
