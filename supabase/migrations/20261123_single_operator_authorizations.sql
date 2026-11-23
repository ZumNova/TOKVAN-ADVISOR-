-- One signed operator decision per immutable submission version and verified payment.
-- Keeps the legacy three-reviewer records intact.
create table if not exists public.submission_operator_authorizations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  project_hash text not null,
  payment_id uuid not null references public.submission_payments(id),
  decision text not null check (decision in ('approved','rejected')),
  rationale text not null check (char_length(rationale) between 20 and 3000),
  signer_wallet text not null,
  signature text not null,
  signed_at timestamptz not null,
  nonce uuid not null unique,
  created_at timestamptz not null default now()
);
create index if not exists submission_operator_authorizations_latest_idx on public.submission_operator_authorizations (submission_id, created_at desc);
alter table public.submission_operator_authorizations enable row level security;
revoke all on public.submission_operator_authorizations from anon, authenticated;
