-- TOKVANT client intake. Run once in the Supabase SQL editor.
create table if not exists public.client_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  receipt_secret_hash text not null,
  status text not null default 'uploading' check (status in ('uploading','received')),
  project jsonb not null,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  constraint client_submission_receipt_state check ((status='uploading' and received_at is null) or (status='received' and received_at is not null))
);
create index if not exists client_submissions_received_idx on public.client_submissions (received_at desc) where status='received';
alter table public.client_submissions enable row level security;
-- No anon/authenticated policies. The Vercel API uses a server-only secret key and verifies staff wallet signatures.
revoke all on public.client_submissions from anon, authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('tokvant-expedientes','tokvant-expedientes',false,26214400,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No storage.objects public policies. Uploads use short-lived signed tokens; downloads use URLs generated after staff authorization.
