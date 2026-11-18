-- Public, reviewed answers only. Do not copy client submissions or internal notes here.
create table if not exists public.public_educational_answers (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  short_answer text not null,
  more_answer text not null default '',
  keywords text[] not null default '{}',
  category text not null default 'General',
  source_reference text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_answer_lengths check (
    char_length(question) between 8 and 180 and
    char_length(short_answer) between 20 and 500 and
    char_length(more_answer) <= 1000 and
    char_length(source_reference) between 4 and 300
  ),
  constraint public_answer_review check (status <> 'published' or reviewed_at is not null)
);
create index if not exists public_educational_answers_status_idx
  on public.public_educational_answers(status,created_at desc);
alter table public.public_educational_answers enable row level security;
revoke all on public.public_educational_answers from anon, authenticated;
