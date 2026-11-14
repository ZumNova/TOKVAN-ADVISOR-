-- Keep client contact details outside operational project JSON and on-chain logs.
create table if not exists public.submission_private_contacts (
  submission_id uuid primary key references public.client_submissions(id) on delete cascade,
  contact jsonb not null,
  tax_id text,
  created_at timestamptz not null default now()
);
alter table public.submission_private_contacts enable row level security;
revoke all on public.submission_private_contacts from anon, authenticated;

-- Reserved for identity evidence once consent, retention and reviewer access are configured.
-- No client upload or public URL is exposed by this migration.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('tokvant-identidades','tokvant-identidades',false,26214400,array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Migrate existing received and in-progress projects before redacting the shared JSON.
insert into public.submission_private_contacts(submission_id,contact,tax_id)
select id,project->'contact',project->>'taxId'
from public.client_submissions
where project ? 'contact' and jsonb_typeof(project->'contact')='object'
on conflict(submission_id) do nothing;
update public.client_submissions
set project=project-'contact'-'taxId'
where project ? 'contact' or project ? 'taxId';
