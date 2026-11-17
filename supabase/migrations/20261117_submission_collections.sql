-- Verified ERC-721 / ERC-1155 collection deployments, linked to received submissions.
create table if not exists public.submission_collections (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.client_submissions(id),
  project_hash text not null,
  standard text not null check (standard in ('ERC-721','ERC-1155')),
  chain_id bigint not null check (chain_id = 11155111),
  factory_address text not null,
  collection_address text not null,
  transaction_hash text not null unique,
  block_number bigint not null,
  project_id_hash text not null,
  config_digest text not null,
  collection_name text not null,
  collection_symbol text not null,
  admin_wallet text not null,
  max_items text not null,
  burnable boolean not null,
  pausable boolean not null,
  recorded_by text not null,
  created_at timestamptz not null default now(),
  unique (submission_id, standard, chain_id)
);
create index if not exists submission_collections_submission_idx on public.submission_collections (submission_id);
alter table public.submission_collections enable row level security;
revoke all on public.submission_collections from anon, authenticated;
