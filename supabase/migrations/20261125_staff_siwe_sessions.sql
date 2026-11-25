-- One-time SIWE challenges and short administrative sessions.
create table if not exists public.staff_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  wallet text not null,
  nonce_hash text not null unique,
  domain text not null,
  uri text not null,
  chain_id bigint not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  wallet text not null,
  role text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists staff_auth_challenges_expiry_idx on public.staff_auth_challenges (expires_at);
create index if not exists staff_sessions_wallet_idx on public.staff_sessions (wallet, expires_at desc);
alter table public.staff_auth_challenges enable row level security;
alter table public.staff_sessions enable row level security;
revoke all on public.staff_auth_challenges, public.staff_sessions from anon, authenticated;
