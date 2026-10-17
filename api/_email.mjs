// The guest list confirmation email (plain JavaScript so Vercel loads it with no compile step): a table-based layout with inline styles so it holds together in Gmail, Outlook and
// Apple Mail, plus a plain-text version. Files starting with "_" in /api are helpers, not endpoints.

/** @typedef {{ id?: string, name?: string, email?: string, phone?: string, instagram?: string | null, coming_as?: string, city?: string | null, guests?: number, favourite_look?: string | null }} GuestRecord */

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** @param {GuestRecord} g @param {string} site */
export function renderConfirmation(g, site) {
  const first = (g.name ?? "").trim().split(/\s+/)[0] || "there";
  const party = g.guests && g.guests > 1 ? `You + ${g.guests - 1} guest${g.guests > 2 ? "s" : ""}` : "Just you";
  const rows = [
    ["Name", g.name ?? ""],
    ["WhatsApp", g.phone ?? ""],
    ...(g.instagram ? [["Instagram", g.instagram]] : []),
    ["Coming as", g.coming_as ?? ""],
    ["Party", party],
    ...(g.favourite_look ? [["Favourite look", g.favourite_look]] : []),
  ];
  const subject = `Your guest list receipt, ${first} — Outterspace Cowboy Series pop-up`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f3f1;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your spot for the first Outterspace pop-up is saved. Date and venue are on the way.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f1;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
    <tr><td style="padding:28px 32px 8px;">
      <img src="${esc(site)}/editorial/logo.png" width="150" alt="OUTTERSPACE" style="display:block;border:0;width:150px;height:auto;">
    </td></tr>
    <tr><td style="padding:24px 32px 0;">
      <p style="margin:0 0 10px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#4cbf2a;">&#9679; You are on the guest list</p>
      <h1 style="margin:0;font:800 34px/1.02 Arial Black,Arial,Helvetica,sans-serif;letter-spacing:-.02em;text-transform:uppercase;color:#0d0d0d;">See you there,<br>${esc(first)}.</h1>
      <p style="margin:18px 0 0;font:400 16px/1.55 Arial,Helvetica,sans-serif;color:#4d4d49;">Your spot at the <b style="color:#0d0d0d;">first Outterspace pop-up</b> for the Cowboy Series SS26 is saved. It happens in <b style="color:#0d0d0d;">November 2026</b>. We will send you the exact date and venue on WhatsApp and here.</p>
    </td></tr>
    <tr><td style="padding:24px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px dashed #0d0d0d;border-radius:18px;">
        <tr><td style="padding:16px 20px 6px;font:700 11px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#ff4b1f;">Admit one &middot; Cowboy Series pop-up</td></tr>
        ${rows.map(([k, v]) => `<tr><td style="padding:6px 20px;"><span style="display:inline-block;width:120px;font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#6b6b67;">${esc(k)}</span><span style="font:600 15px/1.4 Arial,Helvetica,sans-serif;color:#0d0d0d;">${esc(v)}</span></td></tr>`).join("")}
        <tr><td style="padding:6px 20px 16px;"></td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:28px 32px 0;">
      <a href="${esc(site)}/#lookbook" style="display:inline-block;padding:16px 28px;border-radius:999px;background:#0d0d0d;color:#ffffff;font:700 12px/1 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;">See the lookbook</a>
    </td></tr>
    <tr><td style="padding:28px 32px 32px;">
      <p style="margin:0;font:400 13px/1.55 Arial,Helvetica,sans-serif;color:#8a8a85;">You are getting this because you joined the Outterspace pop-up guest list at ${esc(site.replace(/^https?:\/\//, ""))}. Reply to this email if you need to change your details or would like to be removed.</p>
    </td></tr>
  </table>
  <p style="margin:18px 0 0;font:600 10px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#a3a39e;">Outterspace &middot; Department of Design &middot; Cowboy Series SS26</p>
</td></tr>
</table>
</body></html>`;

  const text = [
    `You are on the guest list, ${first}.`,
    "",
    "Your spot at the first Outterspace pop-up for the Cowboy Series SS26 is saved. It happens in November 2026.",
    "We will send you the exact date and venue on WhatsApp and here.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    `See the lookbook: ${site}/#lookbook`,
    "",
    "Reply to this email if you need to change your details or would like to be removed.",
    "Outterspace · Department of Design · Cowboy Series SS26",
  ].join("\n");

  return { subject, html, text };
}
