-- Confirmed on-chain issuance linked to an immutable, approved client submission.
create table if not exists public.submission_issuances (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  project_hash text not null,
  standard text not null check (standard = 'ERC-20'),
  chain_id bigint not null check (chain_id = 11155111),
  factory_address text not null,
  token_address text not null,
  transaction_hash text not null unique,
  block_number bigint not null,
  project_id_hash text not null,
  config_digest text not null,
  token_name text not null,
  token_symbol text not null,
  admin_wallet text not null,
  treasury_wallet text not null,
  initial_supply_base_units text not null,
  max_supply_base_units text not null,
  recorded_by text not null,
  created_at timestamptz not null default now(),
  unique (submission_id, standard, chain_id)
);
create index if not exists submission_issuances_submission_idx on public.submission_issuances (submission_id);
alter table public.submission_issuances enable row level security;
revoke all on public.submission_issuances from anon, authenticated;
