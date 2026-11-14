-- Operational wallet roster. No personal names, IDs, KYC files or payment data.
create table if not exists public.regulated_tokens (
  token_address text primary key check (token_address ~ '^0x[0-9a-f]{40}$'),
  factory_address text not null check (factory_address ~ '^0x[0-9a-f]{40}$'),
  chain_id integer not null check (chain_id = 11155111),
  token_name text not null,
  token_symbol text not null,
  admin_wallet text not null check (admin_wallet ~ '^0x[0-9a-f]{40}$'),
  claim_authority text not null check (claim_authority ~ '^0x[0-9a-f]{40}$'),
  project_reference text not null,
  registered_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.regulated_participants (
  id uuid primary key default gen_random_uuid(),
  token_address text not null references public.regulated_tokens(token_address),
  wallet_address text not null check (wallet_address ~ '^0x[0-9a-f]{40}$'),
  internal_reference text not null check (char_length(internal_reference) between 4 and 120),
  proposed_country integer check (proposed_country between 1 and 999),
  proposed_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(token_address,wallet_address)
);
create index if not exists regulated_participants_token_idx on public.regulated_participants(token_address,created_at);

-- Curated operational knowledge for future read-only educational assistance.
-- Never insert identity files, personal data, wallet-holder names or secrets here.
create table if not exists public.educational_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  source_reference text not null,
  standard text,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  author_wallet text not null,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.regulated_tokens enable row level security;
alter table public.regulated_participants enable row level security;
alter table public.educational_notes enable row level security;
revoke all on public.regulated_tokens, public.regulated_participants, public.educational_notes from anon, authenticated;
-- The Vercel API verifies wallet signatures and roles; the service key stays server-side.
