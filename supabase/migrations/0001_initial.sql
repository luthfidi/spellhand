-- ─────────────────────────────────────────────────────────────
-- Spellhand — initial schema (Phase 2)
--
-- Run this in the Supabase SQL editor for your project.
-- Order matters: tables → trigger → RLS → view → grants.
-- ─────────────────────────────────────────────────────────────

-- ─── profiles ──────────────────────────────────────────────────
-- 1:1 with auth.users. Auto-created on signup via trigger below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_hand text check (preferred_hand in ('left', 'right')) default 'right',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user reads own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles: user updates own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── certificates ──────────────────────────────────────────────
-- One certificate per user. Issued after completing the Challenge.
-- share_token is unguessable (random UUID, dashes stripped) and used
-- as the public URL slug for /cert/[token].
create table public.certificates (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  issued_at timestamptz not null default now(),
  share_token text not null unique default replace (gen_random_uuid ()::text, '-', '')
);

create index certificates_share_token_idx on public.certificates (share_token);

alter table public.certificates enable row level security;

create policy "certificates: user reads own"
  on public.certificates for select
  to authenticated
  using (auth.uid() = user_id);

create policy "certificates: user issues own"
  on public.certificates for insert
  to authenticated
  with check (auth.uid() = user_id);


-- ─── certificate_public ────────────────────────────────────────
-- Read-only view for the public share page. Exposes only display
-- fields — never the user_id. Anyone (incl. anon) can SELECT by
-- share_token to render the certificate at /cert/[token].
create view public.certificate_public
with (security_invoker = off) as
select
  share_token,
  display_name,
  issued_at
from
  public.certificates;

grant select on public.certificate_public to anon, authenticated;
