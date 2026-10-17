// A quick check of how the live site is set up: GET /api/health.
// It only says WHETHER each setting exists on Vercel (true / false), never its value, so it is safe to leave public.
// NEXT_PUBLIC_* settings are baked into the pages when the site is built; the rest are read by the email function.

const SETTINGS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "RESEND_API_KEY",
  "GUEST_WEBHOOK_SECRET",
  "EMAIL_FROM",
  "EMAIL_REPLY_TO",
];

export default function handler(req, res) {
  const present = Object.fromEntries(SETTINGS.map((k) => [k, Boolean((process.env[k] || "").trim())]));
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    environment: process.env.VERCEL_ENV || "unknown",
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "unknown",
    settings: present,
    // Shape checks only, so a typo is easy to spot without revealing anything.
    supabaseUrlLooksRight: url ? /^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url) : null,
    supabaseKeyLooksRight: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? /^(sb_publishable_|eyJ)/.test(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) : null,
  }, null, 2));
}
