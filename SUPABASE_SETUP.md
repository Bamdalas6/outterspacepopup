# Connect the guest list to Supabase

About 10 minutes. You need a free Supabase account (https://supabase.com).

## 1. Create the project

1. Sign in to Supabase and click **New project**.
2. Name it (for example `outterspace-popup`), set a database password (keep it somewhere safe), and pick the region
   closest to your guests (for Nigeria, **West EU (London)** or **Central EU (Frankfurt)**).
3. Wait for it to finish setting up.

## 2. Create the guest list table

1. In the left menu open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy everything, paste it in and click **Run**.
3. At the bottom of that file is one line to add yourself as an admin. In a new query, run it with your own email:

   ```sql
   insert into public.admins (email) values ('your-email@example.com');
   ```

## 3. Create your admin sign-in

1. Open **Authentication** → **Users** → **Add user** → **Create new user**.
2. Use the **same email** you put in the admins table, choose a password, and tick **Auto Confirm User**.

This is the email and password you will use on the site's `/admin` page. To give someone else access, repeat step 3
for them and add their email to `admins` as in step 2.

## 4. Connect the website

1. Open **Project Settings** → **API** (or **API Keys**).
2. Copy the **Project URL** and the **anon public** key (it may be called the **publishable** key).
3. In this project, copy `.env.local.example` to `.env.local` and paste them in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (or sb_publishable_...)
   ```

4. Restart the site (`npm run dev`). Never paste the **service_role** / **secret** key anywhere in the website.

When you deploy (Cloudflare Pages, Vercel, Netlify), add the same two variables in the host's environment settings
and rebuild.

## 5. Check it works

1. Open the site, fill in the guest list form and submit.
2. In Supabase open **Table Editor** → `guest_list`: your registration is there.
3. Open `/admin` on the site, sign in, and click **Download Excel**.

## Getting the list out

- **Excel:** `/admin` → **Download Excel**. The file has two sheets: *Guest list* (every registration) and *Summary*
  (totals, and counts by Coming as, city and favourite look).
- **CSV:** Supabase → **Table Editor** → `guest_list` → **Export** → **Export table as CSV** (opens in Excel too).
- **Remove a registration:** `/admin` → **Remove** on its row, or delete the row in the Table Editor.

## What is protected

- The website's key can only **add** registrations. It cannot read, change or delete anyone's details.
- Only signed-in users whose email is in `admins` can read or remove registrations.
- Each email can register once; a second attempt is told they are already on the list.
- The table checks every field (valid email, consent given, one of the six "Coming as" options, 1 to 4 people).
