create table public.accuracy_rate (
  problem_id text not null,
  correct_answer text null,
  difficulty text null,
  score integer null,
  accuracy_rate numeric(5, 2) null,
  selection_rates jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint accuracy_rate_pkey primary key (problem_id)
) TABLESPACE pg_default;

create index IF not exists idx_accuracy_rate_difficulty on public.accuracy_rate using btree (difficulty) TABLESPACE pg_default;

create index IF not exists idx_accuracy_rate_accuracy on public.accuracy_rate using btree (accuracy_rate) TABLESPACE pg_default;

create trigger update_accuracy_rate_updated_at BEFORE
update on accuracy_rate for EACH row
execute FUNCTION update_updated_at_column ();