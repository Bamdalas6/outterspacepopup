// Sends each new guest a confirmation email the moment they join the pop-up guest list.
//
// How it is wired (see EMAIL_SETUP.md):
//   1. Someone registers on the site → a row is added to Supabase's `guest_list` table.
//   2. A Supabase Database Webhook on that table calls this function (POST /api/guest-confirmation) with the new row,
//      and a secret header so nobody else can make the site send email.
//   3. This function sends the email through Resend.
//
// Vercel runs this file as a Vercel Function; it needs these Environment Variables (Settings → Environment Variables):
//   RESEND_API_KEY         the Resend API key (secret)
//   GUEST_WEBHOOK_SECRET   any long random string; the same value goes in the Supabase webhook's header
//   EMAIL_FROM             who the email is from, e.g.  Outterspace <popup@outterspaceluxury.com>
//   EMAIL_REPLY_TO         optional: where replies go, e.g.  outterspace@outterspaceluxury.com

import { renderConfirmation, type GuestRecord } from "./_email";

type WebhookBody = { type?: string; table?: string; schema?: string; record?: GuestRecord };

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Compares two strings in constant time, so the secret cannot be guessed one character at a time. */
function sameSecret(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.GUEST_WEBHOOK_SECRET ?? "";
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "";
  if (!secret || !apiKey || !from) {
    console.error("guest-confirmation: missing GUEST_WEBHOOK_SECRET, RESEND_API_KEY or EMAIL_FROM");
    return json(500, { error: "Email is not set up on the server" });
  }
  if (!sameSecret(request.headers.get("x-webhook-secret") ?? "", secret)) return json(401, { error: "Unauthorized" });

  let body: WebhookBody;
  try { body = (await request.json()) as WebhookBody; } catch { return json(400, { error: "Expected JSON" }); }
  // Only new guest list rows send email; anything else the webhook might deliver is acknowledged and ignored.
  if (body.type !== "INSERT" || body.table !== "guest_list" || !body.record) return json(200, { skipped: true });

  const guest = body.record;
  if (!guest.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guest.email)) return json(200, { skipped: "no valid email" });

  const site = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const { subject, html, text } = renderConfirmation(guest, site);

  const res = await fetch("https://api.resend.com/emails", {
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
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`guest-confirmation: Resend refused (${res.status}) for ${guest.id ?? "unknown row"}: ${detail}`);
    // A 5xx makes Supabase record the failure in its webhook log, which is where to look if an email went missing.
    return json(502, { error: "Email provider refused the message" });
  }
  const sent = (await res.json().catch(() => ({}))) as { id?: string };
  return json(200, { sent: true, id: sent.id });
}

export function GET(): Response {
  return json(405, { error: "Use POST" });
}
