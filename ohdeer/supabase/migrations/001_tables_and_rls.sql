-- =====================================================================
-- ohdeer: tables + security rules
--
-- HOW TO USE: Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once.
--
-- HOW IT KEEPS YOUR DATA PRIVATE ("Row Level Security", or RLS):
-- every row stores the id of the user who made it (user_id). The
-- policies below tell the database: "a logged-in person may only see,
-- add, change, or delete rows whose user_id is THEIR OWN id."
-- Visitors who aren't logged in can't touch anything at all.
-- =====================================================================


-- 1. occurrence_types: your reusable list ("Rain storm", "Deer sighting"…)
create table if not exists public.occurrence_types (
  id          uuid primary key default gen_random_uuid(),
  -- auth.uid() = "the id of whoever is logged in", filled in automatically
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 60),
  icon        text not null default 'leaf',     -- key of a doodle icon, e.g. 'cloud-rain'
  color       text not null default 'moss',     -- key of a palette color, e.g. 'teal'
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);


-- 2. entries: one row per thing that happened on a day (many per day allowed)
create table if not exists public.entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date         date not null,
  -- "on delete restrict" = you can't delete a type that still has entries.
  -- (The app archives types instead, so your history stays intact.)
  type_id      uuid not null references public.occurrence_types (id) on delete restrict,
  time_of_day  text check (time_of_day in ('morning', 'afternoon', 'evening', 'night')),
  intensity    text check (intensity in ('light', 'moderate', 'heavy')),
  note         text check (char_length(note) <= 2000),
  created_at   timestamptz not null default now()
);

-- Indexes make "give me everything in this month" fast.
create index if not exists entries_user_date_idx on public.entries (user_id, date);
create index if not exists entries_type_idx      on public.entries (type_id);
create index if not exists types_user_idx        on public.occurrence_types (user_id);


-- 3. Turn on Row Level Security (with RLS on and no policy, NOTHING is allowed).
alter table public.occurrence_types enable row level security;
alter table public.entries          enable row level security;

-- Only logged-in users get table access at all; anonymous visitors get none.
revoke all on public.occurrence_types from anon;
revoke all on public.entries          from anon;
grant select, insert, update, delete on public.occurrence_types to authenticated;
grant select, insert, update, delete on public.entries          to authenticated;


-- 4. Policies: "only your own rows".
--    (select auth.uid()) is wrapped in a select so Postgres computes it once
--    per query instead of once per row — a recommended Supabase speed trick.

drop policy if exists "own types: read"   on public.occurrence_types;
drop policy if exists "own types: add"    on public.occurrence_types;
drop policy if exists "own types: change" on public.occurrence_types;
drop policy if exists "own types: delete" on public.occurrence_types;

create policy "own types: read" on public.occurrence_types
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own types: add" on public.occurrence_types
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own types: change" on public.occurrence_types
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own types: delete" on public.occurrence_types
  for delete to authenticated using (user_id = (select auth.uid()));


drop policy if exists "own entries: read"   on public.entries;
drop policy if exists "own entries: add"    on public.entries;
drop policy if exists "own entries: change" on public.entries;
drop policy if exists "own entries: delete" on public.entries;

create policy "own entries: read" on public.entries
  for select to authenticated using (user_id = (select auth.uid()));

-- For adding/changing entries we ALSO check that the chosen type is yours,
-- so an entry can never point at someone else's type.
create policy "own entries: add" on public.entries
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.occurrence_types t
                where t.id = type_id and t.user_id = (select auth.uid()))
  );
create policy "own entries: change" on public.entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.occurrence_types t
                where t.id = type_id and t.user_id = (select auth.uid()))
  );
create policy "own entries: delete" on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));
