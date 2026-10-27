# Outterspace — Cowboy Series Pop-Up Guest List

Built on the brief's template (huge wide type with the product floating across it, barcode block, accent tile, pill
and circle buttons, bento cards) in Next.js 16 with Motion.

- **The stage** (`src/components/Hero.tsx`): "COWBOY" and the piece's own word set huge, the piece floating in the
  middle. Every 4 seconds the next piece swings in; the word rolls over letter by letter and the accent colour, glow and
  tile follow it. Drag or swipe the piece, use the arrows or arrow keys, or pick from the strip.
- **Bento cards, lookbook, collection** (`src/components/Sections.tsx`): the coloured card shows whatever is on stage;
  the lookbook drags sideways (three looks open, six more open on joining); clicking a piece in the collection puts it
  on stage.
- **Guest list**: the form that collects details, with confetti when someone joins. No prices anywhere.
- **Data** is in `src/data/collection.ts` (names, headline word, accent colour per piece).

## Run

```bash
npm install
npm run dev        # the site only, http://127.0.0.1:3400 (the form needs the backend: use cf:dev to try it)
npm run cf:dev     # site + backend on Cloudflare's local runtime, http://127.0.0.1:8788 (see CLOUDFLARE_SETUP.md)
npm run build      # static site in ./out
npm run typecheck  # site and backend
```

## Hosting: Cloudflare

The site runs on **Cloudflare Pages**, with its backend as **Pages Functions** and the guest list in a **D1** database.
Follow **CLOUDFLARE_SETUP.md** once: sign in, create the database, deploy, add the secrets and create your admin.

| Path | What it is |
| --- | --- |
| `functions/api/register.ts` | `POST /api/register`: checks a registration again on the server, saves it and emails the receipt |
| `functions/api/admin/*` | Admin sign-in, the guest list, removing guests, managing admins (guarded by `_middleware.ts`) |
| `functions/api/health.ts` | `GET /api/health`: which settings are in place (yes/no only) |
| `server/` | Shared backend code: password hashing and sessions, the receipt email, rate limits |
| `src/lib/guest-rules.ts` | The registration rules, shared by the form and the server |
| `migrations/` | The D1 tables |
| `scripts/import-supabase-csv.mjs` | Copies registrations exported from the old Supabase project into D1 |

## Where registrations go

Into the D1 table `guest_list`.

- **See and export them:** open `/admin`, sign in, and use **Download Excel** (two sheets: the full guest list and a
  summary by Coming as, city and favourite look). The Receipt column shows whether each guest's email went out.
- **Receipt email:** every new guest gets a branded "See you there" email straight away, sent through Resend by
  `/api/register` once their spot is saved.
- **Admins:** the first admin is created at `/admin` with the one-time setup code; after that, admins add and remove
  each other in the Admins panel. Passwords are stored only as salted hashes.
- **Security:** the public site can only add registrations; only signed-in admins can read or remove them. One
  registration per email; repeated sign-ups and password guesses from one connection are slowed down.

Before launch: replace the date and venue wording in `src/components/Sections.tsx` and `Hero.tsx`, and the bracketed
details in `src/app/privacy/page.tsx`.
