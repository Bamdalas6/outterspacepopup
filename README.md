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
npm run dev        # http://127.0.0.1:3400
npm run build      # static site in ./out, host it anywhere
```

## Where registrations go

Into a Supabase table (`guest_list`). Follow **SUPABASE_SETUP.md** once: create the project, run
`supabase/schema.sql`, add yourself as an admin, and put the project URL and public key in `.env.local`.

- **See and export them:** open `/admin`, sign in, and use **Download Excel** (two sheets: the full guest list and a
  summary by Coming as, city and favourite look). You can also browse and export CSV in Supabase's Table Editor.
- **Security:** the public site can only add registrations; only signed-in admins can read or remove them. One
  registration per email.

Before launch: replace the date and venue wording in `src/components/Sections.tsx` and `Hero.tsx`, and the bracketed
details in `src/app/privacy/page.tsx`.
