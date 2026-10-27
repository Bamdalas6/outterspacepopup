-- Outterspace pop-up guest list on Cloudflare D1 (SQLite).
-- Applied with:  npm run db:migrate   (or db:migrate:local for the local copy used by `npm run cf:dev`)
--
--   guest_list   one row per registration. Only the /api/register function adds rows; only signed-in admins read them.
--   admins       who can sign in to /admin. Passwords are stored as PBKDF2-SHA256 hashes, never as text.
--   rate_limits  counters that slow down repeated sign-ups and password guesses from one address.

CREATE TABLE IF NOT EXISTS guest_list (
  id              TEXT PRIMARY KEY,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  email           TEXT NOT NULL CHECK (length(email) BETWEEN 5 AND 200 AND email LIKE '%_@_%._%'),
  phone           TEXT NOT NULL CHECK (length(phone) BETWEEN 7 AND 30),
  coming_as       TEXT NOT NULL CHECK (coming_as IN ('New Buyer', 'Repeat Buyer', 'Content Creator', 'Fashion Enthusiast', 'Window Shopping', 'Community')),
  -- required for new sign-ups (the site and /api/register check it); empty only for rows imported from before
  instagram       TEXT CHECK (instagram IS NULL OR length(instagram) <= 60),
  city            TEXT CHECK (city IS NULL OR length(city) <= 80),
  guests          INTEGER NOT NULL DEFAULT 1 CHECK (guests BETWEEN 1 AND 4),
  favourite_look  TEXT CHECK (favourite_look IS NULL OR length(favourite_look) <= 80),
  consent         INTEGER NOT NULL CHECK (consent = 1),
  -- what happened to the receipt email: 'sent', 'failed', 'off' (email not set up) or NULL (not tried yet)
  email_status    TEXT
);

-- One registration per email address. A second sign-up with the same email is refused, and the site tells the guest
-- they are already on the list.
CREATE UNIQUE INDEX IF NOT EXISTS guest_list_email ON guest_list (lower(email));
CREATE INDEX IF NOT EXISTS guest_list_created ON guest_list (created_at);

CREATE TABLE IF NOT EXISTS admins (
  email          TEXT PRIMARY KEY COLLATE NOCASE,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  added_by       TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL,
  reset_at  INTEGER NOT NULL
);
