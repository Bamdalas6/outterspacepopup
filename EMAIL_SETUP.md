# Send guests a confirmation email

When someone joins the guest list, they get an email straight away: "See you there, [name]", with their details and a
link back to the lookbook. About 15 minutes to set up, plus however long your domain's DNS takes to update.

How it works: Supabase notices each new row in `guest_list` → it calls `/api/guest-confirmation` on your Vercel site →
that sends the email through **Resend** (free for up to 3,000 emails a month).

## 1. Create a Resend account and add your domain

1. Sign up at https://resend.com.
2. Open **Domains** → **Add Domain** and enter `outterspaceluxury.com` (or a subdomain such as `mail.outterspaceluxury.com`).
3. Resend shows a few DNS records (TXT and MX). Add them where your domain's DNS is managed (for example Shopify,
   GoDaddy, Namecheap or Cloudflare), then click **Verify** in Resend. It can take from a few minutes to a few hours.

   Until the domain is verified, Resend only delivers to your own Resend sign-up email, so test with that address.

## 2. Create a Resend API key

1. In Resend open **API Keys** → **Create API Key**.
2. Name it `outterspace-popup`, permission **Sending access**, domain the one you added. Copy the key (starts `re_`).
   It is shown once.

## 3. Add four Environment Variables in Vercel

Vercel → project **outterspacepopup** → **Settings** → **Environment Variables**. Add each one for **Production** and
**Preview**:

| Key | Value |
| --- | --- |
| `RESEND_API_KEY` | the key from step 2 (`re_...`) |
| `GUEST_WEBHOOK_SECRET` | a long random string you make up, at least 32 characters. Keep it; you need it in step 4 |
| `EMAIL_FROM` | `Outterspace <popup@outterspaceluxury.com>` (any address at the domain you verified) |
| `EMAIL_REPLY_TO` | where guests' replies should go, e.g. `outterspace@outterspaceluxury.com` |

Then **Deployments** → ⋯ on the latest → **Redeploy**.

## 4. Tell Supabase to call the site on each new registration

1. Supabase → **Database** → **Webhooks** (enable webhooks if asked) → **Create a new hook**.
2. Fill it in:
   - **Name:** `guest-confirmation`
   - **Table:** `guest_list`
   - **Events:** tick **Insert** only
   - **Type:** **HTTP Request**
   - **Method:** `POST`
   - **URL:** `https://outterspacepopup.vercel.app/api/guest-confirmation`
     (use your custom domain instead if you add one)
   - **HTTP Headers:** add `Content-type` = `application/json`, and add `x-webhook-secret` = the same string you used
     for `GUEST_WEBHOOK_SECRET`
   - **Timeout:** `5000`
3. Click **Create webhook**.

## 5. Test

1. Register on the live site with your own email.
2. The email should arrive within a minute (check Spam the first time).
3. If it does not: Supabase → **Database** → **Webhooks** → `guest-confirmation` shows each call and its response.
   - `401 Unauthorized` → the `x-webhook-secret` header does not match `GUEST_WEBHOOK_SECRET` exactly.
   - `500 Email is not set up on the server` → a Vercel variable is missing, or you did not redeploy after adding it.
   - `502 Email provider refused` → Resend refused it: usually the domain is not verified yet, or `EMAIL_FROM` is not at
     the verified domain. Resend → **Emails** / **Logs** shows the reason.

## Notes

- One email per registration. Someone who tries to register again with the same email is told they are already on the
  list, and is not emailed twice.
- The email says the date and venue will follow. When you have them, send them to the list from Resend (Broadcasts) or
  any mailing tool, using the Excel export from `/admin`.
- The secret header means nobody else can make your site send emails.
