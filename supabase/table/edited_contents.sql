create table public.edited_contents (
  resource_id text not null,
  json jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  base64 text null,
  constraint edited_contents_pkey primary key (resource_id)
) TABLESPACE pg_default;

create index IF not exists idx_edited_contents_created_at on public.edited_contents using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_edited_contents_updated_at on public.edited_contents using btree (updated_at) TABLESPACE pg_default;

create index IF not exists idx_edited_contents_json on public.edited_contents using gin ("json") TABLESPACE pg_default;

create trigger update_edited_contents_updated_at BEFORE
update on edited_contents for EACH row
execute FUNCTION update_updated_at_column ();