-- Shared, append-only governance for received TOKVANT submissions.
create table if not exists public.submission_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  role text not null check (role in ('Technical Reviewer','Compliance Reviewer','Enterprise Board')),
  decision text not null check (decision in ('Aprobado','Rechazado','Corrección solicitada')),
  project_hash text not null,
  signer_wallet text not null,
  signature text not null,
  proof jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists submission_reviews_latest_idx on public.submission_reviews (submission_id, role, created_at desc);

create table if not exists public.submission_payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  status text not null default 'uploading' check (status in ('uploading','verified')),
  amount text not null,
  currency text not null,
  reference text not null,
  file_name text not null,
  file_size bigint not null,
  file_sha256 text not null,
  signer_wallet text,
  signature text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists submission_payments_latest_idx on public.submission_payments (submission_id, created_at desc);

create table if not exists public.submission_authorizations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  project_hash text not null,
  review_ids jsonb not null,
  payment_id uuid not null references public.submission_payments(id),
  signer_wallet text not null,
  signature text not null,
  created_at timestamptz not null default now()
);
create index if not exists submission_authorizations_latest_idx on public.submission_authorizations (submission_id, created_at desc);

alter table public.submission_reviews enable row level security;
alter table public.submission_payments enable row level security;
alter table public.submission_authorizations enable row level security;
revoke all on public.submission_reviews, public.submission_payments, public.submission_authorizations from anon, authenticated;
-- The Vercel API verifies wallet and role signatures before every read or write.
