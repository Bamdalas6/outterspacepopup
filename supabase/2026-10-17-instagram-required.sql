-- Optional: make Instagram required in the database too (the website already requires it).
-- Run once in Supabase → SQL Editor. NOT VALID means it applies to new registrations only, so earlier rows without an
-- Instagram handle (such as the test row) are left as they are.
alter table public.guest_list
  add constraint guest_list_instagram_required
  check (instagram is not null and instagram ~ '^@[A-Za-z0-9._]{1,30}$') not valid;
