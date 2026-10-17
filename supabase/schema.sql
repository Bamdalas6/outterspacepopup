-- Outterspace pop-up guest list. Paste this whole file into Supabase → SQL Editor → New query, and run it once.
--
-- What it sets up:
--   guest_list  one row per registration. The public website may only ADD rows (never read, change or delete them).
--   admins      the email addresses allowed to read the guest list from /admin after signing in.
-- Row Level Security is on for both tables, so the public key in the website cannot read anyone's details.

create table if not exists public.guest_list (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null check (char_length(name) between 2 and 120),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 200),
  phone           text not null check (char_length(phone) between 7 and 30),
  coming_as       text not null check (coming_as in ('New Buyer', 'Repeat Buyer', 'Content Creator', 'Fashion Enthusiast', 'Window Shopping', 'Community')),
  instagram       text check (char_length(instagram) <= 60),
  city            text check (char_length(city) <= 80),
  guests          smallint not null default 1 check (guests between 1 and 4),
  favourite_look  text check (char_length(favourite_look) <= 80),
  consent         boolean not null check (consent = true)
);

-- One registration per email address. A second sign-up with the same email is refused, and the site tells the guest
-- they are already on the list.
create unique index if not exists guest_list_email_key on public.guest_list (lower(email));

create table if not exists public.admins (
  email text primary key
);

alter table public.guest_list enable row level security;
alter table public.admins enable row level security;

-- Anyone visiting the site may add themselves to the list...
drop policy if exists "Anyone can join the guest list" on public.guest_list;
create policy "Anyone can join the guest list" on public.guest_list
  for insert to anon, authenticated
  with check (consent = true);

-- ...but only signed-in admins can read it.
drop policy if exists "Admins can read the guest list" on public.guest_list;
create policy "Admins can read the guest list" on public.guest_list
  for select to authenticated
  using (exists (select 1 from public.admins a where lower(a.email) = lower(auth.jwt() ->> 'email')));

-- Admins can remove a registration (for example a test entry or a guest who asks to be removed).
drop policy if exists "Admins can delete from the guest list" on public.guest_list;
create policy "Admins can delete from the guest list" on public.guest_list
  for delete to authenticated
  using (exists (select 1 from public.admins a where lower(a.email) = lower(auth.jwt() ->> 'email')));

-- A signed-in user may check whether they themselves are an admin (the /admin page uses this).
drop policy if exists "Admins can see their own admin row" on public.admins;
create policy "Admins can see their own admin row" on public.admins
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- The website's public key needs permission to insert; the policies above still decide which rows.
grant insert on public.guest_list to anon, authenticated;
grant select, delete on public.guest_list to authenticated;
grant select on public.admins to authenticated;

-- LAST STEP: put your own email address here (the one you will sign in to /admin with), then run this line.
-- insert into public.admins (email) values ('you@example.com');
