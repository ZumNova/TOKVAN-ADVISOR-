-- Verified Sepolia ERC-3643 deployments linked to received submissions.
-- Stores contract references only; fictitious credentials and personal data stay outside this table.
create table if not exists public.submission_regulated_issuances (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.client_submissions(id),
  project_hash text not null,
  standard text not null default 'ERC-3643' check (standard = 'ERC-3643'),
  chain_id bigint not null check (chain_id = 11155111),
  factory_address text not null,
  token_address text not null,
  transaction_hash text not null unique,
  block_number bigint not null,
  project_id_hash text not null,
  config_digest text not null,
  dossier_hash text not null,
  token_name text not null,
  token_symbol text not null,
  admin_wallet text not null,
  recorded_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists submission_regulated_issuances_submission_idx on public.submission_regulated_issuances (submission_id);
alter table public.submission_regulated_issuances enable row level security;
revoke all on public.submission_regulated_issuances from anon, authenticated;
