create table if not exists public.app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state enable row level security;

revoke all on table public.app_state from anon, authenticated;
