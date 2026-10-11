-- Rust Base Finder: maps + generator queue.
--
-- HOW TO RUN: Supabase dashboard → your project → SQL Editor → New query →
-- paste this whole file → Run. Safe to run more than once.
--
-- One row per map. The row is also the generator's to-do item:
--   queued → generating → ready   (or failed)

create table if not exists public.maps (
  key           text primary key,          -- e.g. 'proc:4500_123456'
  seed          bigint,
  size          integer not null check (size between 1000 and 6000),
  source        text not null default 'generated' check (source in ('generated', 'upload')),
  status        text not null default 'queued' check (status in ('queued', 'generating', 'ready', 'failed')),
  error         text,                       -- why it failed (shown to the site owner, not users)
  info          jsonb,                      -- map summary (monuments, biomes…) once ready
  image_path    text,                       -- file in the 'maps' storage bucket
  package_path  text,                       -- full terrain data file in the 'maps' storage bucket
  attempts      integer not null default 0,
  worker_id     text,                       -- which generator PC is working on it
  requested_at  timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists maps_queue_idx on public.maps (requested_at) where status = 'queued';

-- Row Level Security ON with no policies = the public (anon/logged-in) keys can't read or
-- write this table at all. Only our server code (using the secret key) can.
alter table public.maps enable row level security;

-- The generator calls this to take the oldest queued map. "skip locked" means two
-- generator PCs can never grab the same map.
create or replace function public.claim_next_map(worker text)
returns setof public.maps
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- A generator that crashed mid-job: put its map back in the queue (or give up after 3 tries).
  update public.maps
     set status = case when attempts >= 3 then 'failed' else 'queued' end,
         error = case when attempts >= 3 then 'Gave up after 3 attempts' else error end,
         worker_id = null
   where status = 'generating'
     and started_at < now() - interval '45 minutes';

  return query
  update public.maps m
     set status = 'generating',
         started_at = now(),
         worker_id = worker,
         attempts = m.attempts + 1
   where m.key = (
           select q.key from public.maps q
            where q.status = 'queued'
            order by q.requested_at
            limit 1
              for update skip locked
         )
  returning m.*;
end;
$$;

revoke all on function public.claim_next_map(text) from public, anon, authenticated;
grant execute on function public.claim_next_map(text) to service_role;

-- Storage for map images and terrain data. Public READ (they're just pictures and
-- numbers about a game map); only the secret key can upload.
insert into storage.buckets (id, name, public)
values ('maps', 'maps', true)
on conflict (id) do nothing;
