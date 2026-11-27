create table if not exists public.staff_owner_control (
  id boolean primary key default true check (id),
  legacy_owner text not null,
  suspended boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.staff_owner_control (id, legacy_owner, suspended)
values (true, '0x521125be95c5679539ab07582f55f0040975a047', false)
on conflict (id) do nothing;

create table if not exists public.staff_owner_control_events (
  id uuid primary key default gen_random_uuid(),
  legacy_owner text not null,
  suspended boolean not null,
  actor_wallet text not null,
  created_at timestamptz not null default now()
);

alter table public.staff_owner_control enable row level security;
alter table public.staff_owner_control_events enable row level security;
revoke all on public.staff_owner_control, public.staff_owner_control_events from anon, authenticated;
