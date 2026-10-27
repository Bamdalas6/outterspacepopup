# Putting the guest list live on Cloudflare

Everything runs on Cloudflare's free plan:

- **Cloudflare Pages** serves the site, the static files in `out/`.
- **Pages Functions** are the backend in `functions/api/`: saving registrations, the admin sign-in and the receipt email.
- **D1** is the database the guest list is stored in.

You do steps 1–4 once. Run the commands in a terminal inside the `outterspace` folder.

## 1. Sign in to Cloudflare

Create a free account at https://dash.cloudflare.com if you don't have one, then:

```bash
npx wrangler login
```

A browser window opens; click **Allow**.

## 2. Create the database

```bash
npx wrangler d1 create outterspace-guests
```

It prints a block that includes `database_id = "…"`. Open `wrangler.toml` and replace the
`00000000-0000-0000-0000-000000000000` placeholder with that id. Then create the tables:

```bash
npm run db:migrate
```

## 3. Create the site

```bash
npm run deploy
```

The first time, Wrangler asks to create a Pages project. Accept the name **outterspacepopup** and use **main** as the
production branch. When it finishes, the site is at **https://outterspacepopup.pages.dev**.

## 4. Add the secrets

These are set on Cloudflare and never go in the code. Run each line; Wrangler asks you to paste the value.

```bash
npx wrangler pages secret put SESSION_SECRET
npx wrangler pages secret put ADMIN_SETUP_CODE
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put EMAIL_FROM
npx wrangler pages secret put EMAIL_REPLY_TO
```

| Secret | What to paste |
| --- | --- |
| `SESSION_SECRET` | Any long random string (40+ characters). It signs admin sign-ins; changing it signs everyone out. |
| `ADMIN_SETUP_CODE` | A code you make up. It's used once, to create the first admin (step 5). |
| `RESEND_API_KEY` | Your Resend API key (https://resend.com → API Keys), for the receipt email. |
| `EMAIL_FROM` | Who the receipt is from, e.g. `Outterspace <popup@outterspaceluxury.com>`. The domain must be verified in Resend. |
| `EMAIL_REPLY_TO` | Optional: where replies go, e.g. `outterspace@outterspaceluxury.com`. |

Then run `npm run deploy` again so the site picks the secrets up. The same secrets can also be added in the dashboard:
**Workers & Pages → outterspacepopup → Settings → Variables and Secrets**.

Check it: **https://outterspacepopup.pages.dev/api/health** shows `"database": "connected"` and `true` for each secret
you set. It never shows the values themselves.

## 5. Create your admin account

Open **https://outterspacepopup.pages.dev/admin**. Because there's no admin yet, it asks for the setup code from step 4,
your email and a password (at least 10 characters). That signs you in. Use the **Admins** panel to add other people:
give them a starting password privately, and they can change it there after signing in. You can remove an admin at any
time, and they're signed out immediately.

## Bring over the old Supabase registrations (optional)

1. In Supabase, open the paused project and click **Restore project** (free projects can be restored for 90 days).
2. **Table Editor → guest_list → Export → Export table as CSV**.
3. Run:

   ```bash
   npm run import:supabase -- path/to/guest_list_rows.csv
   ```

Guests already in the new list (same email) are skipped, so running it twice does no harm. Imported guests show
"–" in the Receipt column, because they got their email from the old system.

## Updating the site

After a code change, run `npm run deploy`. To have Cloudflare build from GitHub on every push instead:
**Workers & Pages → outterspacepopup → Settings → Builds → Connect** the `Bamdalas6/outterspacepopup` repository, with
build command `npm run build` and output directory `out`.

## Your own domain (optional)

**Workers & Pages → outterspacepopup → Custom domains → Set up a custom domain**, e.g. `popup.outterspaceluxury.com`,
and follow the DNS steps. Then set the build variable `NEXT_PUBLIC_SITE_URL` to that address (for link previews) and the
secret `SITE_URL` to the same address (for links in the email), and deploy again.

## Running it on your computer

```bash
cp .dev.vars.example .dev.vars      # then fill in SESSION_SECRET and ADMIN_SETUP_CODE
npm run db:migrate:local
npm run cf:dev                      # http://127.0.0.1:8788, the site and the backend together
```

The local database is separate from the live one (it lives in `.wrangler/`).
