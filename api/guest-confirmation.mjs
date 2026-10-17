// Sends each new guest a confirmation email the moment they join the pop-up guest list.
// Plain JavaScript (ES module) with Vercel's classic (req, res) handler, so Vercel runs it with no compile step.
//
// How it is wired (see EMAIL_SETUP.md):
//   1. Someone registers on the site → a row is added to Supabase's `guest_list` table.
//   2. A Supabase Database Webhook on that table calls this function (POST /api/guest-confirmation) with the new row,
//      and a secret header so nobody else can make the site send email.
//   3. This function sends the email through Resend.
//
// Vercel Environment Variables it needs (Settings → Environment Variables):
//   RESEND_API_KEY         the Resend API key (secret)
//   GUEST_WEBHOOK_SECRET   any long random string; the same value goes in the Supabase webhook's x-webhook-secret header
//   EMAIL_FROM             who the email is from, e.g.  Outterspace <popup@outterspaceluxury.com>
//   EMAIL_REPLY_TO         optional: where replies go, e.g.  outterspace@outterspaceluxury.com

import { renderConfirmation } from "./_email.mjs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Compares two strings in constant time, so the secret cannot be guessed one character at a time. */
function sameSecret(a, b) {
  if (typeof a !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Vercel parses JSON bodies into req.body; fall back to reading the stream if it did not. */
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST" });

  const secret = process.env.GUEST_WEBHOOK_SECRET || "";
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || "";
  if (!secret || !apiKey || !from) {
    console.error("guest-confirmation: missing GUEST_WEBHOOK_SECRET, RESEND_API_KEY or EMAIL_FROM");
    return send(res, 500, { error: "Email is not set up on the server" });
  }
  const header = req.headers["x-webhook-secret"];
  if (!sameSecret(Array.isArray(header) ? header[0] : header, secret)) return send(res, 401, { error: "Unauthorized" });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: "Expected JSON" }); }
  // Only new guest list rows send email; anything else the webhook might deliver is acknowledged and ignored.
  if (!body || body.type !== "INSERT" || body.table !== "guest_list" || !body.record) return send(res, 200, { skipped: true });

  const guest = body.record;
  if (!guest.email || !EMAIL.test(guest.email)) return send(res, 200, { skipped: "no valid email" });

  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const site = (process.env.SITE_URL || (host ? `https://${host}` : "")).replace(/\/$/, "");
  const { subject, html, text } = renderConfirmation(guest, site);

  let r;
  try {
    r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [guest.email],
        subject,
        html,
        text,
        ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
        tags: [{ name: "kind", value: "guest_confirmation" }],
      }),
    });
  } catch (e) {
    console.error("guest-confirmation: could not reach Resend", e);
    return send(res, 502, { error: "Could not reach the email provider" });
  }
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    console.error(`guest-confirmation: Resend refused (${r.status}) for ${guest.id || "unknown row"}: ${detail}`);
    // A 5xx makes Supabase record the failure in its webhook log, which is where to look if an email went missing.
    return send(res, 502, { error: "Email provider refused the message" });
  }
  const sent = await r.json().catch(() => ({}));
  return send(res, 200, { sent: true, id: sent.id });
}
