create table public.problem_tags (
  problem_id text not null,
  type text not null,
  tag_ids text[] not null,
  tag_labels text[] not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint problem_tags_pkey primary key (problem_id, type)
) TABLESPACE pg_default;

create index IF not exists idx_exam_problem_tags_tag_ids on public.problem_tags using gin (tag_ids) TABLESPACE pg_default;

create index IF not exists idx_exam_problem_tags_type on public.problem_tags using btree (type) TABLESPACE pg_default;

create trigger update_exam_problem_tags_updated_at BEFORE
update on problem_tags for EACH row
execute FUNCTION update_updated_at_column ();