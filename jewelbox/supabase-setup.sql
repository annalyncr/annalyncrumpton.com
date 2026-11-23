-- =====================================================================
-- jewelbox: Supabase setup
--
-- HOW TO USE: Supabase dashboard → SQL Editor → New query →
-- paste this whole file → Run. It is safe to run more than once.
--
-- HOW IT KEEPS CDs SAFE:
-- • Anyone can VIEW the published CD designs (that's the Community Library).
-- • Nobody can read the secret words. They are stored scrambled ("hashed"),
--   and that column is hidden from visitors entirely.
-- • Visitors can't insert, edit, or delete rows directly. Instead, the site
--   calls the four functions at the bottom, which check the creator name +
--   secret word *inside the database*, where visitors can't tamper with it.
-- =====================================================================


-- 1. pgcrypto provides crypt() and gen_salt(), used to scramble secret words.
create extension if not exists pgcrypto with schema extensions;


-- 2. The table that holds every CD.
--    cover / tracklist / disc are "recipes" stored as JSON: which paper,
--    where each sticker sits, the marker strokes, the songs, etc.
create table if not exists public.mixtapes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title         text not null default 'untitled mix',
  creator_name  text not null,
  secret_hash   text not null,
  cover         jsonb not null default '{}'::jsonb,
  tracklist     jsonb not null default '{}'::jsonb,
  disc          jsonb not null default '{}'::jsonb,
  constraint title_length   check (char_length(title) between 1 and 80),
  constraint creator_length check (char_length(creator_name) between 1 and 40),
  -- Keeps any single CD under ~600 KB so the library stays fast.
  constraint design_size    check (octet_length(cover::text) + octet_length(tracklist::text) + octet_length(disc::text) < 600000)
);

create index if not exists mixtapes_created_at_idx on public.mixtapes (created_at desc);


-- 3. Row Level Security: visitors may only READ rows.
--    (There are deliberately no insert/update/delete policies.)
alter table public.mixtapes enable row level security;

drop policy if exists "Anyone can view mixtapes" on public.mixtapes;
create policy "Anyone can view mixtapes"
  on public.mixtapes for select
  to anon, authenticated
  using (true);


-- 4. Column permissions: visitors can read every column EXCEPT secret_hash.
revoke all on public.mixtapes from anon, authenticated;
grant select (id, created_at, updated_at, title, creator_name, cover, tracklist, disc)
  on public.mixtapes to anon, authenticated;


-- 5. Functions the website calls.
--    "security definer" = the function runs with the database owner's
--    permissions, so it can write to the table even though visitors can't.
--    Each one checks the name + secret word before doing anything.

-- 5a. Publish a new CD. Returns the new CD's id.
create or replace function public.publish_mixtape(
  p_creator_name text,
  p_secret_word  text,
  p_title        text,
  p_cover        jsonb,
  p_tracklist    jsonb,
  p_disc         jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if p_creator_name is null or char_length(btrim(p_creator_name)) = 0 then
    raise exception 'Please enter a creator name.';
  end if;
  if p_secret_word is null or char_length(p_secret_word) < 4 then
    raise exception 'Your secret word needs at least 4 characters.';
  end if;

  insert into public.mixtapes (creator_name, secret_hash, title, cover, tracklist, disc)
  values (
    btrim(p_creator_name),
    extensions.crypt(p_secret_word, extensions.gen_salt('bf', 8)),
    coalesce(nullif(btrim(p_title), ''), 'untitled mix'),
    coalesce(p_cover, '{}'::jsonb),
    coalesce(p_tracklist, '{}'::jsonb),
    coalesce(p_disc, '{}'::jsonb)
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- 5b. My Stash: list the CDs that match a name + secret word.
--     (Name matching ignores capital letters; the secret word does not.)
create or replace function public.my_mixtapes(
  p_creator_name text,
  p_secret_word  text
)
returns table (
  id           uuid,
  created_at   timestamptz,
  updated_at   timestamptz,
  title        text,
  creator_name text,
  cover        jsonb,
  tracklist    jsonb,
  disc         jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.created_at, m.updated_at, m.title, m.creator_name, m.cover, m.tracklist, m.disc
  from public.mixtapes m
  where lower(m.creator_name) = lower(btrim(p_creator_name))
    and m.secret_hash = extensions.crypt(p_secret_word, m.secret_hash)
  order by m.created_at desc;
$$;

-- 5c. Save edits to one of your CDs.
create or replace function public.update_mixtape(
  p_id           uuid,
  p_creator_name text,
  p_secret_word  text,
  p_title        text,
  p_cover        jsonb,
  p_tracklist    jsonb,
  p_disc         jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mixtapes m
     set title      = coalesce(nullif(btrim(p_title), ''), 'untitled mix'),
         cover      = coalesce(p_cover, m.cover),
         tracklist  = coalesce(p_tracklist, m.tracklist),
         disc       = coalesce(p_disc, m.disc),
         updated_at = now()
   where m.id = p_id
     and lower(m.creator_name) = lower(btrim(p_creator_name))
     and m.secret_hash = extensions.crypt(p_secret_word, m.secret_hash);

  if not found then
    raise exception 'That name and secret word don''t match this CD.';
  end if;
end;
$$;

-- 5d. Delete one of your CDs.
create or replace function public.delete_mixtape(
  p_id           uuid,
  p_creator_name text,
  p_secret_word  text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.mixtapes m
   where m.id = p_id
     and lower(m.creator_name) = lower(btrim(p_creator_name))
     and m.secret_hash = extensions.crypt(p_secret_word, m.secret_hash);

  if not found then
    raise exception 'That name and secret word don''t match this CD.';
  end if;
end;
$$;


-- 6. Let the website (the "anon" role) call those four functions.
revoke execute on function public.publish_mixtape(text, text, text, jsonb, jsonb, jsonb) from public;
revoke execute on function public.my_mixtapes(text, text)                                from public;
revoke execute on function public.update_mixtape(uuid, text, text, text, jsonb, jsonb, jsonb) from public;
revoke execute on function public.delete_mixtape(uuid, text, text)                       from public;

grant execute on function public.publish_mixtape(text, text, text, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.my_mixtapes(text, text)                                to anon, authenticated;
grant execute on function public.update_mixtape(uuid, text, text, text, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.delete_mixtape(uuid, text, text)                       to anon, authenticated;
