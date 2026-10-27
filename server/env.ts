// What the Cloudflare Pages Functions receive. DB is the D1 binding from wrangler.toml; the rest are Pages secrets /
// environment variables (CLOUDFLARE_SETUP.md), or .dev.vars when running locally.

export interface Env {
  DB: D1Database;
  /** Long random string that signs admin sessions. Required for /admin. */
  SESSION_SECRET?: string;
  /** One-time code that lets you create the first admin from /admin. Not needed once an admin exists. */
  ADMIN_SETUP_CODE?: string;
  /** Resend API key, for the guest list receipt email. */
  RESEND_API_KEY?: string;
  /** Who the receipt comes from, e.g.  Outterspace <popup@outterspaceluxury.com> */
  EMAIL_FROM?: string;
  /** Optional: where replies to the receipt go. */
  EMAIL_REPLY_TO?: string;
  /** Optional: the site's public address for links in the email; defaults to the address the request came in on. */
  SITE_URL?: string;
}

export type Fn = PagesFunction<Env, string, { admin?: string }>;
