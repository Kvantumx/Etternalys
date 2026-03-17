-- Run this entire file in your Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)

-- 1. Profiles (one per auth user, created automatically on signup)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  etterna_username text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tracked packs per user
create table public.user_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  pack_id integer not null,
  pack_name text not null default '',
  pack_overall numeric not null default 0,
  songs_data jsonb not null default '[]',
  added_at bigint not null,
  last_fetched bigint not null,
  unique(user_id, pack_id)
);

-- 3. Historical snapshots (for charts)
create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  snapshot_timestamp bigint not null,
  user_data jsonb not null,
  user_ranks jsonb not null,
  created_at timestamptz default now()
);

-- Row Level Security (each user only sees their own data)
alter table public.profiles enable row level security;
alter table public.user_packs enable row level security;
alter table public.snapshots enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "packs_own" on public.user_packs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "snapshots_own" on public.snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, etterna_username)
  values (new.id, '');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
